import * as THREE from "three";
import { createBillboardTexture } from "../helpers/BillboardHelper.js";
import { getFromPool } from "../../utils/poolUtils.js";

export class WorldBuilder {
  constructor(scene, materialManager, constants, isHighQuality) {
    this.scene = scene;
    this.materialManager = materialManager;
    this.constants = constants;
    this.isHighQuality = isHighQuality;
    
    this.neonLightPool = [];
    this.neonLightPoolIndex = { current: 0 };
    
    this.groundPlanes = [];
    this.groundGrids = []; 
    this.billboards = [];
    this.buildings = []; 
    
    this.instancedMainBlocks = [];
    this.instancedMidBlocks = [];
    this.instancedTopBlocks = [];
    this.instancedAntennas = null;
    this.instancedLamps = null;
    this.instancedLampLights = null;
    
    this.dummy = new THREE.Object3D(); 
    this.totalBuildingInstances = this.constants.GAME.BUILDING_COUNT_PER_SIDE * 2;
    
    this.geometries = [];
    this.materials = [];
  }

  initializeLightPools() {
    for (let i = 0; i < 50; i++) {
      const light = new THREE.PointLight(0xffffff, 2.5, 30);
      light.visible = false;
      light.active = false;
      this.scene.add(light);
      this.neonLightPool.push(light);
    }
  }

  getLightFromPool() {
    return getFromPool(this.neonLightPool, this.neonLightPoolIndex);
  }

  recycleLight(light) {
    if (light) {
      light.visible = false;
      light.active = false;
      if (light.parent) light.parent.remove(light);
      this.scene.add(light); 
    }
  }

  createGround(theme, groundMaterial) {
    const segmentLength = this.constants.GAME.GROUND_SEGMENT_LENGTH;
    // ✨ SUBWAY SURFERS STYLE: Wider ground (140 → 120+20 padding) for immersive side-view camera
    const groundGeo = new THREE.PlaneGeometry(140, segmentLength);
    this.geometries.push(groundGeo);

    for (let i = 0; i < this.constants.GAME.GROUND_SEGMENTS; i++) {
      const ground = new THREE.Mesh(groundGeo, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.z = -(i * segmentLength);
      ground.receiveShadow = false;
      this.scene.add(ground);
      this.groundPlanes.push(ground);
    }
  }

  createBuildings(theme, volumetricBeams) {
    const buildingCount = this.constants.GAME.BUILDING_COUNT_PER_SIDE;
    const totalInstances = this.totalBuildingInstances;
    
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const antennaGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
    const lampPostGeo = new THREE.BoxGeometry(0.4, 8, 0.4); 
    const lampHeadGeo = new THREE.BoxGeometry(2.5, 0.2, 0.5);
    lampHeadGeo.translate(1.0, 4, 0); 

    this.geometries.push(buildingGeo, antennaGeo, lampPostGeo, lampHeadGeo);

    const buildingMaterials = theme.buildingMaterials;

    // Create Meshes with Culling Disabled to prevent flickering/disappearing
    const createMesh = (geo, mat) => {
        const mesh = new THREE.InstancedMesh(geo, mat, totalInstances);
        mesh.frustumCulled = false; // ✅ CRITICAL FIX
        this.scene.add(mesh);
        return mesh;
    };

    [this.instancedMainBlocks, this.instancedMidBlocks, this.instancedTopBlocks].forEach(arr => {
        buildingMaterials.forEach(mat => {
            arr.push(createMesh(buildingGeo, mat));
        });
    });

    const antennaMat = buildingMaterials.length > 0 ? buildingMaterials[0] : new THREE.MeshBasicMaterial({color: 0x333333});
    this.instancedAntennas = createMesh(antennaGeo, antennaMat);
    
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    this.instancedLamps = createMesh(lampPostGeo, lampMat);
    
    const lampLightMat = new THREE.MeshBasicMaterial({ color: 0xccffff });
    this.instancedLampLights = createMesh(lampHeadGeo, lampLightMat);

    for (let i = 0; i < totalInstances; i++) {
      const isLeftSide = i < buildingCount;
      const side = isLeftSide ? -1 : 1;
      const x = side * (16 + Math.random() * 10); 
      const z = -(i % buildingCount) * 30 - (Math.random() * 10);

      const buildingData = {
        id: i, 
        position: new THREE.Vector3(x, 0, z),
        light: null, 
        mainMatIndex: -1, 
        midMatIndex: -1, 
        topMatIndex: -1, 
        hasAntenna: false
      };

      this.setupBuildingInstance(buildingData, theme);
      this.setupStreetLamp(i, x, z, side);

      if (this.isHighQuality && Math.random() < 0.35) { 
        const h = 20 + Math.random() * 40;
        const light = this.getLightFromPool();
        if (light) {
          const neonColors = [0x00ffff, 0xff00ff, 0xffaa00];
          light.color.setHex(neonColors[Math.floor(Math.random() * neonColors.length)]);
          light.intensity = 3.0; 
          light.distance = 35;
          light.position.set(x, h, z + 3.0);
          light.visible = true;
          light.active = true;
          buildingData.light = light;
        }
      }

      if (this.isHighQuality && Math.random() < 0.3 && volumetricBeams) {
        const beamColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
        const beamPos = new THREE.Vector3(x, 0, z);
        volumetricBeams.spawnBeam(beamPos, beamColor, 80 + Math.random() * 50);
      }

      this.buildings.push(buildingData); 
    }
    
    this.updateAllInstanceMatrices();
  }

  setupStreetLamp(id, x, z, side) {
    const lampX = side * 13;
    this.dummy.position.set(lampX, 4, z); 
    this.dummy.rotation.set(0, side === 1 ? Math.PI : 0, 0); 
    this.dummy.scale.set(1, 1, 1);
    this.dummy.updateMatrix();
    this.instancedLamps.setMatrixAt(id, this.dummy.matrix);
    
    this.dummy.position.set(lampX, 0, z);
    this.dummy.updateMatrix();
    this.instancedLampLights.setMatrixAt(id, this.dummy.matrix);
  }

  setupBuildingInstance(buildingData, theme) {
    const buildingMaterials = theme.buildingMaterials;
    const dummy = this.dummy; 

    dummy.position.set(0, -999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    
    if (buildingData.mainMatIndex > -1) this.instancedMainBlocks[buildingData.mainMatIndex].setMatrixAt(buildingData.id, dummy.matrix);
    if (buildingData.midMatIndex > -1) this.instancedMidBlocks[buildingData.midMatIndex].setMatrixAt(buildingData.id, dummy.matrix);
    if (buildingData.topMatIndex > -1) this.instancedTopBlocks[buildingData.topMatIndex].setMatrixAt(buildingData.id, dummy.matrix);
    this.instancedAntennas.setMatrixAt(buildingData.id, dummy.matrix);

    // ✅ CRITICAL FIX: Variable Scope & Crash Prevention
    
    // 1. BASE
    const h1 = 20 + Math.random() * 15;
    const w1 = 12 + Math.random() * 6;
    const mat1 = Math.floor(Math.random() * buildingMaterials.length);
    
    dummy.position.set(buildingData.position.x, h1 / 2, buildingData.position.z);
    dummy.scale.set(w1, h1, w1);
    dummy.updateMatrix();
    this.instancedMainBlocks[mat1].setMatrixAt(buildingData.id, dummy.matrix);
    buildingData.mainMatIndex = mat1;
    
    let currentHeight = h1;
    let currentWidth = w1; // ✅ Track width here
    
    // 2. MID SECTION
    if (Math.random() < 0.8) {
        const h2 = 30 + Math.random() * 50;
        currentWidth = w1 * 0.7; // Update width
        const mat2 = Math.floor(Math.random() * buildingMaterials.length);
        
        dummy.position.set(buildingData.position.x, currentHeight + (h2 / 2), buildingData.position.z);
        dummy.scale.set(currentWidth, h2, currentWidth);
        dummy.updateMatrix();
        this.instancedMidBlocks[mat2].setMatrixAt(buildingData.id, dummy.matrix);
        buildingData.midMatIndex = mat2;
        currentHeight += h2;
    } else {
        buildingData.midMatIndex = -1;
    }
    
    // 3. TOP SECTION
    if (Math.random() > 0.2) {
        const h3 = 5 + Math.random() * 15;
        const w3 = currentWidth * 0.6; // ✅ Uses tracked width, no 'w2 is undefined' error
        const mat3 = Math.floor(Math.random() * buildingMaterials.length);
        
        dummy.position.set(buildingData.position.x, currentHeight + (h3 / 2), buildingData.position.z);
        dummy.scale.set(w3, h3, w3);
        dummy.updateMatrix();
        this.instancedTopBlocks[mat3].setMatrixAt(buildingData.id, dummy.matrix);
        buildingData.topMatIndex = mat3;
        currentHeight += h3;
    } else {
        buildingData.topMatIndex = -1;
    }

    // 4. ANTENNA
    if (Math.random() > 0.3) {
      const antennaH = 10 + Math.random() * 40; 
      dummy.position.set(buildingData.position.x, currentHeight + (antennaH / 2), buildingData.position.z);
      dummy.scale.set(1, antennaH, 1);
      dummy.updateMatrix();
      this.instancedAntennas.setMatrixAt(buildingData.id, dummy.matrix);
      buildingData.hasAntenna = true;
    } else {
      buildingData.hasAntenna = false;
    }
  }

  updateAllInstanceMatrices() {
    this.instancedMainBlocks.forEach(m => m.instanceMatrix.needsUpdate = true);
    this.instancedMidBlocks.forEach(m => m.instanceMatrix.needsUpdate = true);
    this.instancedTopBlocks.forEach(m => m.instanceMatrix.needsUpdate = true);
    if (this.instancedAntennas) this.instancedAntennas.instanceMatrix.needsUpdate = true;
    if (this.instancedLamps) this.instancedLamps.instanceMatrix.needsUpdate = true;
    if (this.instancedLampLights) this.instancedLampLights.instanceMatrix.needsUpdate = true;
  }

  createBillboards() {
    const texts = ["CYBER", "NEON", "FAST", "OBEY", "DATA", "VOID", "SYNTH", "WAVE"];
    const billboardGeo = new THREE.PlaneGeometry(14, 7);
    this.geometries.push(billboardGeo);

    for (let i = 0; i < 10; i++) { 
      const text = texts[Math.floor(Math.random() * texts.length)];
      const texture = createBillboardTexture(text);
      const billboardMat = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1.0
      });
      this.materials.push(billboardMat);

      const billboard = new THREE.Mesh(billboardGeo, billboardMat);
      const side = i % 2 === 0 ? 1 : -1;
      
      billboard.position.set(side * (20 + Math.random() * 4), 25 + Math.random() * 20, -i * 50 - Math.random() * 20);
      billboard.lookAt(0, billboard.position.y, billboard.position.z + 80); 
      billboard.userData.texture = texture;
      this.scene.add(billboard);
      this.billboards.push(billboard);
    }
  }

  getWorldElements() {
    return {
      groundPlanes: this.groundPlanes,
      groundGrids: this.groundGrids,
      buildings: this.buildings, 
      billboards: this.billboards,
      neonLightPool: this.neonLightPool,
      neonLightPoolIndex: this.neonLightPoolIndex
    };
  }

  dispose() {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    
    [this.instancedMainBlocks, this.instancedMidBlocks, this.instancedTopBlocks].forEach(arr => {
        arr.forEach(m => { this.scene.remove(m); m.dispose(); });
    });
    
    if (this.instancedAntennas) { this.scene.remove(this.instancedAntennas); this.instancedAntennas.dispose(); }
    if (this.instancedLamps) { this.scene.remove(this.instancedLamps); this.instancedLamps.dispose(); }
    if (this.instancedLampLights) { this.scene.remove(this.instancedLampLights); this.instancedLampLights.dispose(); }
    
    this.groundPlanes.forEach(g => { this.scene.remove(g); g.geometry.dispose(); g.material.dispose(); });
    this.billboards.forEach(b => { this.scene.remove(b); b.geometry.dispose(); b.material.dispose(); });
    this.neonLightPool.forEach(l => this.scene.remove(l));
    
    this.geometries = [];
    this.materials = [];
    this.instancedMainBlocks = [];
    this.instancedMidBlocks = [];
    this.instancedTopBlocks = [];
    this.buildings = [];
    this.groundPlanes = [];
    this.groundGrids = [];
    this.billboards = [];
  }
}