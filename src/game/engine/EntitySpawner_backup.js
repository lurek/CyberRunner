import * as THREE from "three";
import { getFromPool } from "../../utils/poolUtils.js";
import { addObstacleMetadata } from "./CollisionFixes.js";
import { 
  createShieldShape, 
  createZapShape, 
  createMagnetShape, 
  createHealthShape,
  createTimeShape
} from "../helpers/PowerUpShapes.js";

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

  switch(type) {
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
    
    this.pools = {
      wall: [], drone: [], laser_grid: [], moving_barrier: [], pulse_barrier: [], rotating_laser: [],
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
    // --- Geometries & Materials ---
    this.obstacleGeometries = {
      box: new THREE.BoxGeometry(1.2, 1.5, 1.2),
      // ✅ CHANGED: Barrier is now a wide horizontal beam for sliding under
      barrier: new THREE.BoxGeometry(2.8, 0.5, 0.3), 
      spike: new THREE.ConeGeometry(0.6, 1.2, 4),
      post: new THREE.BoxGeometry(0.3, 2.2, 0.3),
      bar: new THREE.BoxGeometry(2.4, 0.3, 0.3),
      droneBody: new THREE.SphereGeometry(0.5, 12, 10),
      droneProp: new THREE.BoxGeometry(0.8, 0.1, 0.1),
      laserPost: new THREE.BoxGeometry(0.2, 1.5, 0.2),
      laserBeam: new THREE.CylinderGeometry(0.05, 0.05, 3.0, 12),
      movingBarrier: new THREE.BoxGeometry(1.0, 2.0, 0.4),
      pulseRing: new THREE.TorusGeometry(1.2, 0.1, 8, 24),
      laserGridPost: new THREE.BoxGeometry(0.3, 3.0, 0.3),
      laserGridBeam: new THREE.CylinderGeometry(0.08, 0.08, 2.0, 12),
    };
    Object.values(this.obstacleGeometries).forEach(g => this.geometries.push(g));
    
    this.obstacleMaterials = {
      box: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 }),
      // ✅ CHANGED: Barrier color to distinctive Yellow/Orange
      barrier: new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, emissiveIntensity: 0.6, metalness: 0.8 }),
      spike: new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.5 }),
      drone: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1.0, roughness: 0.2 }),
      droneGlow: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 }),
      laserBeam: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 }),
      laserPost: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1.0, roughness: 0.3 }),
      movingBarrier: new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.4 }),
      pulseBarrier: new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.8, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
      laserGrid: new THREE.MeshStandardMaterial({ color: 0x9b7fc7, emissive: 0x9b7fc7, emissiveIntensity: 1.0, transparent: true, opacity: 0.7 }),
      laserGridPost: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1.0, roughness: 0.2 }),
    };
    Object.values(this.obstacleMaterials).forEach(m => this.materials.push(m));

    const complexTypes = ['wall', 'drone', 'laser_grid', 'moving_barrier', 'pulse_barrier', 'rotating_laser'];
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
    
    const boxLocalBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 0, 0), 
      new THREE.Vector3(1.2, 1.5, 1.2)
    );
    for (let i = 0; i < boxPoolSize; i++) {
      this.pools.box.push({
        id: i, active: false, type: 'box', position: new THREE.Vector3(), rotation: new THREE.Euler(),
        localBox: boxLocalBox.clone(), worldBox: new THREE.Box3(), nearMissChecked: false, hitSound: 'crash',
        userData: {} 
      });
      this.hideInstancedObstacle(this.pools.box[i], 'box');
    }

    const spikePoolSize = 30;
    this.instancedSpikeMesh = new THREE.InstancedMesh(this.obstacleGeometries.spike, this.obstacleMaterials.spike, spikePoolSize);
    this.instancedSpikeMesh.frustumCulled = false;
    this.scene.add(this.instancedSpikeMesh);
    
    const spikeLocalBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 0, 0), 
      new THREE.Vector3(1.2, 1.2, 1.2)
    );
    for (let i = 0; i < spikePoolSize; i++) {
      this.pools.spike.push({
        id: i, active: false, type: 'spike', position: new THREE.Vector3(), rotation: new THREE.Euler(),
        localBox: spikeLocalBox.clone(), worldBox: new THREE.Box3(), nearMissChecked: false, hitSound: 'crash',
        userData: {} 
      });
      this.hideInstancedObstacle(this.pools.spike[i], 'spike');
    }

    const barrierPoolSize = 20;
    this.instancedBarrierMesh = new THREE.InstancedMesh(this.obstacleGeometries.barrier, this.obstacleMaterials.barrier, barrierPoolSize);
    this.instancedBarrierMesh.frustumCulled = false;
    this.scene.add(this.instancedBarrierMesh);
    
    // ✅ CHANGED: Hitbox for floating barrier
    const barrierLocalBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 0, 0), 
      new THREE.Vector3(2.8, 0.5, 0.3)
    );
    for (let i = 0; i < barrierPoolSize; i++) {
      this.pools.barrier.push({
        id: i, active: false, type: 'barrier', position: new THREE.Vector3(), rotation: new THREE.Euler(),
        localBox: barrierLocalBox.clone(), worldBox: new THREE.Box3(), nearMissChecked: false, hitSound: 'crash',
        userData: {} 
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
    Object.values(this.powerUpGeometries).forEach(geo => { geo.center(); this.geometries.push(geo); });
    
    this.powerUpMaterials = {
      shield: new THREE.MeshStandardMaterial({ color: 0x5b8fc7, emissive: 0x5b8fc7, emissiveIntensity: 0.8 }),
      multiplier: new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.8 }),
      magnet: new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 }),
      health: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }),
      time: new THREE.MeshStandardMaterial({ color: 0xaaaaff, emissive: 0xaaaaff, emissiveIntensity: 0.8 })
    };
    Object.values(this.powerUpMaterials).forEach(m => this.materials.push(m));
    for (let i = 0; i < 10; i++) {
      const pu = new THREE.Group();
      pu.userData.localBox = new THREE.Box3();
      pu.userData.worldBox = new THREE.Box3();
      pu.visible = false; pu.active = false; 
      this.scene.add(pu); this.pools.powerUp.push(pu);
    }
    for (let i = 0; i < 15; i++) {
      const light = new THREE.PointLight(0xffffff, 3, 4);
      light.visible = false; light.active = false;
      this.scene.add(light); this.pools.powerUpLight.push(light);
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
    // ✅ FIXED v3: Barrier raised to 1.8 to allow safe sliding clearance
    // Barrier hitbox: size 0.5 (height), centered at yPosition
    // Barrier collision range: 1.55 (bottom) to 2.05 (top)
    // Player slide top: ~1.1
    // Clearance: 0.45 units ✓ (no collision!)
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

    // ✅ FIX #3: Add gameplay metadata based on obstacle type
    if (type === 'box') {
      this.instancedBoxMesh.setMatrixAt(obstData.id, this.dummy.matrix);
      this.instancedBoxMesh.instanceMatrix.needsUpdate = true;
      // Box height = 1.5, cannot jump over (too tall), cannot slide under
      addObstacleMetadata(obstData, 1.5, false);
    } else if (type === 'spike') {
      this.instancedSpikeMesh.setMatrixAt(obstData.id, this.dummy.matrix);
      this.instancedSpikeMesh.instanceMatrix.needsUpdate = true;
      // Spike height = 1.2, can potentially jump over, cannot slide under
      addObstacleMetadata(obstData, 1.2, false);
    } else if (type === 'barrier') {
      this.instancedBarrierMesh.setMatrixAt(obstData.id, this.dummy.matrix);
      this.instancedBarrierMesh.instanceMatrix.needsUpdate = true;
      // Barrier height = 0.5 (low horizontal beam), CAN slide under easily
      addObstacleMetadata(obstData, 0.5, false);
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
    
    // ✅ FIX #3: Add metadata for complex obstacles
    switch(type) {
      case 'wall':
        addObstacleMetadata(obst, 1.8, true);  // Wall with bar at 1.8 height
        break;
      case 'drone':
        addObstacleMetadata(obst, 1.5, false);  // Floating drone
        break;
      case 'laser_grid':
        addObstacleMetadata(obst, 1.5, false);  // Laser beams at mid-height
        break;
      case 'moving_barrier':
        addObstacleMetadata(obst, 2.0, false);  // Tall moving barrier
        break;
      case 'pulse_barrier':
        addObstacleMetadata(obst, 2.6, false);  // Large pulse ring
        break;
      case 'rotating_laser':
        addObstacleMetadata(obst, 3.0, false);  // Tall rotating lasers
        break;
    }
    
    this.activeObstacles.push(obst);
  }

  spawnPowerUp(playerPosition) {
    let pu = getFromPool(this.pools.powerUp, this.poolIndices.powerUp);
    if (!pu) return;

    while(pu.children.length > 0) pu.remove(pu.children[0]);
    
    const rand = Math.random();
    let type = rand < 0.25 ? 'shield' : rand < 0.5 ? 'multiplier' : rand < 0.75 ? 'magnet' : rand < 0.9 ? 'health' : 'time';
    
    const mesh = new THREE.Mesh(this.powerUpGeometries[type], this.powerUpMaterials[type]);
    pu.add(mesh);
    
    let light = getFromPool(this.pools.powerUpLight, this.poolIndices.powerUpLight);
    if (light) {
      const lightColors = { shield: 0x5b8fc7, multiplier: 0xffaa00, magnet: 0x00ff00, health: 0xffffff, time: 0xaaaaff };
      light.color.set(lightColors[type]);
      light.position.set(0, 0, 0.3);
      pu.add(light);
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
  spawnCoinPattern(playerPosition, difficultyState) {
      // ✅ FIX #24: Scale coin spawning with difficulty for balanced economy
      const difficultyFactor = difficultyState.intensity || 0.5;
      
      // Harder difficulty = more coins for player motivation (0.8-1.4x multiplier)
      const coinMultiplier = 0.8 + (difficultyFactor * 0.6);
      const coinCount = Math.floor(3 * coinMultiplier);
      
      const lane = Math.floor(Math.random() * 3);
      for(let i = 0; i < coinCount; i++) {
          const coinValue = 1 + Math.floor(difficultyFactor * 2); // 1-3 coins value
          
          this.createCoinFromDefinition({
              lane: (lane + i) % 3, // Spread across lanes
              z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - (i * 2),
              height: 1.0,
              value: coinValue
          });
      }
      
      console.log(`✅ Spawned ${coinCount} coins (${coinMultiplier.toFixed(1)}x multiplier)`);
  }

  spawnObstaclePattern(playerPosition, difficultyState, playerIsJumping, jumpSafetySystem) {
      // ✅ FIX #11: Add safety check - don't spawn obstacles too close to player
      const type = this.difficultyManager.getObstacleType();
      const lane = Math.floor(Math.random() * 3);
      
      // Safety check: ensure spawn distance is safe
      const spawnZ = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;
      const minSafeDistance = 50;  // Minimum distance between player and spawn
      
      if (Math.abs(spawnZ - playerPosition.z) < minSafeDistance) {
          // Too close to player, adjust spawn position
          return;  // Skip this spawn cycle
      }
      
      this.createObstacleFromDefinition({
        type: type,
        lane: lane,
        z: spawnZ,
        data: {}
      });
  }

  // ✅ FIX #12: Safe array updates using filter() instead of splice in loop
  updateEntities(deltaTime, playerZ) {
    let coinMatrixNeedsUpdate = false;
    let boxMatrixNeedsUpdate = false;
    let spikeMatrixNeedsUpdate = false;
    let barrierMatrixNeedsUpdate = false;

    // ✅ Process obstacles and filter out inactive ones safely
    this.activeObstacles = this.activeObstacles.filter(obst => {
      if (!obst || !obst.position) return false; // Safety check
      
      if (obst.position.z > playerZ + 20 || !obst.active) {
        obst.visible = false;
        obst.active = false;
        return false; // Remove from array
      }
      
      // Update obstacle animations and physics
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
        
        obst.updateMatrixWorld(true);
        if (obst.userData.worldBox && obst.userData.localBox) {
          obst.userData.worldBox.copy(obst.userData.localBox).applyMatrix4(obst.matrixWorld);
        }
      }
      
      return true; // Keep obstacle in array
    });

    // ✅ Safe coin updates using filter()
    this.activeCoins = this.activeCoins.filter(coin => {
      if (!coin || !coin.position) return false; // Safety check
      
      if (coin.position.z > playerZ + 20 || !coin.active) {
        coin.active = false;
        this.hideInstancedCoin(coin);
        coinMatrixNeedsUpdate = true;
        return false; // Remove from array
      }
      // Update coin animation
      coin.bobTime = (coin.bobTime || 0) + deltaTime * 3;
      coin.position.y = coin.baseY + Math.sin(coin.bobTime) * 0.2;
      coin.rotation.z += deltaTime * 2;
      
      this.dummy.position.copy(coin.position);
      this.dummy.rotation.copy(coin.rotation);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instancedCoinMesh.setMatrixAt(coin.id, this.dummy.matrix);
      coinMatrixNeedsUpdate = true;
      
      if (coin.worldBox && coin.localBox) {
        coin.worldBox.copy(coin.localBox).applyMatrix4(this.dummy.matrix);
      }
      
      return true; // Keep coin in array
    });
    
    // ✅ Safe instanced obstacle updates using filter()
    this.activeInstancedObstacles = this.activeInstancedObstacles.filter(obstData => {
      if (!obstData || !obstData.position) return false; // Safety check
      
      if (obstData.position.z > playerZ + 20 || !obstData.active) {
        obstData.active = false;
        this.hideInstancedObstacle(obstData, obstData.type);
        if (obstData.type === 'box') boxMatrixNeedsUpdate = true;
        else if (obstData.type === 'spike') spikeMatrixNeedsUpdate = true;
        else if (obstData.type === 'barrier') barrierMatrixNeedsUpdate = true;
        return false; // Remove from array
      }
      
      // Update instanced obstacle matrix
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
      
      if (obstData.worldBox && obstData.localBox) {
        obstData.worldBox.copy(obstData.localBox).applyMatrix4(this.dummy.matrix);
      }
      
      return true; // Keep obstacle in array
    });

    // ✅ Safe power-up updates using filter()
    this.activePowerUps = this.activePowerUps.filter(pu => {
        if (!pu || !pu.position) return false; // Safety check
        
        if (pu.position.z > playerZ + 20 || !pu.active) {
            pu.visible = false;
            pu.active = false;
            this.powerUpAuras?.removePowerUp(pu);
            const light = pu.getObjectByProperty('isPointLight', true);
            if (light) {
                light.visible = false; light.active = false; pu.remove(light); this.scene.add(light);
            }
            return false; // Remove from array
        }
        // Update power-up animation
        pu.rotation.y += deltaTime * 2;
        pu.updateMatrixWorld(true);
        
        if (pu.userData && pu.userData.worldBox && pu.userData.localBox) {
          pu.userData.worldBox.copy(pu.userData.localBox).applyMatrix4(pu.matrixWorld);
        }
        
        return true; // Keep power-up in array
    });

    if (coinMatrixNeedsUpdate) this.instancedCoinMesh.instanceMatrix.needsUpdate = true;
    if (boxMatrixNeedsUpdate) this.instancedBoxMesh.instanceMatrix.needsUpdate = true;
    if (spikeMatrixNeedsUpdate) this.instancedSpikeMesh.instanceMatrix.needsUpdate = true;
    if (barrierMatrixNeedsUpdate) this.instancedBarrierMesh.instanceMatrix.needsUpdate = true;
  }

  getActiveEntities() { return this.activeEntities; }
  
  dispose() {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    if (this.instancedCoinMesh) { this.scene.remove(this.instancedCoinMesh); this.instancedCoinMesh.dispose(); }
    if (this.instancedBoxMesh) { this.scene.remove(this.instancedBoxMesh); this.instancedBoxMesh.dispose(); }
    if (this.instancedSpikeMesh) { this.scene.remove(this.instancedSpikeMesh); this.instancedSpikeMesh.dispose(); }
    if (this.instancedBarrierMesh) { this.scene.remove(this.instancedBarrierMesh); this.instancedBarrierMesh.dispose(); }
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