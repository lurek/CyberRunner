/**
 * ✅ PHASE 5.4: Energy Mode Manager
 * Ultimate power fantasy - collecting 50 coins in one run activates Energy Mode
 * Effects: Glowing trail, temporary invincibility, 2x speed, motion blur, intense music
 */

import { playSfx } from "../../utils/sound.js";

export class EnergyModeManager {
  constructor(constants, scene) {
    this.constants = constants;
    this.scene = scene;
    this.reset();
  }

  reset() {
    this.isActive = false;
    this.coinsCollectedInRun = 0;
    this.energyModeTimer = 0;
    this.energyModeDuration = 5.0; // 5 seconds
    this.activationThreshold = 50;
    this.hasTriggered = false;
  }

  // Call this when a coin is collected
  onCoinCollect() {
    if (!this.isActive) {
      this.coinsCollectedInRun++;
      
      // Check if threshold reached
      if (this.coinsCollectedInRun >= this.activationThreshold && !this.hasTriggered) {
        this.activate();
      }
    }
  }

  // Call this when player takes damage
  onDamage() {
    // Reset coin counter if not in energy mode
    if (!this.isActive) {
      this.coinsCollectedInRun = 0;
    }
  }

  activate() {
    this.isActive = true;
    this.hasTriggered = true;
    this.energyModeTimer = this.energyModeDuration;
    playSfx('powerup', true); // Play activation sound
    
    console.log('⚡ ENERGY MODE ACTIVATED!');
  }

  update(deltaTime) {
    if (this.isActive) {
      this.energyModeTimer -= deltaTime;
      
      if (this.energyModeTimer <= 0) {
        this.deactivate();
      }
    }
  }

  deactivate() {
    this.isActive = false;
    console.log('⚡ Energy Mode ended');
  }

  // Get effects data for rendering systems
  getEffectsData() {
    return {
      isActive: this.isActive,
      progress: this.isActive ? (this.energyModeTimer / this.energyModeDuration) : 0,
      coinsToActivation: Math.max(0, this.activationThreshold - this.coinsCollectedInRun),
      coinsCollected: this.coinsCollectedInRun,
      timeRemaining: this.energyModeTimer
    };
  }

  // Check if player should be invincible
  isInvincible() {
    return this.isActive;
  }

  // Get speed multiplier
  getSpeedMultiplier() {
    return this.isActive ? 2.0 : 1.0;
  }

  // Get visual intensity (for screen effects)
  getVisualIntensity() {
    if (!this.isActive) return 0;
    
    // Pulse effect - stronger at start and end
    const progress = this.energyModeTimer / this.energyModeDuration;
    const pulse = 0.5 + Math.sin(this.energyModeTimer * 10) * 0.5;
    return 0.5 + pulse * 0.5;
  }
}
