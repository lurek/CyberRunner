import * as THREE from "three";
import { getFromPool } from "../../utils/poolUtils.js";
import { addObstacleMetadata } from "./CollisionFixes.js";
import { BarObstacleSystem } from "../systems/BarObstacleSystem.js";
import { SlidingObstacleSystem } from "../systems/SlidingObstacleSystem.js";
import { UnavoidableObstacleSystem, VariableHeightBarSystem } from "../systems/UnavoidableObstacleSystem.js";
import {
  createShieldShape,
  createZapShape,
  createMagnetShape,
  createHealthShape,
  createTimeShape
} from "../helpers/PowerUpShapes.js";
import { PowerUpModelLoader } from "../helpers/PowerUpModelLoader.js";

function buildComplexObstacle(type, geometries, materials) {
  const obst = new THREE.Group();
  obst.userData = {
    type: type,
    hitSound: 'crash',
    nearMissChecked: false,
    animTime: Math.random() * Math.PI * 2,
    isDynamic: false,
    localBox: new THREE.Box3(),
    worldBox: new THREE.Box3()
  };

  switch (type) {
    case 'wall':
      const postL = new THREE.Mesh(geometries.post, materials.barrier);
      postL.position.set(-1.2, 1.1, 0);
      obst.add(postL);
      const postR = new THREE.Mesh(geometries.post, materials.barrier);
      postR.position.set(1.2, 1.1, 0);
      obst.add(postR);
      const bar = new THREE.Mesh(geometries.bar, materials.barrier);
      bar.position.y = 1.8;
      obst.add(bar);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(2.4, 0.4, 0.3)
      );
      break;

    case 'drone':
      const droneBody = new THREE.Mesh(geometries.droneBody, materials.drone);
      obst.add(droneBody);
      const propFront = new THREE.Mesh(geometries.droneProp, materials.droneGlow);
      propFront.position.set(0, 0, 0.5);
      obst.add(propFront);
      const propBack = new THREE.Mesh(geometries.droneProp, materials.droneGlow);
      propBack.position.set(0, 0, -0.5);
      obst.add(propBack);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.0, 1.0, 1.5)
      );
      obst.userData.initialY = 1.5;
      obst.userData.floatTime = Math.random() * Math.PI * 2;
      obst.userData.isDynamic = true;
      break;

    case 'energy_barrier':
      const energyBarrierGroup = SlidingObstacleSystem.createEnergyBarrier(materials);
      obst.children.forEach(child => energyBarrierGroup.add(child));
      energyBarrierGroup.userData = {
        ...obst.userData,
        ...energyBarrierGroup.userData,
        requiresSlide: true,
        canSlideUnder: true
      };
      return energyBarrierGroup;

    case 'drone_turret':
      const droneTurretGroup = SlidingObstacleSystem.createDroneTurret(materials);
      droneTurretGroup.userData = {
        ...obst.userData,
        ...droneTurretGroup.userData,
        requiresSlide: true,
        canSlideUnder: true,
        isDynamic: true
      };
      return droneTurretGroup;

    case 'plasma_gate':
      const plasmaGateGroup = SlidingObstacleSystem.createPlasmaGate(materials);
      plasmaGateGroup.userData = {
        ...obst.userData,
        ...plasmaGateGroup.userData,
        requiresSlide: true,
        canSlideUnder: true,
        isDynamic: true
      };
      return plasmaGateGroup;

    // ✅ NEW: Tall wall - cannot jump over, must slide or change lane
    case 'tall_wall':
      const tallWallGroup = UnavoidableObstacleSystem.createTallWall(materials);
      tallWallGroup.userData = {
        ...obst.userData,
        ...tallWallGroup.userData,
        requiresSlide: false,
        canSlideUnder: false,
        canJumpOver: false
      };
      console.log('🧱 EntitySpawner: created tall_wall obstacle at', obst.position || 'spawn-point');
      return tallWallGroup;

    // ✅ NEW: High bar - slidable but not jumpable
    case 'bar_high':
      const highBarGroup = VariableHeightBarSystem.createHighBar(materials);
      highBarGroup.userData = {
        ...obst.userData,
        ...highBarGroup.userData,
        requiresSlide: true,
        canSlideUnder: true,
        canJumpOver: false
      };
      return highBarGroup;

    // ✅ NEW: Low bar - can be jumped or slid under (player choice)
    case 'bar_low':
      const lowBarGroup = VariableHeightBarSystem.createLowBar(materials);
      lowBarGroup.userData = {
        ...obst.userData,
        ...lowBarGroup.userData,
        canSlideUnder: true,
        canJumpOver: true
      };
      return lowBarGroup;

    case 'laser_grid':
      const laserPostL = new THREE.Mesh(geometries.laserPost, materials.laserPost);
      laserPostL.position.set(-1.5, 0.75, 0);
      obst.add(laserPostL);
      const laserPostR = new THREE.Mesh(geometries.laserPost, materials.laserPost);
      laserPostR.position.set(1.5, 0.75, 0);
      obst.add(laserPostR);
      const beam1 = new THREE.Mesh(geometries.laserBeam, materials.laserBeam);
      beam1.rotation.z = Math.PI / 2;
      beam1.position.y = 0.5;
      obst.add(beam1);
      const beam2 = new THREE.Mesh(geometries.laserBeam, materials.laserBeam);
      beam2.rotation.z = Math.PI / 2;
      beam2.position.y = 1.0;
      obst.add(beam2);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(3.2, 1.5, 0.1)
      );
      break;

    case 'moving_barrier':
      const movingBarrier = new THREE.Mesh(geometries.movingBarrier, materials.movingBarrier);
      movingBarrier.position.y = 1.0;
      obst.add(movingBarrier);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(1.0, 2.0, 0.4)
      );
      obst.userData.movingObstacle = true;
      obst.userData.isDynamic = true;
      obst.userData.moveTime = Math.random() * Math.PI * 2;
      obst.userData.moveAmplitude = 1.5;
      break;

    case 'pulse_barrier':
      const ring = new THREE.Mesh(geometries.pulseRing, materials.pulseBarrier);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.5;
      obst.add(ring);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(2.6, 2.6, 0.2)
      );
      obst.userData.isDynamic = true;
      obst.userData.hitSound = 'barrier_whoosh';
      break;

    case 'rotating_laser':
      const laserPost = new THREE.Mesh(geometries.laserGridPost, materials.laserGridPost);
      laserPost.position.y = 1.5;
      obst.add(laserPost);
      const beamHolder = new THREE.Group();
      beamHolder.name = "beamHolder";
      const beamA = new THREE.Mesh(geometries.laserGridBeam, materials.laserGrid);
      beamA.position.set(0, 0, 1.0);
      beamA.rotation.x = Math.PI / 2;
      beamHolder.add(beamA);
      const beamB = new THREE.Mesh(geometries.laserGridBeam, materials.laserGrid);
      beamB.position.set(0, 0, -1.0);
      beamB.rotation.x = Math.PI / 2;
      beamHolder.add(beamB);
      beamHolder.position.y = 1.5;
      obst.add(beamHolder);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0.5, 3.0, 2.5)
      );
      obst.userData.isDynamic = true;
      obst.userData.hitSound = 'laser_zap';
      break;

    // ✅ NEW: Hover Scooter - Parked e-scooter with neon underglow
    case 'scooter':
      // Deck (platform)
      const deck = new THREE.Mesh(geometries.scooterDeck, materials.scooter);
      deck.position.y = 0.3;
      obst.add(deck);
      // Handlebar post
      const handlePost = new THREE.Mesh(geometries.scooterHandle, materials.scooter);
      handlePost.position.set(0, 0.7, 0.5);
      obst.add(handlePost);
      // Handlebar
      const handleBar = new THREE.Mesh(geometries.scooterHandle, materials.scooter);
      handleBar.rotation.z = Math.PI / 2;
      handleBar.position.set(0, 1.0, 0.5);
      obst.add(handleBar);
      // Front wheel
      const frontWheel = new THREE.Mesh(geometries.scooterWheel, materials.scooter);
      frontWheel.rotation.x = Math.PI / 2;
      frontWheel.position.set(0, 0.15, 0.5);
      obst.add(frontWheel);
      // Rear wheel
      const rearWheel = new THREE.Mesh(geometries.scooterWheel, materials.scooter);
      rearWheel.rotation.x = Math.PI / 2;
      rearWheel.position.set(0, 0.15, -0.5);
      obst.add(rearWheel);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0.6, 1.0, 1.4)
      );
      obst.userData.hitSound = 'crash';
      break;

    // ✅ NEW: Industrial Dumpster - Large metal container
    case 'dumpster':
      const dumpsterBody = new THREE.Mesh(geometries.dumpster, materials.dumpster);
      dumpsterBody.position.y = 0.6;
      obst.add(dumpsterBody);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(1.8, 1.2, 1.0)
      );
      obst.userData.hitSound = 'crash';
      break;

    // ✅ NEW: Road Divider - Concrete Jersey barrier
    case 'road_divider':
      const divider = new THREE.Mesh(geometries.roadDivider, materials.roadDivider);
      divider.position.y = 0.4;
      obst.add(divider);
      obst.userData.localBox.setFromCenterAndSize(
        new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.6, 0.8, 2.0)
      );
      obst.userData.hitSound = 'crash';
      break;
  }

  return obst;
}

export class EntitySpawner {
  constructor(scene, constants, coinSparkles, powerUpAuras, difficultyManager, patternGenerator) {
    this.scene = scene;
    this.constants = constants;
    this.coinSparkles = coinSparkles;
    this.powerUpAuras = powerUpAuras;
    this.difficultyManager = difficultyManager;
    this.patternGenerator = patternGenerator;
    this.barSystem = new BarObstacleSystem(constants);
    this.slidingObstacleSystem = new SlidingObstacleSystem(constants);

    this.modelLoader = new PowerUpModelLoader();
    this.modelsLoaded = false;

    this.modelLoader.preloadAll().then(() => {
      this.modelsLoaded = true;
      console.log('✅ All power-up models ready!');
    }).catch(err => {
      console.warn('⚠️ Some models failed to load, using fallbacks:', err);
      this.modelsLoaded = true;
    });

    this.pools = {
      wall: [], drone: [], laser_grid: [], moving_barrier: [], pulse_barrier: [], rotating_laser: [],
      energy_barrier: [], drone_turret: [], plasma_gate: [],
      tall_wall: [], bar_high: [], bar_low: [],
      scooter: [], dumpster: [], road_divider: [],  // ✅ NEW: Realistic obstacles
      coin: [], powerUp: [], powerUpLight: [], box: [], spike: [], barrier: [],
    };

    this.poolIndices = {};
    Object.keys(this.pools).forEach(key => this.poolIndices[key] = { current: 0 });

    this.activeObstacles = [];
    this.activeCoins = [];
    this.activePowerUps = [];
    this.activeInstancedObstacles = [];
    this.activeEntities = {
      obstacles: this.activeObstacles,
      instancedObstacles: this.activeInstancedObstacles,
      coins: this.activeCoins,
      powerUps: this.activePowerUps
    };

    this.geometries = [];
    this.materials = [];
    this.dummy = new THREE.Object3D();
    this.initializePools();
  }

  initializePools() {
    this.obstacleGeometries = {
      // ✅ REALISTIC: Cargo shipping crate with slight bevel
      box: new THREE.BoxGeometry(1.3, 1.3, 1.3),
      // ✅ REALISTIC: Holographic warning sign (floating barrier)
      barrier: new THREE.BoxGeometry(2.5, 0.6, 0.15),
      // ✅ REALISTIC: Traffic cone shape (wider base, narrower top)
      spike: new THREE.ConeGeometry(0.4, 1.1, 8),
      // ✅ REALISTIC: Construction barrier posts (yellow/black striped)
      post: new THREE.BoxGeometry(0.25, 2.0, 0.25),
      // ✅ REALISTIC: Construction barrier bar
      bar: new THREE.BoxGeometry(2.2, 0.25, 0.25),
      // ✅ REALISTIC: Security drone body (sleek sphere)
      droneBody: new THREE.SphereGeometry(0.45, 16, 12),
      // ✅ REALISTIC: Drone propeller arms
      droneProp: new THREE.BoxGeometry(0.6, 0.08, 0.08),
      // ✅ REALISTIC: Security checkpoint post
      laserPost: new THREE.CylinderGeometry(0.1, 0.12, 1.6, 8),
      // ✅ REALISTIC: Laser beam (thin red line)
      laserBeam: new THREE.CylinderGeometry(0.04, 0.04, 3.0, 8),
      // ✅ REALISTIC: Traffic gate arm (boom barrier)
      movingBarrier: new THREE.BoxGeometry(0.15, 0.15, 2.5),
      // ✅ REALISTIC: Warning ring (holographic)
      pulseRing: new THREE.TorusGeometry(1.0, 0.08, 8, 24),
      // ✅ REALISTIC: Security post (taller)
      laserGridPost: new THREE.CylinderGeometry(0.12, 0.15, 2.8, 8),
      // ✅ REALISTIC: Grid beam
      laserGridBeam: new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8),
      // ✅ NEW: Hover scooter deck
      scooterDeck: new THREE.BoxGeometry(0.4, 0.1, 1.2),
      // ✅ NEW: Scooter handlebar
      scooterHandle: new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8),
      // ✅ NEW: Scooter wheel
      scooterWheel: new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12),
      // ✅ NEW: Dumpster body
      dumpster: new THREE.BoxGeometry(1.8, 1.2, 1.0),
      // ✅ NEW: Road divider (Jersey barrier)
      roadDivider: new THREE.BoxGeometry(0.6, 0.8, 2.0),
    };

    Object.values(this.obstacleGeometries).forEach(g => this.geometries.push(g));

    this.obstacleMaterials = {
      // ✅ REALISTIC: Cargo crate - Industrial metal with hazard markings
      box: new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,  // Dark industrial metal
        emissive: 0xff6600,  // Orange hazard glow
        emissiveIntensity: 0.25,
        metalness: 0.85,
        roughness: 0.4
      }),
      // ✅ REALISTIC: Holographic warning sign - Floating cyan display
      barrier: new THREE.MeshStandardMaterial({
        color: 0x00ddff,  // Bright cyan
        emissive: 0x00aaff,  // Cyan glow
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.85,
        metalness: 0.2,
        roughness: 0.1
      }),
      // ✅ REALISTIC: Traffic cone - Bright safety orange
      spike: new THREE.MeshStandardMaterial({
        color: 0xff5500,  // Bright traffic orange
        emissive: 0xff3300,  // Orange glow
        emissiveIntensity: 0.4,
        metalness: 0.1,
        roughness: 0.6
      }),
      // ✅ REALISTIC: Security drone - Chrome/silver metallic
      drone: new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        emissive: 0x222222,
        emissiveIntensity: 0.1,
        metalness: 0.95,
        roughness: 0.15
      }),
      // ✅ REALISTIC: Drone scanning light - Red warning
      droneGlow: new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1.2
      }),
      // ✅ REALISTIC: Laser beam - Red security beam
      laserBeam: new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
      }),
      // ✅ REALISTIC: Security post - Dark metal with warning stripe
      laserPost: new THREE.MeshStandardMaterial({
        color: 0x555555,
        emissive: 0xff0000,
        emissiveIntensity: 0.2,
        metalness: 0.9,
        roughness: 0.3
      }),
      // ✅ REALISTIC: Traffic gate arm - Red/white striped boom barrier
      movingBarrier: new THREE.MeshStandardMaterial({
        color: 0xee0000,  // Red 
        emissive: 0xff0000,
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.3
      }),
      // ✅ REALISTIC: Holographic warning ring
      pulseBarrier: new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      }),
      // ✅ REALISTIC: Purple security grid
      laserGrid: new THREE.MeshStandardMaterial({
        color: 0xaa44ff,
        emissive: 0x9933ff,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8
      }),
      laserGridPost: new THREE.MeshStandardMaterial({
        color: 0x666666,
        emissive: 0xaa44ff,
        emissiveIntensity: 0.15,
        metalness: 0.9,
        roughness: 0.2
      }),
      barrierCyan: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ccff, emissiveIntensity: 0.7, metalness: 0.9, roughness: 0.1 }),
      barrierTop: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088ff, emissiveIntensity: 0.9, metalness: 0.95, roughness: 0.05 }),
      // ✅ REALISTIC: Construction barrier - Yellow/black industrial
      turretBase: new THREE.MeshStandardMaterial({
        color: 0xffcc00,  // Yellow 
        emissive: 0xff8800,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.35
      }),
      turretBarrel: new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xff6600, emissiveIntensity: 0.2, metalness: 0.9, roughness: 0.2 }),
      gatePosts: new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0x7700ff, emissiveIntensity: 0.8, metalness: 0.85, roughness: 0.15 }),
      plasmaMain: new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xdd00ff, emissiveIntensity: 0.8, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.85 }),
      // ✅ NEW: Hover scooter - Sleek black with neon underglow
      scooter: new THREE.MeshStandardMaterial({
        color: 0x222222,
        emissive: 0x00ffaa,  // Cyan-green neon underglow
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.25
      }),
      // ✅ NEW: Dumpster - Industrial green/gray
      dumpster: new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,  // Dark green-gray
        emissive: 0x111111,
        emissiveIntensity: 0.1,
        metalness: 0.6,
        roughness: 0.7
      }),
      // ✅ NEW: Road divider - Concrete gray with reflective strips
      roadDivider: new THREE.MeshStandardMaterial({
        color: 0x555555,  // Concrete gray
        emissive: 0xffaa00,  // Orange reflector glow
        emissiveIntensity: 0.15,
        metalness: 0.1,
        roughness: 0.8
      }),
    };

    Object.values(this.obstacleMaterials).forEach(m => this.materials.push(m));

    const complexTypes = ['wall', 'drone', 'laser_grid', 'moving_barrier', 'pulse_barrier', 'rotating_laser',
      'energy_barrier', 'drone_turret', 'plasma_gate', 'tall_wall', 'bar_high', 'bar_low',
      'scooter', 'dumpster', 'road_divider'];  // ✅ NEW: Realistic obstacles added
    complexTypes.forEach(type => {
      for (let i = 0; i < 30; i++) {
        const obst = buildComplexObstacle(type, this.obstacleGeometries, this.obstacleMaterials);
        obst.visible = false;
        obst.active = false;
        this.scene.add(obst);
        this.pools[type].push(obst);
      }
    });

    const coinPoolSize = 50;
    const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.9, metalness: 1 });
    this.geometries.push(coinGeo);
    this.materials.push(coinMat);
    this.instancedCoinMesh = new THREE.InstancedMesh(coinGeo, coinMat, coinPoolSize);
    this.instancedCoinMesh.frustumCulled = false;
    this.scene.add(this.instancedCoinMesh);

    const coinLocalBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.8, 0.2, 0.8));
    for (let i = 0; i < coinPoolSize; i++) {
      this.pools.coin.push({
        id: i, active: false, position: new THREE.Vector3(), rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        baseY: 1.0, bobTime: 0, value: 1, localBox: coinLocalBox.clone(), worldBox: new THREE.Box3(), userData: {}
      });
      this.hideInstancedCoin(this.pools.coin[i]);
    }

    const boxPoolSize = 30;
    this.instancedBoxMesh = new THREE.InstancedMesh(this.obstacleGeometries.box, this.obstacleMaterials.box, boxPoolSize);
    this.instancedBoxMesh.frustumCulled = false;
    this.scene.add(this.instancedBoxMesh);

    // ✅ REALISTIC: Cargo crate hitbox (matches 1.3x1.3x1.3 geometry)
    const boxLocalBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.3, 1.3, 1.3));
    for (let i = 0; i < boxPoolSize; i++) {
      this.pools.box.push({
        id: i, active: false, type: 'box', position: new THREE.Vector3(), rotation: new THREE.Euler(),
        localBox: boxLocalBox.clone(), worldBox: new THREE.Box3(), nearMissChecked: false, hitSound: 'crash', userData: {}
      });
      this.hideInstancedObstacle(this.pools.box[i], 'box');
    }

    const spikePoolSize = 30;
    this.instancedSpikeMesh = new THREE.InstancedMesh(this.obstacleGeometries.spike, this.obstacleMaterials.spike, spikePoolSize);
    this.instancedSpikeMesh.frustumCulled = false;
    this.scene.add(this.instancedSpikeMesh);

    // ✅ REALISTIC: Traffic cone hitbox (matches cone geometry)
    const spikeLocalBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.8, 1.1, 0.8));
    for (let i = 0; i < spikePoolSize; i++) {
      this.pools.spike.push({
        id: i, active: false, type: 'spike', position: new THREE.Vector3(), rotation: new THREE.Euler(),
        localBox: spikeLocalBox.clone(), worldBox: new THREE.Box3(), nearMissChecked: false, hitSound: 'crash', userData: {}
      });
      this.hideInstancedObstacle(this.pools.spike[i], 'spike');
    }

    const barrierPoolSize = 20;
    this.instancedBarrierMesh = new THREE.InstancedMesh(this.obstacleGeometries.barrier, this.obstacleMaterials.barrier, barrierPoolSize);
    this.instancedBarrierMesh.frustumCulled = false;
    this.scene.add(this.instancedBarrierMesh);

    const barrierLocalBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.8, 0.5, 0.3));
    for (let i = 0; i < barrierPoolSize; i++) {
      this.pools.barrier.push({
        id: i, active: false, type: 'barrier', position: new THREE.Vector3(), rotation: new THREE.Euler(),
        localBox: barrierLocalBox.clone(), worldBox: new THREE.Box3(), nearMissChecked: false, hitSound: 'crash', userData: {}
      });
      this.hideInstancedObstacle(this.pools.barrier[i], 'barrier');
    }

    const extrudeSettings = { depth: 0.15, bevelEnabled: false };
    this.powerUpGeometries = {
      shield: new THREE.ExtrudeGeometry(createShieldShape(), extrudeSettings),
      multiplier: new THREE.ExtrudeGeometry(createZapShape(), extrudeSettings),
      magnet: new THREE.ExtrudeGeometry(createMagnetShape(), extrudeSettings),
      health: new THREE.ExtrudeGeometry(createHealthShape(), extrudeSettings),
      time: new THREE.ExtrudeGeometry(createTimeShape(), extrudeSettings)
    };

    Object.values(this.powerUpGeometries).forEach(geo => {
      if (geo.center) geo.center();
      this.geometries.push(geo);
    });

    this.powerUpMaterials = {
      shield: new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0088ff, emissiveIntensity: 1.5 }),
      multiplier: new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 1.5 }),
      magnet: new THREE.MeshStandardMaterial({ color: 0xff00aa, emissive: 0xff00aa, emissiveIntensity: 1.5 }),
      health: new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff00, emissiveIntensity: 1.5 }),
      time: new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x6688ff, emissiveIntensity: 1.5 })
    };

    Object.values(this.powerUpMaterials).forEach(m => this.materials.push(m));

    for (let i = 0; i < 10; i++) {
      const pu = new THREE.Group();
      pu.userData.localBox = new THREE.Box3();
      pu.userData.worldBox = new THREE.Box3();
      pu.visible = false;
      pu.active = false;
      this.scene.add(pu);
      this.pools.powerUp.push(pu);
    }

    for (let i = 0; i < 15; i++) {
      const light = new THREE.PointLight(0xffffff, 3, 4);
      light.visible = false;
      light.active = false;
      this.scene.add(light);
      this.pools.powerUpLight.push(light);
    }
  }

  hideInstancedCoin(coinData) {
    this.dummy.scale.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.instancedCoinMesh.setMatrixAt(coinData.id, this.dummy.matrix);
  }

  hideInstancedObstacle(data, type) {
    this.dummy.scale.set(0, 0, 0);
    this.dummy.updateMatrix();
    if (type === 'box') this.instancedBoxMesh.setMatrixAt(data.id, this.dummy.matrix);
    else if (type === 'spike') this.instancedSpikeMesh.setMatrixAt(data.id, this.dummy.matrix);
    else if (type === 'barrier') this.instancedBarrierMesh.setMatrixAt(data.id, this.dummy.matrix);
  }

  spawnInstancedObstacle(obstDef, type) {
    let pool = this.pools[type];
    let poolIndex = this.poolIndices[type];
    let obstData = getFromPool(pool, poolIndex);
    if (!obstData) return;

    let yPosition = 0;
    if (type === 'box') yPosition = 0.75;
    else if (type === 'spike') yPosition = 0.6;
    else if (type === 'barrier') yPosition = 1.8;

    obstData.position.set(
      this.constants.LANE_POSITIONS[obstDef.lane],
      yPosition,
      obstDef.z
    );

    if (!obstData.userData) obstData.userData = {};
    obstData.userData.nearMissChecked = false;
    obstData.nearMissChecked = false;
    obstData.active = true;

    this.dummy.position.copy(obstData.position);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.scale.set(1, 1, 1);
    this.dummy.updateMatrix();

    if (type === 'box') {
      this.instancedBoxMesh.setMatrixAt(obstData.id, this.dummy.matrix);
      this.instancedBoxMesh.instanceMatrix.needsUpdate = true;
      addObstacleMetadata(obstData, 1.5, false);
      obstData.userData.canSlideUnder = false;
    } else if (type === 'spike') {
      this.instancedSpikeMesh.setMatrixAt(obstData.id, this.dummy.matrix);
      this.instancedSpikeMesh.instanceMatrix.needsUpdate = true;
      addObstacleMetadata(obstData, 1.2, false);
      obstData.userData.canSlideUnder = false;
    } else if (type === 'barrier') {
      this.instancedBarrierMesh.setMatrixAt(obstData.id, this.dummy.matrix);
      this.instancedBarrierMesh.instanceMatrix.needsUpdate = true;
      addObstacleMetadata(obstData, 1.8, false);
      obstData.userData.canSlideUnder = true;
    }

    obstData.worldBox.copy(obstData.localBox).applyMatrix4(this.dummy.matrix);
    this.activeInstancedObstacles.push(obstData);
  }

  createObstacleFromDefinition(obstDef) {
    const type = obstDef.type;
    if (type === 'box' || type === 'spike' || type === 'barrier') {
      this.spawnInstancedObstacle(obstDef, type);
      return;
    }

    if (type === 'bar') {
      const bar = this.spawnBar(this.scene, {
        x: this.constants.LANE_POSITIONS[obstDef.lane],
        z: obstDef.z,
        y: 0.8
      }, this.materials);
      this.activeObstacles.push(bar);
      return;
    }

    const pool = this.pools[type];
    const poolIndex = this.poolIndices[type];
    if (!pool) return;

    let obst = getFromPool(pool, poolIndex);
    if (!obst) return;

    if (!obst.userData) obst.userData = {};
    obst.userData.nearMissChecked = false;
    obst.userData.animTime = Math.random() * Math.PI * 2;

    if (type === 'drone') obst.userData.floatTime = Math.random() * Math.PI * 2;

    if (type === 'moving_barrier') {
      obst.userData.moveTime = obstDef.data?.phase || Math.random() * Math.PI * 2;
      obst.children[0].position.x = 0;
    }

    if (type === 'rotating_laser') {
      const beamHolder = obst.getObjectByName("beamHolder");
      if (beamHolder) beamHolder.rotation.y = 0;
    }

    obst.position.set(this.constants.LANE_POSITIONS[obstDef.lane], 0, obstDef.z);
    obst.active = true;
    obst.visible = true;

    switch (type) {
      case 'wall':
        addObstacleMetadata(obst, 1.8, true);
        obst.userData.canSlideUnder = true;
        break;
      case 'energy_barrier':
        addObstacleMetadata(obst, 1.35, true);
        obst.userData.canSlideUnder = true;
        obst.userData.requiresSlide = true;
        break;
      case 'drone_turret':
        addObstacleMetadata(obst, 1.4, true);
        obst.userData.canSlideUnder = true;
        obst.userData.requiresSlide = true;
        obst.userData.isDynamic = true;
        break;
      case 'plasma_gate':
        addObstacleMetadata(obst, 1.25, true);
        obst.userData.canSlideUnder = true;
        obst.userData.requiresSlide = true;
        obst.userData.isDynamic = true;
        break;
      case 'drone':
        addObstacleMetadata(obst, 1.5, false);
        break;
      case 'laser_grid':
        addObstacleMetadata(obst, 1.5, false);
        break;
      case 'moving_barrier':
        addObstacleMetadata(obst, 2.0, false);
        break;
      case 'pulse_barrier':
        addObstacleMetadata(obst, 2.6, false);
        break;
      case 'rotating_laser':
        addObstacleMetadata(obst, 3.0, false);
        break;
    }

    this.activeObstacles.push(obst);
  }

  async spawnPowerUp(playerPosition) {
    let pu = getFromPool(this.pools.powerUp, this.poolIndices.powerUp);
    if (!pu) return;

    while (pu.children.length > 0) pu.remove(pu.children[0]);

    const rand = Math.random();
    let type;

    // ✅ ADJUSTED: Increased time slow spawn rate for testing
    if (rand < 0.15) type = 'shield';           // 15% shield
    else if (rand < 0.25) type = 'multiplier';  // 10% multiplier
    else if (rand < 0.35) type = 'magnet';      // 10% magnet
    else if (rand < 0.45) type = 'health';      // 10% health
    else if (rand < 0.70) type = 'time';        // 25% time slow (increased for testing)
    else type = 'lightning';                     // 30% LIGHTNING DASH

    if (this.modelsLoaded) {
      try {
        const model = await this.modelLoader.createPowerUp(type);
        pu.add(model);
      } catch (error) {
        console.warn(`⚠️ Failed to create model for ${type}, using fallback`);
        this.addFallbackPowerUpMesh(pu, type);
      }
    } else {
      this.addFallbackPowerUpMesh(pu, type);
    }

    if (!pu.userData) pu.userData = {};
    pu.userData.type = type;
    if (!pu.userData.localBox) pu.userData.localBox = new THREE.Box3();
    if (!pu.userData.worldBox) pu.userData.worldBox = new THREE.Box3();
    pu.userData.localBox.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.8, 0.8, 0.3));

    pu.position.set(
      this.constants.LANE_POSITIONS[Math.floor(Math.random() * 3)],
      1.5,
      playerPosition.z - this.constants.GAME.SPAWN_DISTANCE
    );

    pu.active = true;
    pu.visible = true;
    this.activePowerUps.push(pu);

    if (this.powerUpAuras) {
      this.powerUpAuras.addPowerUp(pu);
      pu.userData.hasAura = true;
    }
  }

  addFallbackPowerUpMesh(pu, type) {
    let mesh;
    mesh = new THREE.Mesh(this.powerUpGeometries[type], this.powerUpMaterials[type]);
    pu.add(mesh);

    let light = getFromPool(this.pools.powerUpLight, this.poolIndices.powerUpLight);
    if (light) {
      const lightColors = {
        shield: 0x5b8fc7,
        multiplier: 0xffaa00,
        magnet: 0x00ff00,
        health: 0xffffff,
        time: 0xaaaaff,
        hoverboard: 0x00ffff,
        lightning: 0x7700ff  // ✅ Bright purple for Lightning Dash
      };
      light.color.set(lightColors[type] || 0xffffff);
      light.position.set(0, 0, 0.3);
      pu.add(light);
    }
  }

  createCoinFromDefinition(coinDef) {
    let coinData = getFromPool(this.pools.coin, this.poolIndices.coin);
    if (!coinData) return;

    coinData.position.set(this.constants.LANE_POSITIONS[coinDef.lane], coinDef.height || 1.0, coinDef.z);
    coinData.baseY = coinDef.height || 1.0;
    coinData.value = coinDef.value || 1;
    coinData.active = true;

    if (!coinData.userData) coinData.userData = {};

    this.dummy.position.copy(coinData.position);
    this.dummy.rotation.copy(coinData.rotation);
    this.dummy.scale.set(1, 1, 1);
    this.dummy.updateMatrix();
    this.instancedCoinMesh.setMatrixAt(coinData.id, this.dummy.matrix);
    this.instancedCoinMesh.instanceMatrix.needsUpdate = true;

    this.activeCoins.push(coinData);

    if (this.coinSparkles) {
      this.coinSparkles.addCoin(coinData);
      coinData.userData.hasSparkle = true;
    }
  }

  spawnCoinPattern(playerPosition, difficultyState) {
    const difficultyFactor = difficultyState.intensity || 0.5;
    const coinMultiplier = 0.8 + (difficultyFactor * 0.6);
    const coinCount = Math.floor(3 * coinMultiplier);
    const lane = Math.floor(Math.random() * 3);

    for (let i = 0; i < coinCount; i++) {
      const coinValue = 1 + Math.floor(difficultyFactor * 2);
      this.createCoinFromDefinition({
        lane: (lane + i) % 3,
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - (i * 2),
        height: 1.0,
        value: coinValue
      });
    }
  }

  spawnObstaclePattern(playerPosition, difficultyState, playerIsJumping, jumpSafetySystem) {
    const type = this.difficultyManager.getObstacleType();
    const lane = Math.floor(Math.random() * 3);
    const spawnZ = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;
    const minSafeDistance = 50;

    if (Math.abs(spawnZ - playerPosition.z) < minSafeDistance) {
      return;
    }

    this.createObstacleFromDefinition({
      type: type,
      lane: lane,
      z: spawnZ,
      data: {}
    });
  }

  updateEntities(deltaTime, playerZ) {
    let coinMatrixNeedsUpdate = false;
    let boxMatrixNeedsUpdate = false;
    let spikeMatrixNeedsUpdate = false;
    let barrierMatrixNeedsUpdate = false;

    this.activeObstacles = this.activeObstacles.filter(obst => {
      if (!obst || !obst.position) return false;

      if (obst.position.z > playerZ + 20 || !obst.active) {
        obst.visible = false;
        obst.active = false;
        return false;
      }

      if (obst.userData) {
        if (obst.userData.type === 'drone') {
          obst.userData.floatTime = (obst.userData.floatTime || 0) + deltaTime * 2;
          if (typeof obst.userData.initialY !== 'undefined') obst.position.y = obst.userData.initialY + Math.sin(obst.userData.floatTime) * 0.3;
          obst.rotation.y += deltaTime * 2;
        }

        if (obst.userData.movingObstacle && obst.children[0]) {
          obst.userData.moveTime = (obst.userData.moveTime || 0) + deltaTime;
          obst.children[0].position.x = Math.sin(obst.userData.moveTime * 2) * 1.5;
        }

        if (obst.userData.type === 'rotating_laser') {
          const beamHolder = obst.getObjectByName("beamHolder");
          if (beamHolder) beamHolder.rotation.y += deltaTime * 0.7;
        }
      }

      obst.updateMatrixWorld(true);
      if (obst.userData.worldBox && obst.userData.localBox) {
        obst.userData.worldBox.copy(obst.userData.localBox).applyMatrix4(obst.matrixWorld);
      }

      return true;
    });

    this.activeCoins = this.activeCoins.filter(coin => {
      if (!coin || !coin.position) return false;

      if (coin.position.z > playerZ + 20 || !coin.active) {
        coin.active = false;
        this.hideInstancedCoin(coin);
        coinMatrixNeedsUpdate = true;
        return false;
      }

      coin.bobTime = (coin.bobTime || 0) + deltaTime * 3;
      coin.position.y = coin.baseY + Math.sin(coin.bobTime) * 0.2;
      coin.rotation.z += deltaTime * 2;

      this.dummy.position.copy(coin.position);
      this.dummy.rotation.copy(coin.rotation);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instancedCoinMesh.setMatrixAt(coin.id, this.dummy.matrix);
      coinMatrixNeedsUpdate = true;

      if (coin.worldBox && coin.localBox) coin.worldBox.copy(coin.localBox).applyMatrix4(this.dummy.matrix);

      return true;
    });

    this.activeInstancedObstacles = this.activeInstancedObstacles.filter(obstData => {
      if (!obstData || !obstData.position) return false;

      if (obstData.position.z > playerZ + 20 || !obstData.active) {
        obstData.active = false;
        this.hideInstancedObstacle(obstData, obstData.type);
        if (obstData.type === 'box') boxMatrixNeedsUpdate = true;
        else if (obstData.type === 'spike') spikeMatrixNeedsUpdate = true;
        else if (obstData.type === 'barrier') barrierMatrixNeedsUpdate = true;
        return false;
      }

      this.dummy.position.copy(obstData.position);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();

      if (obstData.type === 'box') {
        this.instancedBoxMesh.setMatrixAt(obstData.id, this.dummy.matrix);
        boxMatrixNeedsUpdate = true;
      } else if (obstData.type === 'spike') {
        this.instancedSpikeMesh.setMatrixAt(obstData.id, this.dummy.matrix);
        spikeMatrixNeedsUpdate = true;
      } else if (obstData.type === 'barrier') {
        this.instancedBarrierMesh.setMatrixAt(obstData.id, this.dummy.matrix);
        barrierMatrixNeedsUpdate = true;
      }

      if (obstData.worldBox && obstData.localBox) obstData.worldBox.copy(obstData.localBox).applyMatrix4(this.dummy.matrix);

      return true;
    });

    this.activePowerUps = this.activePowerUps.filter(pu => {
      if (!pu || !pu.position) return false;

      if (pu.position.z > playerZ + 20 || !pu.active) {
        pu.visible = false;
        pu.active = false;
        this.powerUpAuras?.removePowerUp(pu);
        const light = pu.getObjectByProperty('isPointLight', true);
        if (light) {
          light.visible = false;
          light.active = false;
          pu.remove(light);
          this.scene.add(light);
        }
        return false;
      }

      pu.rotation.y += deltaTime * 2;
      pu.updateMatrixWorld(true);
      if (pu.userData && pu.userData.worldBox && pu.userData.localBox) pu.userData.worldBox.copy(pu.userData.localBox).applyMatrix4(pu.matrixWorld);

      return true;
    });

    if (coinMatrixNeedsUpdate) this.instancedCoinMesh.instanceMatrix.needsUpdate = true;
    if (boxMatrixNeedsUpdate) this.instancedBoxMesh.instanceMatrix.needsUpdate = true;
    if (spikeMatrixNeedsUpdate) this.instancedSpikeMesh.instanceMatrix.needsUpdate = true;
    if (barrierMatrixNeedsUpdate) this.instancedBarrierMesh.instanceMatrix.needsUpdate = true;

    this.activeEntities.obstacles = this.activeObstacles;
    this.activeEntities.instancedObstacles = this.activeInstancedObstacles;
    this.activeEntities.coins = this.activeCoins;
    this.activeEntities.powerUps = this.activePowerUps;
  }

  getActiveEntities() {
    return this.activeEntities;
  }

  spawnBar(scene, position, materials) {
    const barGroup = BarObstacleSystem.createBarGeometry(materials);
    barGroup.position.set(position.x || 0, 0.8, position.z || 0);
    barGroup.userData.id = `bar-${Date.now()}-${Math.random()}`;
    barGroup.userData.isBar = true;
    barGroup.active = true;
    this.barSystem?.createBarVisuals(barGroup);
    scene.add(barGroup);
    return barGroup;
  }

  updateBars(bars, deltaTime) {
    if (!bars) return;
    bars.forEach(bar => {
      if (bar && bar.active) {
        this.barSystem?.updateBarVisuals(bar, deltaTime);
        this.slidingObstacleSystem?.updateSlidingObstacleVisuals(bar, deltaTime);
      }
    });
  }

  updatePowerUpAnimations(deltaTime, elapsedTime) {
    if (!this.modelsLoaded || !this.modelLoader) return;
    this.activePowerUps.forEach(powerUp => {
      if (powerUp && powerUp.active && powerUp.visible) {
        this.modelLoader.animatePowerUp(powerUp, deltaTime, elapsedTime);
      }
    });
  }

  dispose() {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());

    if (this.instancedCoinMesh) {
      this.scene.remove(this.instancedCoinMesh);
      this.instancedCoinMesh.dispose();
    }
    if (this.instancedBoxMesh) {
      this.scene.remove(this.instancedBoxMesh);
      this.instancedBoxMesh.dispose();
    }
    if (this.instancedSpikeMesh) {
      this.scene.remove(this.instancedSpikeMesh);
      this.instancedSpikeMesh.dispose();
    }
    if (this.instancedBarrierMesh) {
      this.scene.remove(this.instancedBarrierMesh);
      this.instancedBarrierMesh.dispose();
    }

    if (this.modelLoader) {
      this.modelLoader.dispose();
    }

    Object.values(this.pools).forEach(pool => {
      pool.forEach(item => {
        if (item.isGroup) this.scene.remove(item);
      });
    });

    this.geometries = [];
    this.materials = [];
    this.pools = {};
  }
}
