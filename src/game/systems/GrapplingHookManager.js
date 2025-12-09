import * as THREE from 'three';
import { playSfx } from '../../utils/sound.js';

export class GrapplingHookManager {
  constructor(constants, scene, characterStatsManager = null) {
    this.constants = constants;
    this.scene = scene;
    this.characterStatsManager = characterStatsManager;
    this.sfxEnabled = true;
    this.reset();
    
    this.grappleTube = null; 
    this.grapplePoint = null;
    this.targetingReticle = null;
    this.innerReticle = null;
    this.targetBeam = null;
    this.scanRing = null;
    this.createGrappleVisuals();
    
    this.isTargeting = false;
    this.targetedObstacle = null;
    this.nearbyObstacles = [];
    
    // Large radius to ensure targets are found
    this.scanRadius = 120; 
  }

  reset() {
    this.isActive = false;
    this.cooldownTimer = 0;
    this.cooldownDuration = 8.0;
    if (this.characterStatsManager) {
      this.cooldownDuration = this.characterStatsManager.getModifiedGrappleCooldown(8.0);
    }
    this.grappleTimer = 0;
    this.grappleDuration = 0.6; 
    this.startPosition = null;
    this.targetPosition = null;
    this.grappleVelocity = new THREE.Vector3();
    this.isInvincible = false;
    this.invincibilityBuffer = 0.1;
    this.lastTargetLane = 1; 
  }

  createGrappleVisuals() {
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8, 1);
    tubeGeo.rotateX(-Math.PI / 2); 
    const tubeMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        emissive: 0x0088ff,
        emissiveIntensity: 2.0,
        roughness: 0.2,
        metalness: 0.8
    });
    this.grappleTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.grappleTube.visible = false;
    this.grappleTube.castShadow = true;
    this.scene.add(this.grappleTube);
    
    this.grapplePoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16), 
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0xffffff, emissiveIntensity: 3 })
    );
    this.grapplePoint.visible = false;
    this.scene.add(this.grapplePoint);
    
    const reticleGeometry = new THREE.RingGeometry(1.2, 1.4, 32);
    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    
    this.targetingReticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this.targetingReticle.visible = false;
    this.targetingReticle.rotation.x = -Math.PI / 2;
    this.targetingReticle.renderOrder = 999;
    
    const innerGeo = new THREE.RingGeometry(0.4, 0.6, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    this.innerReticle = new THREE.Mesh(innerGeo, innerMat);
    this.targetingReticle.add(this.innerReticle);

    const beamGeo = new THREE.CylinderGeometry(0.2, 0.05, 20, 8);
    beamGeo.translate(0, 10, 0); 
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    });
    this.targetBeam = new THREE.Mesh(beamGeo, beamMat);
    this.targetingReticle.add(this.targetBeam);

    this.scene.add(this.targetingReticle);
    
    this.scanRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 32), new THREE.MeshBasicMaterial({ color: 0x5b8fc7, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }));
    this.scanRing.visible = false;
    this.scanRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.scanRing);
  }

  canUseGrapple() {
    return this.cooldownTimer <= 0 && !this.isActive;
  }

  scanForTargets(playerPosition, obstacles, instancedObstacles) {
    const validTargets = [];
    const allObstacles = [];
    
    if (obstacles) allObstacles.push(...obstacles);
    if (instancedObstacles) allObstacles.push(...instancedObstacles);
    
    for (let obstacle of allObstacles) {
      if (obstacle.isObject3D && !obstacle.visible) continue;
      if (obstacle.active === false) continue;
      
      const obstaclePos = obstacle.position;
      
      // Allow slight buffer behind for parallel objects
      if (obstaclePos.z > playerPosition.z + 2.0) continue; 
      
      const distance = playerPosition.distanceTo(obstaclePos);
      if (distance < this.scanRadius) {
        validTargets.push({
          obstacle: obstacle,
          position: obstaclePos.clone(),
          distance: distance,
          zDistance: playerPosition.z - obstaclePos.z
        });
      }
    }
    return validTargets.sort((a, b) => a.distance - b.distance);
  }

  startTargeting(playerPosition, obstacles, instancedObstacles, sfxEnabled = true) {
    if (!this.canUseGrapple()) return false;
    
    this.sfxEnabled = sfxEnabled;
    this.isTargeting = true;
    this.nearbyObstacles = this.scanForTargets(playerPosition, obstacles, instancedObstacles);
    
    if (this.nearbyObstacles.length > 0) {
      this.targetedObstacle = this.nearbyObstacles[0];
      this.targetingReticle.visible = true;
      playSfx('jump', this.sfxEnabled); 
      return true;
    } else {
      this.targetedObstacle = null;
      this.targetingReticle.visible = false;
      return false;
    }
    this.scanRing.visible = true;
  }

  cycleTarget(direction, sfxEnabled = true) {
    if (!this.isTargeting || this.nearbyObstacles.length === 0) return;
    this.sfxEnabled = sfxEnabled;
    let currentIndex = this.nearbyObstacles.findIndex(t => t.obstacle === this.targetedObstacle?.obstacle);
    if (currentIndex === -1) currentIndex = 0;
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = this.nearbyObstacles.length - 1;
    if (newIndex >= this.nearbyObstacles.length) newIndex = 0;
    this.targetedObstacle = this.nearbyObstacles[newIndex];
    playSfx('coin', this.sfxEnabled); 
  }

  confirmTarget(playerPosition, sfxEnabled = true) {
    if (!this.isTargeting || !this.targetedObstacle) {
      this.cancelTargeting();
      return false;
    }
    
    if (this.targetedObstacle.position.z > playerPosition.z + 1.0) {
        this.cancelTargeting();
        return false;
    }
    
    this.sfxEnabled = sfxEnabled; 
    this.isActive = true;
    this.isInvincible = true;
    this.grappleTimer = this.grappleDuration;
    this.startPosition = playerPosition.clone();
    this.targetPosition = this.targetedObstacle.position.clone();
    
    const targetX = this.targetPosition.x;
    if (targetX < -1.5) this.lastTargetLane = 0;
    else if (targetX > 1.5) this.lastTargetLane = 2;
    else this.lastTargetLane = 1;

    const direction = this.targetPosition.clone().sub(this.startPosition);
    const distance = direction.length();
    direction.normalize();
    this.grappleVelocity = direction.multiplyScalar(distance / this.grappleDuration);
    
    this.grapplePoint.position.copy(this.targetPosition);
    this.grapplePoint.visible = true;
    this.grappleTube.visible = true;
    this.targetingReticle.visible = false;
    this.scanRing.visible = false;
    this.isTargeting = false;
    
    playSfx('powerup', this.sfxEnabled); 
    return true;
  }

  cancelTargeting() {
    this.isTargeting = false;
    this.targetedObstacle = null;
    this.nearbyObstacles = [];
    this.targetingReticle.visible = false;
    if (this.scanRing) this.scanRing.visible = false;
  }

  update(deltaTime, playerPosition, obstacles = [], instancedObstacles = [], sfxEnabled = true) {
    const time = performance.now() / 1000;
    this.sfxEnabled = sfxEnabled;
    
    if (this.cooldownTimer > 0) this.cooldownTimer -= deltaTime;
    
    if (this.invincibilityBuffer > 0) {
      this.invincibilityBuffer -= deltaTime;
      if (this.invincibilityBuffer <= 0) this.isInvincible = false;
    }
    
    if (this.isTargeting) {
      const freshTargets = this.scanForTargets(playerPosition, obstacles, instancedObstacles);
      this.nearbyObstacles = freshTargets;

      if (this.nearbyObstacles.length === 0) {
        this.targetedObstacle = null;
        this.targetingReticle.visible = false;
      } else {
        const isCurrentStillValid = this.targetedObstacle && 
           this.nearbyObstacles.some(t => t.obstacle === this.targetedObstacle.obstacle);
        if (!isCurrentStillValid) this.targetedObstacle = this.nearbyObstacles[0];
        this.targetingReticle.visible = true;
      }

      if (this.targetedObstacle) {
        this.targetingReticle.position.copy(this.targetedObstacle.position);
        this.targetingReticle.position.y += 0.5; 
        this.targetingReticle.rotation.z += deltaTime * 4.0;
        if (this.innerReticle) {
            const innerPulse = 1.0 + Math.sin(time * 15) * 0.3;
            this.innerReticle.scale.setScalar(innerPulse);
        }
        
        if (this.scanRing) {
          this.scanRing.visible = true;
          this.scanRing.position.copy(playerPosition);
          this.scanRing.position.y = 0.1;
          this.scanRing.scale.set(this.scanRadius * 2, this.scanRadius * 2, 1);
        }
      }
    }
    
    if (this.isActive) {
      this.grappleTimer -= deltaTime;
      if (this.grappleTimer <= 0) {
        this.deactivate();
      } else {
        const start = playerPosition.clone();
        start.y += 1.0; 
        const end = this.grapplePoint.position;
        
        const distance = start.distanceTo(end);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        
        this.grappleTube.position.copy(midpoint);
        this.grappleTube.lookAt(end);
        this.grappleTube.scale.set(1, 1, distance);
      }
    }
  }

  deactivate() {
    this.isActive = false;
    this.invincibilityBuffer = 0.2; 
    let baseCooldown = 8.0;
    if (this.characterStatsManager) {
      baseCooldown = this.characterStatsManager.getModifiedGrappleCooldown(8.0);
    }
    this.cooldownTimer = baseCooldown;
    this.grappleTube.visible = false;
    this.grapplePoint.visible = false;
    this.grappleVelocity.set(0, 0, 0);
    this.targetedObstacle = null;
    this.cancelTargeting();
  }

  updatePosition(deltaTime, currentPlayerPosition) {
    if (!this.isActive || !this.startPosition || !this.targetPosition) {
      return null;
    }
    const elapsed = this.grappleDuration - this.grappleTimer;
    const progress = Math.min(elapsed / this.grappleDuration, 1.0);
    
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const totalDistance = this.targetPosition.clone().sub(this.startPosition);
    const newPosition = this.startPosition.clone().add(totalDistance.multiplyScalar(ease));
    
    if (progress >= 0.95) {
      this.isActive = false;
      // ✅ FIX: Explicitly call deactivate to start cooldown
      this.deactivate();
      return this.targetPosition.clone();
    }
    return newPosition;
  }

  getGrappleData() {
    return {
      isActive: this.isActive,
      isTargeting: this.isTargeting,
      hasTarget: this.targetedObstacle !== null,
      targetCount: this.nearbyObstacles.length,
      cooldownProgress: 1 - (this.cooldownTimer / this.cooldownDuration),
      canUse: this.canUseGrapple(),
      cooldownRemaining: Math.max(0, this.cooldownTimer),
      isInvincible: this.isInvincible,
      invincibilityBuffer: this.invincibilityBuffer,
      isPlayerInvincible: this.isPlayerInvincible()
    };
  }

  getGrappleVelocity() { return this.grappleVelocity; }
  isPlayerInvincible() { return this.isInvincible || this.invincibilityBuffer > 0; }
  getLastTargetLane() { return this.lastTargetLane; }

  dispose() {
    if (this.grappleTube) { this.scene.remove(this.grappleTube); this.grappleTube.geometry.dispose(); this.grappleTube.material.dispose(); }
    if (this.grapplePoint) { this.scene.remove(this.grapplePoint); this.grapplePoint.geometry.dispose(); this.grapplePoint.material.dispose(); }
    if (this.targetingReticle) { 
        this.scene.remove(this.targetingReticle); 
        this.targetingReticle.geometry.dispose(); 
        this.targetingReticle.material.dispose();
        if (this.innerReticle) { this.innerReticle.geometry.dispose(); this.innerReticle.material.dispose(); }
        if (this.targetBeam) { this.targetBeam.geometry.dispose(); this.targetBeam.material.dispose(); }
    }
    if (this.scanRing) { this.scene.remove(this.scanRing); this.scanRing.geometry.dispose(); this.scanRing.material.dispose(); }
  }
}