import * as THREE from "three";

// Reusable objects for matrix calculation
const _dummy = new THREE.Object3D();
const _tempPos = new THREE.Vector3();
const _tempColor = new THREE.Color();

export class FlyingVehicles {
  constructor(scene) {
    this.scene = scene;
    this.maxVehicles = 20; // ✅ INCREASED: More traffic
    this.enabled = true;
    
    this.vehicleDataPool = [];
    this.activeVehicles = [];

    // Shared simple geometry
    const bodyGeo = new THREE.BoxGeometry(1.5, 0.5, 3.5);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: 0x2a2a4e,
    });

    this.instancedVehicles = new THREE.InstancedMesh(bodyGeo, bodyMat, this.maxVehicles);
    this.scene.add(this.instancedVehicles);
    this.geometries = [bodyGeo];
    this.materials = [bodyMat];

    for (let i = 0; i < this.maxVehicles; i++) {
      this.vehicleDataPool.push({
        id: i,
        active: false,
        position: new THREE.Vector3(),
        speed: 0,
        time: 0
      });
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.instancedVehicles.setMatrixAt(i, _dummy.matrix);
    }
    this.instancedVehicles.instanceMatrix.needsUpdate = true;
    this.spawnTimer = 0;
    this.spawnInterval = 0.5; // ✅ FASTER SPAWN
  }

  update(deltaTime, playerZ) {
    if (!this.enabled) {
      this.instancedVehicles.visible = false;
      return;
    }
    this.instancedVehicles.visible = true;
    
    this.spawnTimer += deltaTime;
    
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnVehicle(playerZ);
    }
    
    let needsMatrixUpdate = false;
    for (let i = this.activeVehicles.length - 1; i >= 0; i--) {
      const vehicle = this.activeVehicles[i];
      
      // Move vehicles
      vehicle.position.z += vehicle.speed * deltaTime;
      vehicle.position.y += Math.sin(vehicle.time * 2) * 0.2 * deltaTime; // Slight bob
      vehicle.time += deltaTime;
      
      if (vehicle.position.z > playerZ + 150) {
        // Recycle
        vehicle.active = false;
        this.activeVehicles.splice(i, 1);
        this.vehicleDataPool.push(vehicle);
        _dummy.scale.set(0, 0, 0);
      } else {
        // Update matrix
        _dummy.position.copy(vehicle.position);
        _dummy.scale.set(1, 1, 1);
        // Tilt forward slightly based on speed
        _dummy.rotation.x = 0.1; 
      }
      
      _dummy.updateMatrix();
      this.instancedVehicles.setMatrixAt(vehicle.id, _dummy.matrix);
      needsMatrixUpdate = true;
    }
    
    if (needsMatrixUpdate) {
      this.instancedVehicles.instanceMatrix.needsUpdate = true;
    }
  }

  spawnVehicle(playerZ) {
    if (this.vehicleDataPool.length === 0) return; 
    
    const vehicle = this.vehicleDataPool.pop();
    vehicle.active = true;
    
    const side = Math.random() > 0.5 ? 1 : -1;
    // Spawn high up in the sky lanes
    vehicle.position.set(
      side * (15 + Math.random() * 20),
      20 + Math.random() * 30,
      playerZ - 200 - Math.random() * 50
    );
    
    vehicle.speed = 40 + Math.random() * 30; // Fast!
    vehicle.time = Math.random() * 10;
    
    this.activeVehicles.push(vehicle);
  }
// ... rest of class remains same (VolumetricBeams etc.) ...
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  dispose() {
    this.geometries.forEach(geo => geo.dispose());
    this.materials.forEach(mat => mat.dispose());
    this.geometries = [];
    this.materials = [];
    
    this.scene.remove(this.instancedVehicles);
    this.instancedVehicles.dispose();
    this.activeVehicles = [];
    this.vehicleDataPool = [];
  }
}

// (VolumetricBeams class code would follow here, unchanged)
export class VolumetricBeams {
  constructor(scene) {
    this.scene = scene;
    this.maxBeams = 15;
    this.enabled = true;
    
    this.beamDataPool = [];
    this.activeBeams = [];

    const beamGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 6);
    beamGeo.translate(0, 0.5, 0);

    const animInfo = new Float32Array(this.maxBeams * 2);
    const colors = new Float32Array(this.maxBeams * 3);
    
    beamGeo.setAttribute('aAnimInfo', new THREE.InstancedBufferAttribute(animInfo, 2));
    beamGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));

    const beamMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
      },
      vertexShader: `
        attribute vec2 aAnimInfo;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vAnimOffset;
        varying float vBaseOpacity;
        
        void main() {
          vColor = aColor;
          vAnimOffset = aAnimInfo.x;
          vBaseOpacity = aAnimInfo.y;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vAnimOffset;
        varying float vBaseOpacity;

        void main() {
          float opacity = vBaseOpacity + sin(uTime * 2.0 + vAnimOffset) * 0.1;
          gl_FragColor = vec4(vColor, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.instancedBeams = new THREE.InstancedMesh(beamGeo, beamMat, this.maxBeams);
    this.scene.add(this.instancedBeams);
    
    this.geometries = [beamGeo];
    this.materials = [beamMat];
    
    for (let i = 0; i < this.maxBeams; i++) {
      this.beamDataPool.push({
        id: i,
        active: false,
        position: new THREE.Vector3(),
      });
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.instancedBeams.setMatrixAt(i, _dummy.matrix);
    }
    this.instancedBeams.instanceMatrix.needsUpdate = true;
  }
  
  spawnBeam(position, color, height) {
    if (!this.enabled || this.beamDataPool.length === 0) return;
    
    const beam = this.beamDataPool.pop();
    beam.active = true;
    beam.position.copy(position);
    
    const id = beam.id;
    
    _dummy.position.copy(position);
    _dummy.scale.set(1, height, 1);
    _dummy.updateMatrix();
    this.instancedBeams.setMatrixAt(id, _dummy.matrix);
    
    _tempColor.set(color);
    this.instancedBeams.geometry.attributes.aColor.setXYZ(id, _tempColor.r, _tempColor.g, _tempColor.b);
    this.instancedBeams.geometry.attributes.aAnimInfo.setXY(id, Math.random() * 10, 0.2);
    
    this.instancedBeams.geometry.attributes.aColor.needsUpdate = true;
    this.instancedBeams.geometry.attributes.aAnimInfo.needsUpdate = true;
    
    this.activeBeams.push(beam);
  }

  update(deltaTime, playerZ) {
    if (!this.enabled) {
      this.instancedBeams.visible = false;
      return;
    }
    this.instancedBeams.visible = true;
    
    this.instancedBeams.material.uniforms.uTime.value += deltaTime;
    
    let needsMatrixUpdate = false;
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const beam = this.activeBeams[i];
      
      if (beam.position.z > playerZ + 50) {
        beam.active = false;
        this.activeBeams.splice(i, 1);
        this.beamDataPool.push(beam);
        
        _dummy.scale.set(0, 0, 0);
        _dummy.updateMatrix();
        this.instancedBeams.setMatrixAt(beam.id, _dummy.matrix);
        needsMatrixUpdate = true;
      }
    }
    
    if (needsMatrixUpdate) {
      this.instancedBeams.instanceMatrix.needsUpdate = true;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  dispose() {
    this.geometries.forEach(geo => geo.dispose());
    this.materials.forEach(mat => mat.dispose());
    this.geometries = [];
    this.materials = [];

    this.scene.remove(this.instancedBeams);
    this.instancedBeams.dispose();
    this.activeBeams = [];
    this.beamDataPool = [];
  }
}

export function updateBillboardWithEffects(texture, time, text, isHighQuality) {
  const canvas = texture.image;
  if (!canvas.userData.ctx) {
    canvas.userData.ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
  }
  const ctx = canvas.userData.ctx;
  const offset = canvas.userData.animOffset || 0;
  const blinkState = Math.floor((time + offset) * 2) % 2 === 0;

  if (canvas.userData.lastBlinkState === blinkState && !isHighQuality) {
    return;
  }
  canvas.userData.lastBlinkState = blinkState;

  if (canvas.userData.staticTextCanvas) {
    ctx.drawImage(canvas.userData.staticTextCanvas, 0, 0);
  } else {
    ctx.fillStyle = '#100818';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = isHighQuality ? 'bold 48px Orbitron, sans-serif' : 'bold 40px Arial';
    ctx.fillStyle = '#5b8fc7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  if (isHighQuality && blinkState) {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('● LIVE', 10, 25);
  }

  if (isHighQuality) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 3; i++) {
      const y = Math.random() * canvas.height;
      const h = Math.random() * 10 + 2;
      ctx.fillRect(0, y, canvas.width, h);
    }
  }

  texture.needsUpdate = true;
}