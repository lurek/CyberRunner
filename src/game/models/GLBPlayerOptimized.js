import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Enhanced GLB Player with Full Animation Support
 * Supports: Idle, Running, Jump, Flying, Falling Idle, Surf
 */
export class GLBPlayerOptimized {
  constructor(scene) {
    this.scene = scene;
    this.anchor = new THREE.Group(); 
    this.model = null;
    this.mixer = null;
    this.animations = {};
    this.currentAction = null;
    this.isDisposed = false;
    this.characterConfig = null;

    // Animation state tracking
    this.animationState = 'idle';
    this.previousState = null;

    // Resources for cleanup
    this.resources = { geometries: [], materials: [], lights: [] };
    
    this._setupLighting();
    this.scene.add(this.anchor);
  }

  _setupLighting() {
    // 💡 Hero Light (Follows Player)
    const heroLight = new THREE.SpotLight(0xffffff, 10.0);
    heroLight.position.set(0, 8, 4);
    heroLight.target = this.anchor; 
    heroLight.angle = 0.8;
    heroLight.distance = 30;
    this.anchor.add(heroLight);
    this.resources.lights.push(heroLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.anchor.add(ambientLight);
    this.resources.lights.push(ambientLight);
  }

  async load(modelUrl, characterConfig = null) {
    this.characterConfig = characterConfig;
    
    return new Promise((resolve) => {
      // Check if URL is valid
      if (!modelUrl || typeof modelUrl !== 'string') {
        console.warn("⚠️ Invalid Model URL. Generating Cyber-Avatar...");
        this._createProceduralPlayer(); 
        resolve(this.anchor);
        return;
      }

      const loader = new GLTFLoader();
      console.log("🔄 Loading GLB from:", modelUrl);

      loader.load(
        modelUrl,
        (gltf) => {
          if (this.isDisposed) return;
          console.log("✅ GLB Loaded Successfully!");
          this._processGLTF(gltf);
          resolve(this.anchor); 
        },
        undefined, // Progress
        (error) => {
          console.error("❌ GLB Load Failed:", error);
          console.warn("⚠️ Switching to Fallback Cyber-Avatar.");
          this._createProceduralPlayer();
          resolve(this.anchor);
        }
      );
    });
  }

  _processGLTF(gltf) {
    this.model = gltf.scene;
    
    // Apply character scale if provided
    if (this.characterConfig?.scale) {
      this.model.scale.setScalar(this.characterConfig.scale);
    }
    
    // Enable shadows
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Optimize materials
        if (child.material) {
          child.material.needsUpdate = true;
          this.resources.materials.push(child.material);
        }
        
        if (child.geometry) {
          this.resources.geometries.push(child.geometry);
        }
      }
    });

    // Setup animation mixer
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      
      console.log('📋 Available animations:', gltf.animations.map(a => a.name));
      
      // Map all animations
      gltf.animations.forEach((clip) => {
        const actionName = clip.name.toLowerCase();
        this.animations[actionName] = this.mixer.clipAction(clip);
        console.log(`  ✅ Mapped: ${clip.name} -> ${actionName}`);
      });

      // Auto-map common animation names
      this._autoMapAnimations(gltf.animations);
      
      // Start with idle animation
      this.playAnimation('idle', true);
    } else {
      console.warn('⚠️ No animations found in model');
    }

    this.anchor.add(this.model);
  }

  /**
   * Auto-detect and map common animation names
   */
  _autoMapAnimations(clips) {
    const nameMap = {
      // Idle variations
      'idle': 'idle',
      'idle_1': 'idle',
      'stand': 'idle',
      'standing': 'idle',
      
      // Running variations
      'running': 'running',
      'run': 'running',
      'jog': 'running',
      
      // Jump variations
      'jump': 'jump',
      'jumping': 'jump',
      'leap': 'jump',
      
      // Flying variations
      'flying': 'flying',
      'fly': 'flying',
      'glide': 'flying',
      
      // Falling variations
      'falling idle': 'falling',
      'falling': 'falling',
      'fall': 'falling',
      
      // Surf variations
      'surf': 'surf',
      'surfing': 'surf',
      'slide': 'surf'
    };

    clips.forEach((clip) => {
      const clipName = clip.name.toLowerCase().trim();
      
      for (const [key, value] of Object.entries(nameMap)) {
        if (clipName.includes(key)) {
          if (!this.animations[value]) {
            this.animations[value] = this.mixer.clipAction(clip);
            console.log(`  🎯 Auto-mapped: ${clip.name} -> ${value}`);
          }
          break;
        }
      }
    });
  }

  /**
   * Play a specific animation with smooth transitions
   * @param {string} animationName - Name of animation (idle, running, jump, flying, falling, surf)
   * @param {boolean} loop - Whether to loop the animation
   * @param {number} transitionDuration - Fade transition time in seconds
   */
  playAnimation(animationName, loop = true, transitionDuration = 0.25) {
    if (!this.mixer) return;

    const targetName = animationName.toLowerCase();
    const targetAction = this.animations[targetName];

    if (!targetAction) {
      console.warn(`⚠️ Animation "${animationName}" not found. Available:`, Object.keys(this.animations));
      return;
    }

    // Don't replay if already playing
    if (this.currentAction === targetAction && this.animationState === targetName) {
      return;
    }

    // Fade out current animation
    if (this.currentAction && this.currentAction !== targetAction) {
      this.currentAction.fadeOut(transitionDuration);
    }

    // Setup and play new animation
    targetAction.reset();
    targetAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    targetAction.clampWhenFinished = !loop;
    targetAction.fadeIn(transitionDuration);
    targetAction.play();

    this.previousState = this.animationState;
    this.animationState = targetName;
    this.currentAction = targetAction;

    console.log(`🎬 Playing: ${animationName} (${loop ? 'loop' : 'once'})`);
  }

  /**
   * Update animation state based on game state
   */
  updateAnimationState(gameState) {
    if (!this.mixer) return;

    const { isJumping, isFlying, isSurfing, velocity, isGrounded } = gameState;

    // Priority-based animation selection
    if (isFlying) {
      this.playAnimation('flying');
    } else if (isSurfing) {
      this.playAnimation('surf');
    } else if (isJumping || !isGrounded) {
      if (velocity.y > 0) {
        this.playAnimation('jump', false);
      } else if (velocity.y < -2) {
        this.playAnimation('falling');
      }
    } else if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1) {
      this.playAnimation('running');
    } else {
      this.playAnimation('idle');
    }
  }

  /**
   * Update animation mixer (call every frame)
   */
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  /**
   * Get current animation state
   */
  getAnimationState() {
    return {
      current: this.animationState,
      previous: this.previousState,
      isPlaying: this.currentAction?.isRunning() || false
    };
  }

  // 🤖 FALLBACK: procedural Cyber-Avatar (Used if GLB fails)
  _createProceduralPlayer() {
    const group = new THREE.Group();

    // Body (Neon Blue)
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        emissive: 0x0044aa, 
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    body.castShadow = true;
    group.add(body);
    this.resources.geometries.push(bodyGeo);
    this.resources.materials.push(bodyMat);

    // Head (Glowing)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.6;
    head.castShadow = true;
    group.add(head);
    this.resources.geometries.push(headGeo);
    this.resources.materials.push(headMat);

    // Jetpack (Red Glow)
    const jetGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const jetMat = new THREE.MeshStandardMaterial({ 
      color: 0xff3333, 
      emissive: 0xff0000, 
      emissiveIntensity: 1.0 
    });
    const jetpack = new THREE.Mesh(jetGeo, jetMat);
    jetpack.position.set(0, 1.6, -0.4);
    group.add(jetpack);
    this.resources.geometries.push(jetGeo);
    this.resources.materials.push(jetMat);

    this.model = group;
    this.anchor.add(group);
    console.log('🤖 Procedural player created');
  }

  // Cleanup
  dispose() {
    this.isDisposed = true;
    
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.resources.geometries.forEach(g => g.dispose());
    this.resources.materials.forEach(m => m.dispose());
    this.resources.lights.forEach(l => {
      if (l.parent) l.parent.remove(l);
      l.dispose();
    });

    if (this.model) {
      this.anchor.remove(this.model);
    }

    if (this.scene && this.anchor) {
      this.scene.remove(this.anchor);
    }

    this.animations = {};
    this.currentAction = null;
    console.log('🗑️ GLBPlayerOptimized disposed');
  }
}
