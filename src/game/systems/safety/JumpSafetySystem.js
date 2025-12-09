/**
 * JumpSafetySystem.js
 * ✅ PHASE 0.2 - Critical Player Feedback Fix
 * 
 * Prevents unfair "unavoidable hits" when obstacles move under the player during jumps.
 * Implements multiple safety mechanisms to ensure fair gameplay.
 */

import * as THREE from "three";

export class JumpSafetySystem {
  constructor(constants, dangerIndicators = null) {
    this.constants = constants;
    this.dangerIndicators = dangerIndicators; // ✅ PHASE 0.7: Visual warning system
    
    // Landing invincibility
    this.invincibilityTimer = 0;
    this.invincibilityDuration = 0.5; // 500ms grace period after landing (increased from 300ms)
    
    // Slow-motion near-miss
    this.slowMoActive = false;
    this.slowMoTimer = 0;
    this.slowMoDuration = 0.8;
    this.slowMoFactor = 0.5; // 50% speed
    
    // Warning system
    this.dangerZones = [];
    this.maxDangerZones = 3;
    
    // Prediction data
    this.lastJumpTime = 0;
    this.predictedLandingZone = null;
  }
  
  /**
   * Check if player is currently invincible
   */
  isInvincible() {
    return this.invincibilityTimer > 0;
  }
  
  /**
   * Get current time scale modifier (for slow-motion)
   */
  getTimeScale() {
    return this.slowMoActive ? this.slowMoFactor : 1.0;
  }
  
  /**
   * Record a jump for prediction purposes
   * ✅ FIX #6: Called by PlayerController when jump is initiated
   */
  recordJump(playerPosition, jumpForce) {
    this.lastJumpTime = performance.now() / 1000;
    
    // Convert jump force to velocity
    const jumpVelocity = jumpForce;
    
    // Calculate landing time using: t = 2 * v / g
    const timeToLand = (2 * jumpVelocity) / this.constants.PHYSICS.GRAVITY;
    
    // Approximate horizontal speed (will be updated in main game loop)
    const horizontalSpeed = this.constants.GAME.BASE_SPEED;
    
    // Predict landing zone
    const predictedZ = playerPosition.z - (horizontalSpeed * timeToLand);
    
    this.predictedLandingZone = {
      x: playerPosition.x,
      z: predictedZ,
      radius: 2.0,
      time: this.lastJumpTime + timeToLand
    };
  }

  /**
   * Record when player lands
   * ✅ FIX #6: Called by PlayerController when landing detected
   */
  recordLanding(playerPosition) {
    this.invincibilityTimer = this.invincibilityDuration;
    this.predictedLandingZone = null;
  }

  /**
   * Called when player jumps - predicts landing zone
   */
  onJump(playerPosition, jumpVelocity, horizontalSpeed) {
    this.lastJumpTime = performance.now() / 1000;
    
    // Calculate time to land using kinematic equation: v = v0 - g*t
    // When v = 0 (apex), t_apex = v0 / g
    // Total time = 2 * t_apex (symmetrical parabola)
    const timeToLand = (2 * jumpVelocity) / this.constants.PLAYER.GRAVITY;
    
    // Predict where player will be when they land
    const landingZ = playerPosition.z - (horizontalSpeed * timeToLand);
    
    this.predictedLandingZone = {
      x: playerPosition.x,
      z: landingZ,
      radius: 2.0, // Safe zone radius
      time: this.lastJumpTime + timeToLand
    };
    
    // Clear invincibility on new jump
    this.invincibilityTimer = 0;
  }
  
  /**
   * Called when player lands - grants brief invincibility
   */
  onLanding() {
    this.invincibilityTimer = this.invincibilityDuration;
    this.predictedLandingZone = null;
  }
  
  /**
   * Check if it's safe to spawn an obstacle at the given position
   * Returns: { safe: boolean, reason: string }
   */
  isSafeToSpawn(obstaclePosition, obstacleType, playerIsJumping) {
    if (!playerIsJumping || !this.predictedLandingZone) {
      return { safe: true, reason: "player_not_jumping" };
    }
    
    const landing = this.predictedLandingZone;
    const now = performance.now() / 1000;
    
    // Check if obstacle would be in landing zone within next 2 seconds
    const futureZ = obstaclePosition.z - (this.constants.GAME.BASE_SPEED * 2.0 * 60); // Approximate position in 2s
    
    const horizontalDist = Math.abs(obstaclePosition.x - landing.x);
    const verticalDist = Math.abs(futureZ - landing.z);
    
    const isTooClose = horizontalDist < landing.radius && verticalDist < 10;
    
    if (isTooClose) {
      // Check obstacle type - moving obstacles are more dangerous
      if (obstacleType && obstacleType.includes('moving')) {
        return { safe: false, reason: "moving_obstacle_in_landing_zone" };
      }
      
      // Static obstacles are okay if player has time to see them
      const timeUntilLanding = landing.time - now;
      if (timeUntilLanding < 0.5) {
        return { safe: false, reason: "obstacle_too_close_to_landing" };
      }
    }
    
    return { safe: true, reason: "clear" };
  }
  
  /**
   * Check if obstacle is approaching landing zone and trigger slow-mo
   * ✅ DISABLED: Slow motion removed - it breaks gameplay flow
   */
  checkNearMiss(playerPosition, playerIsJumping, obstacles, instancedObstacles) {
    if (!playerIsJumping || !this.predictedLandingZone) {
      return false;
    }
    
    const landing = this.predictedLandingZone;
    let dangerDetected = false;
    
    // Check all obstacles
    const allObstacles = [
      ...obstacles.filter(o => o.active && o.visible),
      ...instancedObstacles.filter(o => o.active)
    ];
    
    for (const obstacle of allObstacles) {
      const horizontalDist = Math.abs(obstacle.position.x - landing.x);
      const verticalDist = Math.abs(obstacle.position.z - landing.z);
      
      // Obstacle is approaching landing zone
      if (horizontalDist < landing.radius + 2 && verticalDist < 8) {
        dangerDetected = true;
        
        // Add to danger zones for visual warning
        this.addDangerZone(obstacle.position.clone());
        
        // ✅ REMOVED: No more slow-motion on near miss
        // Reason: Breaks gameplay flow and isn't fun for players
        // if (!this.slowMoActive && playerPosition.y > this.constants.PLAYER.BASE_HEIGHT + 1.0) {
        //   this.activateSlowMotion();
        // }
        break;
      }
    }
    
    return dangerDetected;
  }
  
  /**
   * Activate slow-motion near-miss effect
   */
  activateSlowMotion() {
    this.slowMoActive = true;
    this.slowMoTimer = this.slowMoDuration;
  }
  
  /**
   * Add a danger zone for visual warning
   * ✅ PHASE 0.7: Now creates visual indicators on the ground
   */
  addDangerZone(position) {
    // Remove old zones if at capacity
    if (this.dangerZones.length >= this.maxDangerZones) {
      this.dangerZones.shift();
    }
    
    this.dangerZones.push({
      position: position.clone(),
      time: performance.now() / 1000,
      lifetime: 2.0 // Show for 2 seconds
    });
    
    // ✅ PHASE 0.7: Create visual indicator
    if (this.dangerIndicators) {
      this.dangerIndicators.addIndicator(position, 1.5);
    }
  }
  
  /**
   * Get active danger zones for rendering
   */
  getDangerZones() {
    return this.dangerZones;
  }
  
  /**
   * Update the safety system
   * ✅ FIX #19: Apply timeScale to all time calculations
   */
  update(deltaTime, playerPosition, playerIsJumping, timeScale = 1.0) {
    // ✅ FIX #19: Apply timeScale to delta time
    const scaledDeltaTime = deltaTime * timeScale;
    
    // Update invincibility timer
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= scaledDeltaTime;  // ✅ Apply timeScale
      if (this.invincibilityTimer < 0) {
        this.invincibilityTimer = 0;
      }
    }
    
    // Update slow-motion timer
    if (this.slowMoActive) {
      this.slowMoTimer -= scaledDeltaTime;  // ✅ Apply timeScale
      if (this.slowMoTimer <= 0) {
        this.slowMoActive = false;
        this.slowMoTimer = 0;
      }
    }
    
    // Clean up old danger zones (time doesn't scale for visual elements)
    const now = performance.now() / 1000;
    this.dangerZones = this.dangerZones.filter(zone => {
      return (now - zone.time) < zone.lifetime;
    });
    
    // Check if player landed
    if (!playerIsJumping && this.predictedLandingZone !== null) {
      this.onLanding();
    }
  }
  
  /**
   * Reset the system (called on game over/restart)
   */
  reset() {
    this.invincibilityTimer = 0;
    this.slowMoActive = false;
    this.slowMoTimer = 0;
    this.dangerZones = [];
    this.predictedLandingZone = null;
  }
  
  /**
   * Get debug info for development
   */
  getDebugInfo() {
    return {
      invincible: this.isInvincible(),
      invincibilityTimer: this.invincibilityTimer.toFixed(2),
      slowMoActive: this.slowMoActive,
      slowMoTimer: this.slowMoTimer.toFixed(2),
      dangerZones: this.dangerZones.length,
      predictedLanding: this.predictedLandingZone ? 
        `(${this.predictedLandingZone.x.toFixed(1)}, ${this.predictedLandingZone.z.toFixed(1)})` : 
        "none"
    };
  }
}
