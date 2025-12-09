import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class PowerUpModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map();
    this.loading = new Map();

    this.modelPaths = {
      hoverboard: '/assets/powerups/Hoverboard.glb',
      lightning: '/assets/powerups/Lightning.glb',
      shield: '/assets/powerups/Shield.glb',
      magnet: '/assets/powerups/Magnet.glb',
      multiplier: '/assets/powerups/Multiplier.glb',
      health: '/assets/powerups/Health.glb',
      time: '/assets/powerups/Timeslow.glb'
    };

    this.configs = {
      // ✅ HOVERBOARD - Bright Cyan (unique ability)
      hoverboard: {
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2.0,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0x00ffff,
        particleColor: 0x00ffff,
        lightIntensity: 3.5,
        lightDistance: 8
      },
      // ✅ LIGHTNING DASH - Electric Purple (unique ability)
      lightning: {
        color: 0xaa00ff,
        emissive: 0xaa00ff,
        emissiveIntensity: 2.5,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0xcc00ff,
        particleColor: 0xaa00ff,
        lightIntensity: 4.0,
        lightDistance: 8
      },
      // ✅ SHIELD - Bright Blue (protection)
      shield: {
        color: 0x0088ff,
        emissive: 0x0088ff,
        emissiveIntensity: 1.8,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0x0088ff,
        particleColor: 0x00aaff,
        lightIntensity: 3.0,
        lightDistance: 7
      },
      // ✅ MAGNET - Bright Magenta/Pink (attraction)
      magnet: {
        color: 0xff00aa,
        emissive: 0xff00aa,
        emissiveIntensity: 1.8,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0xff00aa,
        particleColor: 0xff66cc,
        lightIntensity: 3.0,
        lightDistance: 7
      },
      // ✅ MULTIPLIER - Bright Gold (coins/score)
      multiplier: {
        color: 0xffcc00,
        emissive: 0xffaa00,
        emissiveIntensity: 2.0,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0xffcc00,
        particleColor: 0xffdd00,
        lightIntensity: 3.5,
        lightDistance: 7
      },
      // ✅ HEALTH - Solid Green with White cross (healing)
      health: {
        color: 0x00ff66,        // Bright green body
        emissive: 0x00ff00,     // Green glow
        emissiveIntensity: 2.0,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0x00ff66,
        particleColor: 0x00ff00,
        lightIntensity: 3.5,
        lightDistance: 7
      },
      // ✅ TIME SLOW - Bright Light Blue/Purple (time)
      time: {
        color: 0x66ccff,
        emissive: 0x6688ff,
        emissiveIntensity: 1.8,
        scale: 1.2,
        rotation: { x: 0, y: 0, z: 0 },
        lightColor: 0x66ccff,
        particleColor: 0x88aaff,
        lightIntensity: 3.0,
        lightDistance: 7
      }
    };
  }

  async preloadAll() {
    console.log('🎨 Preloading power-up models...');
    const startTime = Date.now();

    const promises = Object.keys(this.modelPaths).map(type =>
      this.loadModel(type).catch(err => {
        console.warn(`⚠️ Failed to load ${type}: ${err.message}`);
        return null;
      })
    );

    await Promise.all(promises);

    const loadTime = Date.now() - startTime;
    const loaded = Array.from(this.cache.keys()).length;
    console.log(`✅ Loaded ${loaded}/${Object.keys(this.modelPaths).length} power-up models in ${loadTime}ms`);

    Object.keys(this.modelPaths).forEach(type => {
      if (!this.cache.has(type)) {
        console.warn(`⚠️ ${type} will use fallback geometry`);
      }
    });
  }

  async loadModel(type) {
    console.log(`Loading power-up model: ${type} from ${this.modelPaths[type]}`);
    if (this.cache.has(type)) {
      return this.cache.get(type).clone();
    }

    if (this.loading.has(type)) {
      return this.loading.get(type);
    }

    const path = this.modelPaths[type];
    if (!path) {
      throw new Error(`Unknown power-up type: ${type}`);
    }

    const promise = new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          console.log(`Loaded power-up model: ${type}`);
          const model = gltf.scene;
          const config = this.configs[type];

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          const normalizeScale = 1.0 / maxDimension;
          const finalScale = normalizeScale * config.scale;

          model.scale.set(finalScale, finalScale, finalScale);

          box.setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);

          model.traverse((child) => {
            if (child.isMesh) {
              const originalMap = child.material?.map || null;

              child.material = new THREE.MeshStandardMaterial({
                color: config.color,
                emissive: config.emissive,
                emissiveIntensity: config.emissiveIntensity,
                metalness: 0.7,
                roughness: 0.3,
                transparent: true,
                opacity: 0.95,
                map: originalMap
              });
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });

          this.cache.set(type, model);
          this.loading.delete(type);

          resolve(model.clone());
        },
        undefined,
        (error) => {
          console.error(`❌ Error loading ${type}:`, error.message);
          this.loading.delete(type);
          reject(error);
        }
      );
    });

    this.loading.set(type, promise);
    return promise;
  }

  async createPowerUp(type) {
    try {
      const model = await this.loadModel(type);
      const config = this.configs[type];

      const container = new THREE.Group();
      container.add(model);

      // ✅ Performance optimization: Skip lights on low tier devices
      const { getPerformanceManager } = await import('../../utils/performance/PerformanceManager.js');
      const perfManager = getPerformanceManager();
      const tier = perfManager.getCurrentTier();

      if (tier !== 'low') {
        const light = new THREE.PointLight(
          config.lightColor,
          config.lightIntensity || 3,
          config.lightDistance || 7
        );
        light.position.set(0, 0, 0.3);
        container.add(light);
      }

      const ring = this.createParticleRing(config.particleColor);
      ring.name = 'particleRing';
      ring.scale.set(0.5, 0.5, 0.5);
      container.add(ring);

      container.userData.config = config;
      container.userData.type = type;
      container.userData.baseY = 1.5;
      container.userData.isModel = true;

      return container;

    } catch (error) {
      console.warn(`⚠️ Using fallback geometry for ${type}:`, error.message);
      return this.createFallbackPowerUp(type);
    }
  }

  createParticleRing(color) {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorObj = new THREE.Color(color);
    const radius = 0.35;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  createFallbackPowerUp(type) {
    const config = this.configs[type];
    const fallbackScale = 1.2;
    let geometry;

    switch (type) {
      case 'hoverboard':
        geometry = new THREE.BoxGeometry(fallbackScale * 1.6, fallbackScale * 0.2, fallbackScale * 2.4);
        break;
      case 'lightning':
        geometry = new THREE.DodecahedronGeometry(fallbackScale);
        break;
      case 'shield':
        geometry = new THREE.IcosahedronGeometry(fallbackScale);
        break;
      case 'magnet':
        geometry = new THREE.TorusGeometry(fallbackScale * 0.7, fallbackScale * 0.3, 8, 16);
        break;
      case 'multiplier':
        geometry = new THREE.OctahedronGeometry(fallbackScale);
        break;
      case 'health':
        const shape = new THREE.Shape();
        const s = fallbackScale * 0.3;
        shape.moveTo(-s * 3, -s);
        shape.lineTo(-s, -s);
        shape.lineTo(-s, -s * 3);
        shape.lineTo(s, -s * 3);
        shape.lineTo(s, -s);
        shape.lineTo(s * 3, -s);
        shape.lineTo(s * 3, s);
        shape.lineTo(s, s);
        shape.lineTo(s, s * 3);
        shape.lineTo(-s, s * 3);
        shape.lineTo(-s, s);
        shape.lineTo(-s * 3, s);
        shape.closePath();
        geometry = new THREE.ExtrudeGeometry(shape, { depth: s, bevelEnabled: false });
        break;
      case 'time':
        geometry = new THREE.TorusKnotGeometry(fallbackScale * 0.6, fallbackScale * 0.2, 64, 8);
        break;
      default:
        geometry = new THREE.SphereGeometry(fallbackScale, 16, 16);
    }

    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      metalness: 0.7,
      roughness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    const container = new THREE.Group();
    container.add(mesh);

    const light = new THREE.PointLight(
      config.lightColor,
      config.lightIntensity || 3,
      config.lightDistance || 7
    );
    light.position.set(0, 0, 0.3);
    container.add(light);

    const ring = this.createParticleRing(config.particleColor);
    ring.name = 'particleRing';
    ring.scale.set(0.5, 0.5, 0.5);
    container.add(ring);

    container.userData.config = config;
    container.userData.type = type;
    container.userData.baseY = 1.5;
    container.userData.isFallback = true;

    return container;
  }

  animatePowerUp(powerUp, deltaTime, elapsedTime) {
    if (!powerUp || !powerUp.visible) return;

    const floatSpeed = 2;
    const floatAmplitude = 0.2;
    const baseY = powerUp.userData.baseY || 1.5;
    powerUp.position.y = baseY + Math.sin(elapsedTime * floatSpeed) * floatAmplitude;

    powerUp.rotation.y += deltaTime * 2;

    const type = powerUp.userData.type;
    if (type === 'hoverboard' || type === 'lightning') {
      const pulseSpeed = 3;
      const pulseScale = 0.08;
      const scale = 1 + Math.sin(elapsedTime * pulseSpeed) * pulseScale;
      powerUp.scale.set(scale, scale, scale);
    }

    const ring = powerUp.getObjectByName('particleRing');
    if (ring) {
      ring.rotation.y += deltaTime * 1.5;
    }

    const lights = powerUp.children.filter(child => child.isLight);
    lights.forEach(light => {
      const config = powerUp.userData.config;
      const baseIntensity = config?.lightIntensity || 2;
      light.intensity = baseIntensity + Math.sin(elapsedTime * 4) * (baseIntensity * 0.3);
    });
  }

  dispose() {
    this.cache.forEach(model => {
      model.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });

    this.cache.clear();
    this.loading.clear();
  }
}

export default PowerUpModelLoader;
