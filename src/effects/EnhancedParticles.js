import * as THREE from "three";
import { getPerformanceManager } from "../utils/performance/PerformanceManager.js";

// Reusable vector to avoid allocations
const _tempVector = new THREE.Vector3();
const _dummy = new THREE.Object3D();

export class PlayerTrail {
  constructor(scene, color = 0x5b8fc7) {
    this.scene = scene;

    // ✅ Performance-aware particle count
    const perfManager = getPerformanceManager();
    const tier = perfManager.getCurrentTier();
    const particleCounts = { high: 15, medium: 10, low: 5 };
    this.maxParticles = particleCounts[tier] || 15;

    this.color = color;
    this.enabled = true;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const alphas = new Float32Array(this.maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // This material will be modified by onBeforeCompile
    const material = new THREE.PointsMaterial({
      color: this.color,
      size: 0.25,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    // Custom shader to read the alpha attribute
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float alpha;
        varying float vAlpha;
        ${shader.vertexShader}
      `.replace(
        `#include <color_vertex>`,
        `#include <color_vertex>
         vAlpha = alpha;`
      );
      shader.fragmentShader = `
        varying float vAlpha;
        ${shader.fragmentShader}
      `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );`
      );
    };

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
    this.particleIndex = 0;
    this.spawnTimer = 0;
  }

  update(playerPosition, deltaTime, isActive = true) {
    if (!isActive || !this.enabled) {
      this.points.visible = false;
      return;
    }

    this.points.visible = true;
    this.spawnTimer += deltaTime;

    const alphas = this.points.geometry.attributes.alpha.array;
    const positions = this.points.geometry.attributes.position.array;

    if (this.spawnTimer > 0.05) {
      this.spawnTimer = 0;
      const index = this.particleIndex % this.maxParticles;
      positions[index * 3] = playerPosition.x + (Math.random() - 0.5) * 0.3;
      positions[index * 3 + 1] = playerPosition.y + 0.3;
      positions[index * 3 + 2] = playerPosition.z + (Math.random() - 0.5) * 0.3;
      alphas[index] = 1.0;
      this.particleIndex++;
    }

    for (let i = 0; i < this.maxParticles; i++) {
      alphas[i] = Math.max(0, alphas[i] - deltaTime * 3);
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.alpha.needsUpdate = true;
  }

  setColor(color) {
    this.color = color;
    this.points.material.color.setHex(color);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.points.visible = enabled;
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}

/**
 * ✅ FIXED: CoinSparkles
 * Uses InstancedMesh with proper MeshBasicMaterial (not PointsMaterial)
 */
export class CoinSparkles {
  constructor(scene) {
    this.scene = scene;
    this.maxSparkles = 30;
    this.enabled = true;

    this.sparkleDataPool = [];
    this.activeSparkles = [];

    // ✅ FIX: Use a small sphere geometry instead of points
    const sparkleGeo = new THREE.SphereGeometry(0.1, 8, 8);

    // ✅ FIX: Use MeshBasicMaterial which is compatible with InstancedMesh
    const sparkleMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.instancedSparkles = new THREE.InstancedMesh(sparkleGeo, sparkleMat, this.maxSparkles);
    this.scene.add(this.instancedSparkles);

    for (let i = 0; i < this.maxSparkles; i++) {
      this.sparkleDataPool.push({
        id: i,
        active: false,
        time: 0,
        target: null,
      });
      // Hide instance initially
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.instancedSparkles.setMatrixAt(i, _dummy.matrix);
    }
    this.instancedSparkles.instanceMatrix.needsUpdate = true;
  }

  addCoin(coin) {
    if (!this.enabled || this.sparkleDataPool.length === 0) return;

    const sparkleData = this.sparkleDataPool.pop();

    sparkleData.time = 0;
    sparkleData.target = coin;
    sparkleData.active = true;

    this.activeSparkles.push(sparkleData);
  }

  removeCoin(coin) {
    const index = this.activeSparkles.findIndex(s => s.target === coin);
    if (index > -1) {
      const sparkleData = this.activeSparkles[index];
      sparkleData.active = false;
      sparkleData.target = null;
      this.activeSparkles.splice(index, 1);
      this.sparkleDataPool.push(sparkleData);

      // Hide the instance
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.instancedSparkles.setMatrixAt(sparkleData.id, _dummy.matrix);
      // We don't need to flag needsUpdate here, update() will
    }
  }

  update(deltaTime, playerZ, updateDistance) {
    if (!this.enabled) return;

    let needsMatrixUpdate = false;

    for (let i = this.activeSparkles.length - 1; i >= 0; i--) {
      const sparkleData = this.activeSparkles[i];
      const coin = sparkleData.target;

      if (!coin || !coin.active) {
        this.removeCoin(coin); // This will hide the instance
        needsMatrixUpdate = true;
        continue;
      }

      if (Math.abs(playerZ - coin.position.z) > updateDistance) {
        _dummy.scale.set(0, 0, 0); // Hide if far away
      } else {
        sparkleData.time += deltaTime;
        _dummy.position.copy(coin.position);
        _dummy.rotation.z = sparkleData.time * 2;
        _dummy.scale.set(1, 1, 1);
      }

      _dummy.updateMatrix();
      this.instancedSparkles.setMatrixAt(sparkleData.id, _dummy.matrix);
      needsMatrixUpdate = true;
    }

    if (needsMatrixUpdate) {
      this.instancedSparkles.instanceMatrix.needsUpdate = true;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.instancedSparkles.visible = enabled;
  }

  dispose() {
    this.scene.remove(this.instancedSparkles);
    this.instancedSparkles.geometry.dispose();
    this.instancedSparkles.material.dispose();
    this.sparkleDataPool = [];
    this.activeSparkles = [];
  }
}

/**
 * ✅ FIXED: PowerUpAura  
 * Removed onBeforeCompile shader modification that was causing errors
 */
export class PowerUpAura {
  constructor(scene) {
    this.scene = scene;
    this.maxAuras = 10;
    this.enabled = true;

    this.auraDataPool = [];
    this.activeAuras = [];

    this.colorMap = {
      shield: 0x5b8fc7,
      multiplier: 0xffaa00,
      magnet: 0x00ff00,
      health: 0xffffff,
      time: 0xaaaaff
    };

    const auraGeo = new THREE.RingGeometry(0.5, 0.7, 16);

    // ✅ FIX: Use standard MeshBasicMaterial without shader modifications
    // We'll change the color dynamically instead
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Will be changed per instance via setColorAt
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.instancedAuras = new THREE.InstancedMesh(auraGeo, auraMat, this.maxAuras);
    this.instancedAuras.rotation.x = Math.PI / 2;
    this.scene.add(this.instancedAuras);

    // Initialize color array for setColorAt
    for (let i = 0; i < this.maxAuras; i++) {
      this.auraDataPool.push({
        id: i,
        active: false,
        time: 0,
        target: null,
        color: 0xffffff
      });
      // Hide instance initially
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.instancedAuras.setMatrixAt(i, _dummy.matrix);
      this.instancedAuras.setColorAt(i, new THREE.Color(0xffffff));
    }
    this.instancedAuras.instanceMatrix.needsUpdate = true;
  }

  addPowerUp(powerUp) {
    if (!this.enabled || this.auraDataPool.length === 0) return;

    const type = powerUp.userData.type;
    const color = this.colorMap[type] || this.colorMap.shield;

    const auraData = this.auraDataPool.pop();
    auraData.time = 0;
    auraData.target = powerUp;
    auraData.active = true;
    auraData.color = color;

    // ✅ FIX: Use setColorAt which is the proper way to set per-instance colors
    this.instancedAuras.setColorAt(auraData.id, new THREE.Color(color));
    this.instancedAuras.instanceColor.needsUpdate = true;

    this.activeAuras.push(auraData);
  }

  removePowerUp(powerUp) {
    const index = this.activeAuras.findIndex(a => a.target === powerUp);
    if (index > -1) {
      const auraData = this.activeAuras[index];
      auraData.active = false;
      auraData.target = null;
      this.activeAuras.splice(index, 1);
      this.auraDataPool.push(auraData);

      // Hide the instance
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.instancedAuras.setMatrixAt(auraData.id, _dummy.matrix);
      // We don't need to flag needsUpdate here, update() will
    }
  }

  update(deltaTime, playerZ, updateDistance) {
    if (!this.enabled) return;

    let needsMatrixUpdate = false;

    for (let i = this.activeAuras.length - 1; i >= 0; i--) {
      const auraData = this.activeAuras[i];
      const powerUp = auraData.target;

      if (!powerUp || !powerUp.visible || !powerUp.active) {
        this.removePowerUp(powerUp); // This will hide the instance
        needsMatrixUpdate = true;
        continue;
      }

      if (Math.abs(playerZ - powerUp.position.z) > updateDistance) {
        _dummy.scale.set(0, 0, 0); // Hide if far away
      } else {
        auraData.time += deltaTime;
        const scale = 1 + Math.sin(auraData.time * 4) * 0.2;
        _dummy.position.copy(powerUp.position);
        _dummy.rotation.z = auraData.time * 2;
        _dummy.scale.set(scale, scale, 1);
      }

      _dummy.updateMatrix();
      this.instancedAuras.setMatrixAt(auraData.id, _dummy.matrix);
      needsMatrixUpdate = true;
    }

    if (needsMatrixUpdate) {
      this.instancedAuras.instanceMatrix.needsUpdate = true;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.instancedAuras.visible = enabled;
  }

  dispose() {
    this.scene.remove(this.instancedAuras);
    this.instancedAuras.geometry.dispose();
    this.instancedAuras.material.dispose();
    this.auraDataPool = [];
    this.activeAuras = [];
  }
}

/**
 * TemporaryParticleSystem - Uses PlaneGeometry + ShaderMaterial for particles
 */
export class TemporaryParticleSystem {
  constructor(scene, maxParticles = 100) {
    this.scene = scene;

    // ✅ Performance-aware particle count
    const perfManager = getPerformanceManager();
    const tier = perfManager.getCurrentTier();
    const particleCounts = { high: 100, medium: 60, low: 30 };
    this.maxParticles = particleCounts[tier] || maxParticles;

    this.particleDataPool = [];
    this.activeParticles = [];

    // Simple plane geometry for billboarding
    const particleGeo = new THREE.PlaneGeometry(1, 1);

    // Add instance attributes
    const offsets = new Float32Array(this.maxParticles * 3); // position
    const velocities = new Float32Array(this.maxParticles * 3); // velocity
    const colors = new Float32Array(this.maxParticles * 3); // color
    const info = new Float32Array(this.maxParticles * 4); // x: age, y: lifetime, z: size, w: gravity

    particleGeo.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    particleGeo.setAttribute('velocity', new THREE.InstancedBufferAttribute(velocities, 3));
    particleGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
    particleGeo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));

    // ✅ FIX #25: Set frustum culling bounds for optimization
    particleGeo.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      1000 // Large radius for moving particles
    );

    particleGeo.boundingBox = new THREE.Box3(
      new THREE.Vector3(-500, -500, -500),
      new THREE.Vector3(500, 500, 500)
    );

    // Custom ShaderMaterial
    const particleMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uTexture: { value: this.createDotTexture() }
      },
      vertexShader: `
        uniform float uTime;
        attribute vec3 offset;
        attribute vec3 velocity;
        attribute vec3 aColor;
        attribute vec4 aInfo;

        varying vec3 vColor;
        varying float vLifeProgress;
        varying vec2 vUv; // ✅ SHADER BUG FIX: Add vUv varying
        
        void main() {
          vUv = uv; // ✅ SHADER BUG FIX: Pass uv to fragment shader
          float age = aInfo.x;
          float lifetime = aInfo.y;
          float size = aInfo.z;
          float gravity = aInfo.w;
          
          float timeElapsed = uTime - age;
          vLifeProgress = timeElapsed / lifetime;
          
          // ✅ FIX: Check if particle should be hidden
          if (lifetime < 0.0 || vLifeProgress > 1.0 || vLifeProgress < 0.0) {
            gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
            vColor = vec3(0.0);
            return;
          }

          // GPU-side physics
          vec3 newPos = offset;
          newPos += velocity * timeElapsed;
          newPos.y -= 0.5 * gravity * timeElapsed * timeElapsed;
          
          // Billboard to camera
          vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
          mvPosition.xyz += position * size * (1.0 + vLifeProgress * 0.5);
          
          vColor = aColor;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vLifeProgress;
        varying vec2 vUv; // ✅ SHADER BUG FIX: Receive vUv
        
        void main() {
          float alpha = 1.0 - vLifeProgress;
          // ✅ SHADER BUG FIX: Use vUv, not gl_FragCoord
          vec4 tex = texture2D(uTexture, vUv);
          // ✅ SHADER BUG FIX: Use texture alpha and multiply by color
          gl_FragColor = vec4(vColor * tex.rgb, alpha * tex.a * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Use InstancedMesh instead of Points
    this.particleSystem = new THREE.InstancedMesh(particleGeo, particleMat, this.maxParticles);
    this.scene.add(this.particleSystem);

    // Pre-fill the data pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particleDataPool.push({
        id: i,
        active: false,
        spawnTime: 0,
        lifetime: 0,
      });
      // Initialize lifetime to -1 to hide all
      info[i * 4 + 1] = -1.0;

      // Hide instances initially
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.particleSystem.setMatrixAt(i, _dummy.matrix);
    }
    this.particleSystem.instanceMatrix.needsUpdate = true;

    this.clock = new THREE.Clock();
  }

  createDotTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  spawn(type, position, color, size = 'normal') {
    if (this.particleDataPool.length === 0) return;

    const particleData = this.particleDataPool.pop();
    particleData.active = true;
    particleData.spawnTime = this.clock.getElapsedTime();

    const id = particleData.id;
    const geo = this.particleSystem.geometry;

    geo.attributes.offset.setXYZ(id, position.x, position.y, position.z);

    // Initialize all variables with defaults
    let life = 0.3;
    let s = 0.2;
    let g = 0.0;
    const vel = _tempVector.set(0, 0, 0);

    if (type === 'coin') {
      vel.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );
      life = 0.5;
      s = 0.1;
      g = 5.0;
      geo.attributes.aColor.setXYZ(id, 1.0, 0.84, 0.0);
    } else if (type === 'powerup') {
      vel.set(0, 2, 0);
      life = 0.6;
      s = 0.2;
      g = 0.0;
      const c = color || { r: 1, g: 1, b: 1 };
      geo.attributes.aColor.setXYZ(id, c.r, c.g, c.b);
    } else { // 'impact' or default
      vel.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      );
      life = 0.3;
      s = size === 'large' ? 0.4 : 0.2;
      g = 0.0;
      const c = color || { r: 1, g: 1, b: 1 };
      geo.attributes.aColor.setXYZ(id, c.r, c.g, c.b);
    }

    particleData.lifetime = life;

    geo.attributes.velocity.setXYZ(id, vel.x, vel.y, vel.z);
    geo.attributes.aInfo.setXYZW(id, particleData.spawnTime, life, s, g);

    geo.attributes.offset.needsUpdate = true;
    geo.attributes.velocity.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aInfo.needsUpdate = true;

    // Make instance visible
    _dummy.position.set(0, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    this.particleSystem.setMatrixAt(id, _dummy.matrix);
    this.particleSystem.instanceMatrix.needsUpdate = true;

    this.activeParticles.push(particleData);
  }

  update(deltaTime) {
    const currentTime = this.clock.getElapsedTime();
    this.particleSystem.material.uniforms.uTime.value = currentTime;

    let needsUpdate = false;
    let infoNeedsUpdate = false;
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];

      if (currentTime - particle.spawnTime > particle.lifetime) {
        particle.active = false;
        this.activeParticles.splice(i, 1);
        this.particleDataPool.push(particle);

        // Hide the instance
        _dummy.scale.set(0, 0, 0);
        _dummy.updateMatrix();
        this.particleSystem.setMatrixAt(particle.id, _dummy.matrix);

        // Set lifetime to -1 to hide in shader
        this.particleSystem.geometry.attributes.aInfo.setY(particle.id, -1.0);
        needsUpdate = true;
        infoNeedsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.particleSystem.instanceMatrix.needsUpdate = true;
    }
    if (infoNeedsUpdate) {
      this.particleSystem.geometry.attributes.aInfo.needsUpdate = true;
    }
  }

  dispose() {
    this.scene.remove(this.particleSystem);
    this.particleSystem.geometry.dispose();
    this.particleSystem.material.uniforms.uTexture.value.dispose();
    this.particleSystem.material.dispose();
    this.activeParticles = [];
    this.particleDataPool = [];
  }
}