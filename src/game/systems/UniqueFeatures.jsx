/**
 * UniqueFeatures.js — Jetpack/Hoverboard removed
 *
 * Jetpack and Hoverboard systems were removed from the codebase. Minimal
 * stub classes are kept to preserve API surface for any remaining callers.
 */

import * as THREE from 'three';

/**
 * 🛹 HOVERBOARD SYSTEM - FULLY FIXED
 * Features:
 * - Player stands ON the board (not floating)
 * - Board positioned 0.35m below player
 * - Natural hover oscillation
 * - Banking effect during lane changes
 * - Cyan neon trail behind
 */
export class HoverboardSystem {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants || {};
    this.active = false;
    this.duration = 0;
    this.level = 1;
    this.config = {
      duration: (this.constants?.ABILITIES?.HOVERBOARD?.DURATION) || 10000,
      speedMultiplier: (this.constants?.ABILITIES?.HOVERBOARD?.SPEED_MULTIPLIER) || 1.5,
      hoverHeight: (this.constants?.ABILITIES?.HOVERBOARD?.HOVER_HEIGHT) || 0.5,
      groundImmune: true,
      spawnChance: 0
    };
    this.attachedTo = null;
    
    // Create 3D board model
    const boardGeometry = new THREE.BoxGeometry(0.5, 0.08, 1);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.95
    });
    this.board = new THREE.Mesh(boardGeometry, boardMaterial);
    this.board.castShadow = true;
    this.board.receiveShadow = true;
    
    // Corner pads (lights)
    const padGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8);
    const padMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 1.5
    });
    
    const padPositions = [
      [-0.25, -0.1, 0.5],
      [0.25, -0.1, 0.5],
      [-0.25, -0.1, -0.5],
      [0.25, -0.1, -0.5]
    ];
    
    padPositions.forEach(pos => {
      const pad = new THREE.Mesh(padGeometry, padMaterial);
      pad.position.set(...pos);
      this.board.add(pad);
      
      const padLight = new THREE.PointLight(0xff00ff, 1.5, 2);
      padLight.position.set(...pos);
      this.board.add(padLight);
    });
    
    // Central glow ring
    const ringGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.board.add(ring);
    
    this.board.visible = false;
    this.scene.add(this.board);
    
    // Ensure trail exists so updateTrail won't throw if called before explicit creation
    try {
      this.createTrail();
    } catch (e) {
      console.warn('⚠️ Could not create hoverboard trail in constructor:', e);
    }

    console.log('✅ Hoverboard 3D model created');
  }
  
  /**
   * Create cyan neon trail
   */
  createTrail() {
    const segmentCount = 14;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(segmentCount * 3);
    const colors = new Float32Array(segmentCount * 3);

    for (let i = 0; i < segmentCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = i * 0.5;

      const t = i / (segmentCount - 1);
      // Gradient: cyan -> magenta for a neon trail
      colors[i * 3] = 1.0 * t; // R ramps up
      colors[i * 3 + 1] = 1.0 * (1 - t) * 0.6; // G fades
      colors[i * 3 + 2] = 1.0; // B stays bright
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      linewidth: 5
    });
    
    this.trail = new THREE.Line(geometry, material);
    this.trail.visible = false;
    this.scene.add(this.trail);
    
    console.log('✅ Hoverboard trail created');
  }
  
  getAnimationName() {
    return 'Anim_Idle';
  }
  
  activate(playerPosition) {
    console.log('🛹 [Activate] Starting activation check');
    
    if (this.active) {
      console.warn('⚠️ [Activate] Hoverboard already active, skipping');
      return false;
    }
    
    console.log('🛹 [Activate] Setting active=true');
    this.active = true;
    
    console.log('🛹 [Activate] Setting duration');
    this.duration = this.config.duration;
    
    console.log('🛹 [Activate] Making board visible');
    if (this.board) this.board.visible = true;
    
    console.log('🛹 [Activate] Making trail visible');
    if (this.trail) this.trail.visible = true;
    
    console.log('✅ [Activate] Hoverboard activated - Duration: 10s');
    
    return true;
  }
  
  /**
   * ✅ SUBWAY SURFERS STYLE: Board at ground level, player stands ON it
   */
  update(deltaTime, playerPosition, currentLane) {
    const dt = deltaTime * 1000;
    
    if (!this.active) {
      if (this.board) this.board.visible = false;
      if (this.trail) this.trail.visible = false;
      return { active: false };
    }
    
    this.duration -= dt;
    if (this.duration <= 0) {
      this.deactivate();
      return { active: false, justEnded: true };
    }
    
    // ✅ SUBWAY SURFERS STYLE: Board positioned so player stands ON it
    let boardTopY = 0; // ✅ FIXED: Always define boardTopY to prevent undefined in return
    
    if (playerPosition) {
      // If the board is attached to the player anchor we should use local offsets
      // instead of writing world coordinates to `this.board.position`, because
      // that would cause double transforms and can produce extreme values.
      const boardThickness = 0.08;
      const hoverOscillation = Math.sin(Date.now() * 0.005) * 0.04; // Subtle hover so board doesn't intersect

      if (this.attachedTo) {
        // Keep the board centered relative to the player anchor
        this.board.position.set(0, -0.35 + (this.config.boardFootOffset || 0), 0);
        // local rotation for tilt/wobble
        const targetRotationZ = (currentLane - 1) * -0.15;
        this.board.rotation.z += (targetRotationZ - this.board.rotation.z) * 0.1;
        this.board.rotation.x = -0.1;
        this.board.rotation.y = Math.sin(Date.now() * 0.003) * 0.05;
        boardTopY = playerPosition.y; // ✅ FIXED: Set boardTopY for attached mode
      } else {
        // Board follows player X and Z in world space
        this.board.position.x = playerPosition.x;
        this.board.position.z = playerPosition.z;
        boardTopY = playerPosition.y + (this.config.boardFootOffset || 0) + hoverOscillation;
        this.board.position.y = boardTopY - boardThickness * 0.5;

        const targetRotationZ = (currentLane - 1) * -0.15; // Tilt based on lane
        this.board.rotation.z += (targetRotationZ - this.board.rotation.z) * 0.1;
        this.board.rotation.x = -0.1;
        this.board.rotation.y = Math.sin(Date.now() * 0.003) * 0.05;
      }

      this.updateTrail(playerPosition);
    }
    
    return {
      active: true,
      duration: this.duration,
      speedMultiplier: this.config.speedMultiplier,
      hoverHeight: this.config.hoverHeight,
      groundImmune: this.config.groundImmune,
      animationName: 'Anim_Idle',
      playerHeightOffset: this.config.playerHeightOffset,
      boardTopY
    };
  }
  
  /**
   * Update trail to follow board (at ground level)
   */
  updateTrail(playerPosition) {
    if (!this.trail) return;
    
    const positions = this.trail.geometry.attributes.position.array;
    const segmentCount = positions.length / 3;
    
    // Shift segments back
    for (let i = segmentCount - 1; i > 0; i--) {
      positions[i * 3] = positions[(i - 1) * 3];
      positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
      positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
    }
    
    // ✅ First segment at board position (aligned with player's feet)
    const boardThickness = 0.08;
    const hoverOscillation = Math.sin(Date.now() * 0.005) * 0.05;
    let boardTopY = playerPosition.y + hoverOscillation; // Board top at feet level
    if (this.attachedTo) {
      const wp = new THREE.Vector3();
      this.attachedTo.getWorldPosition(wp);
      positions[0] = wp.x;
      positions[1] = wp.y - boardThickness / 2;
      positions[2] = wp.z;
      boardTopY = wp.y;
    } else {
      positions[0] = playerPosition.x;
      positions[1] = boardTopY - boardThickness / 2; // Board center position
      positions[2] = playerPosition.z;
    }
    
    this.trail.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Attach hoverboard groups to a player anchor so they follow the player
   */
  attachTo(playerAnchor) {
    if (!playerAnchor) return;
    this.attachedTo = playerAnchor;
    if (this.board && !this.board.parent) {
      try { playerAnchor.add(this.board); } catch(e){ console.warn('⚠️ attachTo: failed to add board', e); }
    }
    // Keep the trail in world-space (scene) so updateTrail can write world positions
    // directly to the geometry without causing double transforms when the trail
    // is parented to the player anchor. This prevents visual glitches.
    if (this.trail) {
      if (this.trail.parent !== this.scene) {
        this.scene.add(this.trail);
      }
    }
    if (this.board) {
      try { this.board.position.set(0, -0.35, 0); } catch(e){}
      try { this.board.visible = true; } catch(e){}
    }
    // Trail remains in scene; position here is a sensible default
    if (this.trail) {
      try { this.trail.position.set(0, -0.35, 0); } catch(e){}
      try { this.trail.visible = true; } catch(e){}
    }
  }
  
  deactivate() {
    this.active = false;
    this.duration = 0;
    if (this.board) this.board.visible = false;
    if (this.trail) this.trail.visible = false;
    
    console.log('✅ Hoverboard deactivated');
  }
  
  shouldSpawn(distance) {
    if (distance % 500 < 10) {
      return Math.random() < this.config.spawnChance;
    }
    return false;
  }
  
  dispose() {
    try {
      if (this.board) {
        // ✅ FIXED: Safely dispose with try-catch per child to prevent one bad child from hanging dispose
        this.board.traverse(child => {
          try {
            if (child.geometry && typeof child.geometry.dispose === 'function') {
              child.geometry.dispose();
            }
          } catch (e) {
            console.warn('⚠️ Error disposing geometry:', e);
          }
          try {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m?.dispose?.());
              } else if (typeof child.material.dispose === 'function') {
                child.material.dispose();
              }
            }
          } catch (e) {
            console.warn('⚠️ Error disposing material:', e);
          }
        });
        
        // Remove from scene safely
        try {
          this.scene?.remove(this.board);
        } catch (e) {
          console.warn('⚠️ Error removing board from scene:', e);
        }
      }
      
      if (this.trail) {
        try {
          if (this.trail.geometry && typeof this.trail.geometry.dispose === 'function') {
            this.trail.geometry.dispose();
          }
          if (this.trail.material && typeof this.trail.material.dispose === 'function') {
            this.trail.material.dispose();
          }
          this.scene?.remove(this.trail);
        } catch (e) {
          console.warn('⚠️ Error disposing trail:', e);
        }
      }
      
      console.log('✅ Hoverboard disposed safely');
    } catch (e) {
      console.error('❌ Error in hoverboard dispose:', e);
    }
  }
}

/**
 * ⚡ LIGHTNING DASH SYSTEM - Complete
 */
export class LightningDashSystem {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants;
    
    this.active = false;
    this.cooldown = 0;
    this.dashTime = 0;
    this.level = 1;
    
    this.config = {
      baseCooldown: 20000,
      distance: 50,
      invincibilityDuration: 1000,
      visualDuration: 300
    };
    
    this.particles = null;
    this.flashLight = null;
    this.shockwave = null;
    this.pulseTimer = 0;
    this.createLightningParticles();
    this.createFlashLight();
    this.createShockwave();
    
    console.log('✅ Lightning Dash System initialized');
  }
  
  createLightningParticles() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      const t = Math.random();
      colors[i * 3] = 0.6 + t * 0.4;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 1.0;
      
      sizes[i] = Math.random() * 0.5 + 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.visible = false;
    this.scene.add(this.particles);
    
    console.log('✅ Lightning particles created');
  }

  createFlashLight() {
    // brief bright point light to emphasize the dash
    this.flashLight = new THREE.PointLight(0x99ccff, 0, 8);
    this.flashLight.visible = false;
    this.scene.add(this.flashLight);
  }

  createShockwave() {
    // expanding ring/shockwave to give impact feedback
    const geo = new THREE.RingGeometry(0.2, 0.6, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shockwave = new THREE.Mesh(geo, mat);
    this.shockwave.rotation.x = -Math.PI / 2;
    this.shockwave.scale.set(0.01, 0.01, 0.01);
    this.shockwave.visible = false;
    this.scene.add(this.shockwave);
  }
  
  getAnimationName() {
    return 'Anim_Boost';
  }
  
  activate(playerPosition, obstacles = []) {
    if (this.cooldown > 0) {
      console.warn('⚡ Lightning on cooldown: ' + (this.cooldown / 1000).toFixed(1) + 's');
      return false;
    }
    if (this.active) {
      console.warn('⚡ Lightning already active');
      return false;
    }
    
    this.active = true;
    this.dashTime = this.config.visualDuration;
    this.particles.visible = true;
    this.pulseTimer = this.config.visualDuration;

    // position visual anchors
    if (this.particles) {
      this.particles.position.copy(playerPosition);
    }
    if (this.flashLight) {
      this.flashLight.position.copy(playerPosition);
      this.flashLight.intensity = 4.5;
      this.flashLight.visible = true;
    }
    if (this.shockwave) {
      this.shockwave.position.set(playerPosition.x, playerPosition.y - 0.5, playerPosition.z);
      this.shockwave.scale.set(0.01, 0.01, 0.01);
      this.shockwave.material.opacity = 0.75;
      this.shockwave.visible = true;
    }
    
    let dashTarget = playerPosition.z - this.config.distance;
    
    if (obstacles && obstacles.length > 0) {
      const nearbyObstacles = obstacles.filter(obs => 
        obs.position && 
        obs.position.z < playerPosition.z && 
        obs.position.z > dashTarget - 5
      );
      
      if (nearbyObstacles.length > 0) {
        const nearest = nearbyObstacles.reduce((a, b) => 
          a.position.z > b.position.z ? a : b
        );
        dashTarget = nearest.position.z + 3;
        console.log('⚡ Lightning: teleported past obstacle');
      }
    }
    
    console.log('⚡ Lightning dash activated - Distance: 50m, Invincibility: 1000ms');
    
    return {
      success: true,
      targetZ: dashTarget,
      invincibilityDuration: this.config.invincibilityDuration,
      invincible: true,
      animationName: 'Anim_Boost'
    };
  }
  
  update(deltaTime, playerPosition) {
    const dt = deltaTime * 1000;
    
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }
    
    if (!this.active) {
      this.particles.visible = false;
      return { active: false };
    }
    
    this.dashTime -= dt;
    if (this.dashTime <= 0) {
      this.deactivate();
      return { active: false, justEnded: true };
    }
    
    if (playerPosition) {
      this.updateLightningParticles(playerPosition, deltaTime);
      // Update flash light fade
      if (this.flashLight && this.flashLight.visible) {
        // fade out quickly over visualDuration
        const t = Math.max(0, this.dashTime / this.config.visualDuration);
        this.flashLight.intensity = 4.5 * t;
        if (t < 0.05) this.flashLight.visible = false;
      }

      // Shockwave expansion
      if (this.shockwave && this.shockwave.visible) {
        const elapsed = (this.config.visualDuration - this.dashTime) / this.config.visualDuration;
        const scale = 1 + elapsed * 6.0; // expand ring
        this.shockwave.scale.set(scale, scale, scale);
        this.shockwave.material.opacity = Math.max(0, 0.75 * (1 - elapsed));
        if (elapsed >= 1) this.shockwave.visible = false;
      }
    }
    
    return {
      active: true,
      dashTime: this.dashTime,
      opacity: this.dashTime / this.config.visualDuration,
      animationName: 'Anim_Boost'
    };
  }
  
  updateLightningParticles(playerPosition, deltaTime) {
    if (!this.particles) return;
    
    this.particles.position.copy(playerPosition);
    
    const positions = this.particles.geometry.attributes.position.array;
    const particleCount = positions.length / 3;
    
    // More deterministic, bolt-like spread with trailing effect
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Create streaks along X/Z with varied Y for verticality
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const baseRadius = 0.5 + (i % 10) * 0.2;
      const speed = 30 + (i % 7) * 10;

      positions[i3] = Math.cos(angle) * baseRadius * (1 + Math.random() * 0.6) * (1 - this.dashTime / this.config.visualDuration);
      positions[i3 + 1] = (Math.random() - 0.5) * 2;
      positions[i3 + 2] = Math.sin(angle) * (baseRadius * 0.5) * (1 - this.dashTime / this.config.visualDuration);
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    const fadeAmount = Math.max(0, this.dashTime / this.config.visualDuration);
    this.particles.material.opacity = fadeAmount;
  }
  
  deactivate() {
    this.active = false;
    this.dashTime = 0;
    this.cooldown = this.config.baseCooldown - (this.level - 1) * 1000;
    if (this.particles) this.particles.visible = false;
    if (this.particles && this.particles.material) this.particles.material.opacity = 1.0;
    if (this.flashLight) this.flashLight.visible = false;
    if (this.shockwave) this.shockwave.visible = false;
    
    console.log('✅ Lightning deactivated - Cooldown: ' + (this.cooldown / 1000).toFixed(1) + 's');
  }
  
  upgrade() {
    if (this.level < 10) {
      this.level++;
      console.log('⬆️ Lightning upgraded to level ' + this.level);
      return true;
    }
    return false;
  }
  
  getCooldownPercent() {
    if (this.cooldown === 0) return 0;
    return this.cooldown / this.config.baseCooldown;
  }
  
  isReady() {
    return this.cooldown === 0 && !this.active;
  }
  
  dispose() {
    if (this.particles) {
      try {
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.scene.remove(this.particles);
      } catch (e) {
        console.warn('⚠️ Error disposing lightning particles', e);
      }
    }
    if (this.flashLight) {
      try { this.scene.remove(this.flashLight); } catch(e) {}
      this.flashLight = null;
    }
    if (this.shockwave) {
      try { this.shockwave.geometry.dispose(); this.shockwave.material.dispose(); this.scene.remove(this.shockwave); } catch(e) {}
      this.shockwave = null;
    }
    console.log('✅ Lightning disposed');
  }
}

/**
 * ⚡ SHIELD ABILITY SYSTEM
 * Creates a protective energy shield that blocks one collision
 */
export class ShieldAbilitySystem {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants;
    
    this.active = false;
    this.cooldown = 0;
    this.level = 1;
    
    this.config = {
      baseCooldown: 15000,
      duration: 5000,
      radius: 1.5
    };
    
    this.shieldMesh = null;
    this.shieldLight = null;
    this.pulseTimer = 0;
    this.createShield();
    
    console.log('✅ Shield Ability System initialized');
  }
  
  createShield() {
    // Outer shell
    const geometry = new THREE.SphereGeometry(this.config.radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      emissive: 0x00cc66,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.shieldMesh = new THREE.Mesh(geometry, material);
    this.shieldMesh.visible = false;
    this.scene.add(this.shieldMesh);
    
    // Shield glow light
    this.shieldLight = new THREE.PointLight(0x00ff88, 0, 8);
    this.shieldLight.position.copy(this.shieldMesh.position);
    this.shieldLight.visible = false;
    this.scene.add(this.shieldLight);
    
    console.log('✅ Shield meshes created');
  }
  
  activate(playerPosition) {
    if (this.active || this.cooldown > 0) {
      return { success: false, reason: 'on_cooldown' };
    }
    
    this.active = true;
    this.shieldMesh.position.copy(playerPosition);
    this.shieldMesh.visible = true;
    this.shieldLight.position.copy(playerPosition);
    this.shieldLight.visible = true;
    this.shieldLight.intensity = 2.0;
    this.pulseTimer = 0;
    
    setTimeout(() => {
      this.deactivate();
    }, this.config.duration);
    
    console.log('🛡️ Shield activated');
    return { success: true, shielded: true, duration: this.config.duration, animationName: 'Anim_Shield' };
  }
  
  update(playerPosition, deltaTime) {
    if (!this.active) {
      if (this.cooldown > 0) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime * 1000);
      }
      return { active: false, cooldownPercent: 0 };
    }
    
    // Update position
    this.shieldMesh.position.copy(playerPosition);
    this.shieldLight.position.copy(playerPosition);
    
    // Pulsing effect
    this.pulseTimer += deltaTime;
    const pulse = Math.sin(this.pulseTimer * 6) * 0.5 + 1.5;
    this.shieldMesh.scale.set(pulse, pulse, pulse);
    this.shieldLight.intensity = 1.5 + Math.cos(this.pulseTimer * 5) * 0.5;
    
    return { active: true, shielded: true };
  }
  
  deactivate() {
    this.active = false;
    this.shieldMesh.visible = false;
    this.shieldLight.visible = false;
    this.cooldown = this.config.baseCooldown - (this.level - 1) * 2000;
    
    console.log('🛡️ Shield deactivated');
  }
  
  upgrade() {
    if (this.level < 5) {
      this.level++;
      this.config.baseCooldown = Math.max(5000, this.config.baseCooldown - 2000);
      this.config.duration += 1000;
      console.log('🛡️ Shield upgraded to level', this.level);
      return true;
    }
    return false;
  }
  
  getCooldownPercent() {
    const totalCooldown = this.config.baseCooldown - (this.level - 1) * 2000;
    return (1 - this.cooldown / totalCooldown) * 100;
  }
  
  isReady() {
    return this.cooldown <= 0 && !this.active;
  }
  
  dispose() {
    try {
      if (this.shieldMesh) {
        this.shieldMesh.geometry.dispose();
        this.shieldMesh.material.dispose();
        this.scene.remove(this.shieldMesh);
      }
    } catch(e) {}
    try {
      if (this.shieldLight) {
        this.scene.remove(this.shieldLight);
      }
    } catch(e) {}
  }
}

/**
 * ⚡ SPEED BOOST ABILITY SYSTEM
 * Grants temporary speed increase and trail effects
 */
export class SpeedBoostAbilitySystem {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants;
    
    this.active = false;
    this.cooldown = 0;
    this.duration = 0;
    this.level = 1;
    
    this.config = {
      baseCooldown: 18000,
      duration: 4000,
      speedMultiplier: 1.8,
      maxCharges: 2
    };
    
    this.charges = this.config.maxCharges;
    this.boostLight = null;
    this.trailParticles = null;
    this.createBoostEffects();
    
    console.log('✅ Speed Boost System initialized');
  }
  
  createBoostEffects() {
    // Boost aura light
    this.boostLight = new THREE.PointLight(0xff6600, 0, 10);
    this.boostLight.visible = false;
    this.scene.add(this.boostLight);
    
    // Trail particles
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = 1.0;      // R - orange
      colors[i * 3 + 1] = 0.4;  // G
      colors[i * 3 + 2] = 0.0;  // B
      
      sizes[i] = Math.random() * 0.3 + 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.trailParticles = new THREE.Points(geometry, material);
    this.trailParticles.visible = false;
    this.scene.add(this.trailParticles);
    
    console.log('✅ Boost effects created');
  }
  
  activate(playerPosition) {
    if (this.charges <= 0) {
      return { success: false, reason: 'no_charges' };
    }
    
    this.active = true;
    this.duration = this.config.duration;
    this.charges--;
    
    this.boostLight.position.copy(playerPosition);
    this.boostLight.visible = true;
    this.boostLight.intensity = 3.0;
    
    this.trailParticles.visible = true;
    this.trailParticles.position.copy(playerPosition);
    
    setTimeout(() => {
      this.deactivate();
    }, this.config.duration);
    
    console.log('⚡ Speed Boost activated - Charges left:', this.charges);
    return { success: true, boosted: true, multiplier: this.config.speedMultiplier, duration: this.config.duration, animationName: 'Anim_Sprint' };
  }
  
  update(playerPosition, deltaTime) {
    if (!this.active) {
      if (this.charges < this.config.maxCharges) {
        this.cooldown -= deltaTime * 1000;
        if (this.cooldown <= 0) {
          this.charges++;
          this.cooldown = this.config.baseCooldown;
          console.log('⚡ Boost charge recovered - Charges:', this.charges);
        }
      }
      return { active: false, boosted: false, charges: this.charges };
    }
    
    // Update duration
    this.duration -= deltaTime * 1000;
    if (this.duration <= 0) {
      this.deactivate();
    }
    
    // Update effects
    this.boostLight.position.copy(playerPosition);
    this.boostLight.intensity = 2.0 + Math.sin(Date.now() * 0.01) * 1.0;
    
    // Update trail particles
    const positions = this.trailParticles.geometry.attributes.position.array;
    for (let i = 0; i < 10; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1;
      positions[i * 3 + 2] = playerPosition.z + (Math.random() * 2 - 1);
    }
    this.trailParticles.geometry.attributes.position.needsUpdate = true;
    
    return { active: true, boosted: true, durationPercent: (this.duration / this.config.duration) * 100 };
  }
  
  deactivate() {
    this.active = false;
    this.duration = 0;
    this.boostLight.visible = false;
    this.trailParticles.visible = false;
    
    console.log('⚡ Speed Boost deactivated - Recharging...');
  }
  
  upgrade() {
    if (this.level < 5) {
      this.level++;
      this.config.speedMultiplier += 0.2;
      this.config.maxCharges = Math.min(5, this.config.maxCharges + 1);
      this.charges = this.config.maxCharges;
      console.log('⚡ Speed Boost upgraded to level', this.level);
      return true;
    }
    return false;
  }
  
  getChargesPercent() {
    return (this.charges / this.config.maxCharges) * 100;
  }
  
  isReady() {
    return this.charges > 0 && !this.active;
  }
  
  dispose() {
    try {
      if (this.boostLight) this.scene.remove(this.boostLight);
    } catch(e) {}
    try {
      if (this.trailParticles) {
        this.trailParticles.geometry.dispose();
        this.trailParticles.material.dispose();
        this.scene.remove(this.trailParticles);
      }
    } catch(e) {}
  }
}

/**
 * ⚡ TIME SLOW ABILITY SYSTEM
 * Slows down obstacles and time for a duration
 */
export class TimeSlowAbilitySystem {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants;
    
    this.active = false;
    this.cooldown = 0;
    this.duration = 0;
    this.level = 1;
    
    this.config = {
      baseCooldown: 25000,
      duration: 3000,
      slowFactor: 0.4
    };
    
    this.slowLight = null;
    this.slowParticles = null;
    this.createSlowEffects();
    
    console.log('✅ Time Slow System initialized');
  }
  
  createSlowEffects() {
    // Slow aura light (blue)
    this.slowLight = new THREE.PointLight(0x0099ff, 0, 12);
    this.slowLight.visible = false;
    this.scene.add(this.slowLight);
    
    // Slow particles (ice/time effect)
    const particleCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      colors[i * 3] = 0.3;      // R
      colors[i * 3 + 1] = 0.8;  // G - cyan
      colors[i * 3 + 2] = 1.0;  // B
      
      sizes[i] = Math.random() * 0.4 + 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.slowParticles = new THREE.Points(geometry, material);
    this.slowParticles.visible = false;
    this.scene.add(this.slowParticles);
    
    console.log('✅ Time Slow effects created');
  }
  
  activate(playerPosition) {
    if (this.active || this.cooldown > 0) {
      return { success: false, reason: 'on_cooldown' };
    }
    
    this.active = true;
    this.duration = this.config.duration;
    
    this.slowLight.position.copy(playerPosition);
    this.slowLight.visible = true;
    this.slowLight.intensity = 2.5;
    
    this.slowParticles.position.copy(playerPosition);
    this.slowParticles.visible = true;
    
    setTimeout(() => {
      this.deactivate();
    }, this.config.duration);
    
    console.log('⏱️ Time Slow activated');
    return { success: true, timeSlow: true, slowFactor: this.config.slowFactor, duration: this.config.duration, animationName: 'Anim_TimeFreeze' };
  }
  
  update(playerPosition, deltaTime) {
    if (!this.active) {
      if (this.cooldown > 0) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime * 1000);
      }
      return { active: false, timeSlow: false, cooldownPercent: 0 };
    }
    
    // Update duration
    this.duration -= deltaTime * 1000;
    if (this.duration <= 0) {
      this.deactivate();
    }
    
    // Update effects
    this.slowLight.position.copy(playerPosition);
    this.slowLight.intensity = 2.0 + Math.cos(Date.now() * 0.005) * 0.5;
    
    // Rotate slow particles
    this.slowParticles.position.copy(playerPosition);
    this.slowParticles.rotation.z += deltaTime * 0.5;
    
    return { active: true, timeSlow: true, durationPercent: (this.duration / this.config.duration) * 100 };
  }
  
  deactivate() {
    this.active = false;
    this.duration = 0;
    this.slowLight.visible = false;
    this.slowParticles.visible = false;
    this.cooldown = this.config.baseCooldown - (this.level - 1) * 3000;
    
    console.log('⏱️ Time Slow deactivated - Recharging...');
  }
  
  upgrade() {
    if (this.level < 5) {
      this.level++;
      this.config.slowFactor = Math.max(0.1, this.config.slowFactor - 0.05);
      this.config.duration += 800;
      console.log('⏱️ Time Slow upgraded to level', this.level);
      return true;
    }
    return false;
  }
  
  getCooldownPercent() {
    const totalCooldown = this.config.baseCooldown - (this.level - 1) * 3000;
    return (1 - this.cooldown / totalCooldown) * 100;
  }
  
  isReady() {
    return this.cooldown <= 0 && !this.active;
  }
  
  dispose() {
    try {
      if (this.slowLight) this.scene.remove(this.slowLight);
    } catch(e) {}
    try {
      if (this.slowParticles) {
        this.slowParticles.geometry.dispose();
        this.slowParticles.material.dispose();
        this.scene.remove(this.slowParticles);
      }
    } catch(e) {}
  }
}
