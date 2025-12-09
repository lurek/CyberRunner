import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class GLBPlayerSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.anchor = new THREE.Group();
    this.model = null;
    this.mixer = null;
    this.animations = {};
    this.currentAction = null;
    this.options = { showShadow: true, ...options };

    // Track if slide animation exists for fallback squeeze
    this.hasSlideAnimation = false;
    this.isSqueezeSliding = false;
    this.originalModelScale = null;
    this.baseModelYOffset = 0;

    // Only setup real lighting if shadows are enabled (High Quality)
    this._setupLighting(this.options.showShadow);
    this.scene.add(this.anchor);

    // Create blob shadow if real shadows are disabled
    if (!this.options.showShadow) {
      this._createBlobShadow();
    }
  }

  _setupLighting(hasRealShadows) {
    if (hasRealShadows) {
      const heroLight = new THREE.SpotLight(0xffffff, 10.0);
      heroLight.position.set(0, 8, 4);
      heroLight.target = this.anchor;
      heroLight.angle = 0.8;
      heroLight.distance = 30;
      heroLight.castShadow = true;
      this.anchor.add(heroLight);
    }

    const ambientIntensity = hasRealShadows ? 1.5 : 2.5;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    this.anchor.add(ambientLight);
  }

  _createBlobShadow() {
    const geometry = new THREE.PlaneGeometry(0.8, 0.8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;
    material.alphaMap = texture;

    const shadowPlane = new THREE.Mesh(geometry, material);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.05;
    this.anchor.add(shadowPlane);
    this.blobShadow = shadowPlane;
  }

  async load(url, characterConfig = null) {
    return new Promise((resolve, reject) => {
      console.log("🔄 Simple System: Loading...", url);

      const loader = new GLTFLoader();

      loader.load(
        url,
        (gltf) => {
          console.log("✅ Simple System: GLB Loaded!");
          this.model = gltf.scene;

          this.model.position.set(0, 0, 0);

          // Calculate initial bounding box for scaling calculation
          const box = new THREE.Box3().setFromObject(this.model);
          const size = new THREE.Vector3();
          box.getSize(size);
          // ✅ FIX: Scale 2.8 - good balance between visibility and sliding under bars
          const baseScale = 2.8 / (size.y || 1);
          const characterScale = characterConfig?.gameplayScale || characterConfig?.scale || 1.0;
          const scaleFactor = baseScale * characterScale;
          console.log(`📏 Character scale: base=${baseScale.toFixed(2)}, multiplier=${characterScale}, final=${scaleFactor.toFixed(2)}`);
          this.model.scale.setScalar(scaleFactor);

          // Recalculate bounding box AFTER scaling, then adjust Y position
          this.model.updateMatrixWorld(true);
          const scaledBox = new THREE.Box3().setFromObject(this.model);
          // Store the base Y offset so update() can preserve it
          this.baseModelYOffset = -scaledBox.min.y;
          this.model.position.y = this.baseModelYOffset;
          console.log(`📍 Character Y position adjusted to: ${this.model.position.y.toFixed(2)} (scaledBox.min.y was ${scaledBox.min.y.toFixed(2)})`);

          this.model.rotation.y = Math.PI;

          this.model.traverse((c) => {
            if (c.isMesh) {
              c.castShadow = true;
              if (c.material) {
                c.material.emissive = new THREE.Color(0x222222);
                c.material.emissiveIntensity = 0.5;
              }
            }
          });

          if (gltf.animations?.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);

            this.mixer.addEventListener('finished', (e) => {
              const action = e.action;
              const clipName = action.getClip().name;
              const jumpName = this.animations['jump']?.name;
              const slideName = this.animations['slide']?.name;
              if (clipName === jumpName || clipName === slideName) {
                this.playAnimation('run');
              }
            });

            gltf.animations.forEach(clip => {
              clip.tracks = clip.tracks.filter(track => !track.name.includes('.position'));

              this.animations[clip.name] = clip;
              const n = clip.name.toLowerCase();

              if (n.includes('run')) {
                this.animations['run'] = clip;
                console.log(`✅ Detected 'run' animation: ${clip.name}`);
              }

              if (n.includes('jump')) {
                this.animations['jump'] = clip;
                console.log(`✅ Detected 'jump' animation: ${clip.name}`);
              }

              if (n.includes('slide')) {
                this.animations['slide'] = clip;
                this.animations['Anim_slide'] = clip;
                this.animations['Anim_Slide'] = clip;
                this.animations['Slide'] = clip;
                this.slideAnimationName = clip.name;
                this.hasSlideAnimation = true;
                console.log(`✅ Detected 'slide' animation: ${clip.name}`);
              }

              if (n.includes('idle')) {
                this.animations['idle'] = clip;
                console.log(`✅ Detected 'idle' animation: ${clip.name}`);
              }
            });

            console.log(`📋 All mapped animations:`, Object.keys(this.animations).filter(k => !k.includes('.')));

            if (this.animations['run']) this.playAnimation('run');
          }

          this.anchor.add(this.model);

          if (!this.anchor.userData) this.anchor.userData = {};

          const hitSize = new THREE.Vector3(0.7, 1.8, 0.7);
          const hitCenter = new THREE.Vector3(0, 0.9, 0);

          this.anchor.userData.localBox = new THREE.Box3().setFromCenterAndSize(hitCenter, hitSize);
          this.anchor.userData.worldBox = new THREE.Box3();
          this.anchor.userData.baseLocalCenterY = hitCenter.y;
          this.anchor.userData.hitSize = hitSize.clone();

          this.anchor.updateMatrixWorld(true);
          this.anchor.userData.worldBox.copy(this.anchor.userData.localBox).applyMatrix4(this.anchor.matrixWorld);

          this.anchor.userData.isGLB = true;

          console.log("✅ Player Hitbox Initialized:", this.anchor.userData.worldBox);

          resolve(this.anchor);
        },
        undefined,
        (err) => {
          console.error("❌ Simple System Error:", err);
          this._createRedPlaceholder();
          resolve(this.anchor);
        }
      );
    });
  }

  _createRedPlaceholder() {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
    this.model = new THREE.Mesh(geometry, material);
    this.model.position.y = 1;
    this.anchor.add(this.model);

    this.anchor.userData = {};
    this.anchor.userData.localBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 2, 1));
    this.anchor.userData.worldBox = new THREE.Box3();
  }

  playAnimation(name) {
    console.log(`🎬 playAnimation called with: "${name}"`);
    if (!this.mixer) {
      console.warn('⚠️ No mixer available');
      return;
    }
    if (!this.animations[name]) {
      console.warn(`⚠️ Animation "${name}" not found. Available:`, Object.keys(this.animations));
      return;
    }
    const action = this.mixer.clipAction(this.animations[name]);
    if (this.currentAction === action && action.isRunning()) {
      console.log(`✅ Animation "${name}" already running`);
      return;
    }

    const isOneShot = name === 'jump' || name === 'slide' || name === 'Anim_slide' ||
      name === 'Anim_Slide' || name === 'Slide' || name === 'Surf' ||
      name.toLowerCase().includes('surf') || name.toLowerCase().includes('slide');
    if (isOneShot) {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat);
    }

    if (this.currentAction) this.currentAction.fadeOut(0.1);
    action.reset().fadeIn(0.1).play();
    this.currentAction = action;
    this.currentAnimationName = name;
    console.log(`✅ Playing animation: "${name}"`);
  }

  syncAbilityAnimation(abilityType) {
    if (!this.mixer || !this.animations) return;

    if (!abilityType) {
      const priorityAnims = ['jump', 'slide', 'Anim_slide', 'Anim_Slide', 'Slide', 'Surf', 'surf', 'roll', 'attack'];
      const currentName = this.currentAnimationName?.toLowerCase() || '';
      const isPriority = priorityAnims.includes(this.currentAnimationName) ||
        currentName.includes('slide') || currentName.includes('surf');
      if (this.currentAnimationName && isPriority) {
        if (this.currentAction && this.currentAction.isRunning()) {
          return;
        }
      }
    }

    const animationMap = {
      'jetpack': ['flying', 'fly', 'jump', 'idle', 'run'],
      'hoverboard': ['run', 'idle'],
      'lightning': ['idle', 'run'],
      null: ['run', 'idle']
    };

    const namesToTry = animationMap[abilityType] || ['run', 'idle'];
    let foundAnim = null;

    for (const name of namesToTry) {
      if (this.animations[name]) {
        foundAnim = name;
        break;
      }
    }

    if (!foundAnim) {
      const availableAnims = Object.keys(this.animations);
      if (availableAnims.length > 0) {
        foundAnim = availableAnims[0];
      } else {
        console.warn(`⚠️ No animations available for '${abilityType}' ability`);
        return;
      }
    }

    this.playAnimation(foundAnim);
  }

  update(dt, abilityType = null) {
    if (this.mixer) this.mixer.update(dt);

    if (this.model) {
      let rotX = 0;
      let rotY = Math.PI;
      let rotZ = 0;
      let modelY = 0;

      if (abilityType === 'hoverboard') {
        rotY = Math.PI + Math.PI / 2;
        rotZ = -0.22;
        modelY = 0.02;
      }

      if (abilityType === 'jetpack') {
        rotY = Math.PI;
        rotX = -0.3;
        rotZ = 0.1;
        modelY = 0.0;
      }

      if (abilityType === 'lightning') {
        rotY = Math.PI;
        rotX = 0.05;
        modelY = 0.0;
      }

      // ✅ FIX: Apply vertical offset PLUS the base Y offset calculated at load time
      const baseY = this.baseModelYOffset || 0;
      this.model.position.set(0, baseY + modelY, 0);
      this.model.rotation.set(rotX, rotY, rotZ);

      if (this.anchor.userData && typeof this.anchor.userData.baseLocalCenterY !== 'undefined') {
        const baseCenterY = this.anchor.userData.baseLocalCenterY || 0.9;
        const newCenter = new THREE.Vector3(0, baseCenterY + modelY, 0);
        const s = this.anchor.userData.hitSize || new THREE.Vector3(0.7, 1.8, 0.7);
        this.anchor.userData.localBox.setFromCenterAndSize(newCenter, s);
        this.anchor.updateMatrixWorld(true);
        this.anchor.userData.worldBox.copy(this.anchor.userData.localBox).applyMatrix4(this.anchor.matrixWorld);
      }
    }
  }

  getSlideAnimationName() {
    if (this.hasSlideAnimation) {
      return this.slideAnimationName || 'slide';
    }
    return null;
  }

  hasSlideAnim() {
    return this.hasSlideAnimation;
  }

  applySqueezeSlide() {
    if (!this.model) return;

    if (!this.isSqueezeSliding) {
      this.originalModelScale = this.model.scale.clone();
      this.originalModelPositionY = this.model.position.y;

      this.model.scale.y = this.originalModelScale.y * 0.5;
      this.model.position.y = this.originalModelPositionY - 0.5;

      this.isSqueezeSliding = true;
      console.log('🔽 Applied squeeze slide (no slide animation found)');
    }
  }

  removeSqueezeSlide() {
    if (!this.model || !this.isSqueezeSliding) return;

    if (this.originalModelScale) {
      this.model.scale.copy(this.originalModelScale);
    }
    if (typeof this.originalModelPositionY === 'number') {
      this.model.position.y = this.originalModelPositionY;
    }

    this.isSqueezeSliding = false;
    console.log('🔼 Removed squeeze slide');
  }

  isInSqueezeSlide() {
    return this.isSqueezeSliding;
  }

  dispose() {
    this.scene.remove(this.anchor);
  }
}