/**
 * AbilityManager.js
 * ✅ HOBBY PROJECT - Centralized Ability Control
 * 
 * Manages four unique abilities: Lightning Dash, Shield, Speed Boost, Time Slow
 * Provides unified interface for ability activation, cooldown tracking, and upgrades
 */

import {
  LightningDashSystem,
  ShieldAbilitySystem,
  SpeedBoostAbilitySystem,
  TimeSlowAbilitySystem
} from './UniqueFeatures.jsx';

export class AbilityManager {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants;
    
    // Initialize all ability systems
    this.abilities = {
      lightning: new LightningDashSystem(scene, constants),
      shield: new ShieldAbilitySystem(scene, constants),
      speedBoost: new SpeedBoostAbilitySystem(scene, constants),
      timeSlow: new TimeSlowAbilitySystem(scene, constants)
    };
    
    // Track active effects
    this.activeEffects = new Set();
    this.lastActivationTime = {};
    
    // Invincibility timer (from shield)
    this.invincibilityTimer = 0;
    
    // Stats tracking
    this.stats = {
      lightningUses: 0,
      shieldUses: 0,
      speedBoostUses: 0,
      timeSlowUses: 0,
      totalAbilityDistance: 0
    };
    
    console.log('✅ AbilityManager initialized with 4 abilities');
  }
  
  /**
   * Activate an ability by name
   */
  activate(abilityName, playerPosition) {
    const ability = this.abilities[abilityName];
    if (!ability) {
      console.warn(`⚠️ Unknown ability: ${abilityName}`);
      return { success: false };
    }
    
    const result = ability.activate(playerPosition);
    if (result.success) {
      this.activeEffects.add(abilityName);
      this.lastActivationTime[abilityName] = Date.now();
      
      // Track stats
      if (abilityName === 'lightning') this.stats.lightningUses++;
      else if (abilityName === 'shield') this.stats.shieldUses++;
      else if (abilityName === 'speedBoost') this.stats.speedBoostUses++;
      else if (abilityName === 'timeSlow') this.stats.timeSlowUses++;
      
      console.log(`✅ ${abilityName} activated`);
    }
    
    return result;
  }
  
  /**
   * Legacy method for lightning dash activation
   */
  activateLightningDash(playerPosition) {
    const result = this.activate('lightning', playerPosition);
    if (result.success) {
      this.invincibilityTimer = result.invincibilityDuration || 1000;
    }
    return result;
  }
  
  /**
   * Legacy methods for removed abilities
   */
  activateJetpack(playerPosition) {
    return { success: false, reason: 'removed' };
  }
  
  activateHoverboard(playerPosition) {
    return { success: false, reason: 'removed' };
  }
  
  /**
   * Update all abilities
   */
  update(deltaTime, playerPosition, playerVelocity, currentLane, currentSpeed) {
    const updates = {
      lightning: null,
      shield: null,
      speedBoost: null,
      timeSlow: null,
      invincible: false,
      speedMultiplier: this.getSpeedMultiplier(),
      slowFactor: this.getSlowFactor(),
      shielded: this.isShielded()
    };
    
    // Update invincibility timer
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime * 1000;
    }
    updates.invincible = this.invincibilityTimer > 0 || this.isShielded();
    
    // Update all abilities
    for (const [name, ability] of Object.entries(this.abilities)) {
      const state = ability.update(playerPosition, deltaTime);
      updates[name] = state;
      
      // Track which effects are currently active
      if (state.active === false && this.activeEffects.has(name)) {
        this.activeEffects.delete(name);
      }
    }
    
    return updates;
  }
  
  /**
   * Get ability by name
   */
  getAbility(abilityName) {
    return this.abilities[abilityName];
  }
  
  /**
   * Get all ability states for UI
   */
  getAbilityStates() {
    return {
      lightning: {
        active: this.abilities.lightning.active,
        ready: this.abilities.lightning.isReady(),
        cooldownPercent: this.abilities.lightning.getCooldownPercent(),
        level: this.abilities.lightning.level
      },
      shield: {
        active: this.abilities.shield.active,
        ready: this.abilities.shield.isReady(),
        cooldownPercent: this.abilities.shield.getCooldownPercent(),
        level: this.abilities.shield.level
      },
      speedBoost: {
        active: this.abilities.speedBoost.active,
        ready: this.abilities.speedBoost.isReady(),
        chargesPercent: this.abilities.speedBoost.getChargesPercent(),
        charges: this.abilities.speedBoost.charges,
        level: this.abilities.speedBoost.level
      },
      timeSlow: {
        active: this.abilities.timeSlow.active,
        ready: this.abilities.timeSlow.isReady(),
        cooldownPercent: this.abilities.timeSlow.getCooldownPercent(),
        level: this.abilities.timeSlow.level
      }
    };
  }
  
  /**
   * Get specific ability state
   */
  getAbilityState(abilityName) {
    const ability = this.abilities[abilityName];
    if (!ability) return null;
    
    return {
      ready: ability.isReady(),
      active: ability.active,
      cooldown: ability.cooldown || 0,
      cooldownPercent: ability.getCooldownPercent ? ability.getCooldownPercent() : 0,
      level: ability.level,
      charges: ability.charges || 0,
      config: ability.config
    };
  }
  
  /**
   * Upgrade ability
   */
  upgradeAbility(abilityName) {
    const ability = this.abilities[abilityName];
    if (!ability) return false;
    
    return ability.upgrade();
  }
  
  /**
   * Check which effects are currently active
   */
  getActiveEffects() {
    return Array.from(this.activeEffects);
  }
  
  /**
   * Check if a specific effect is active
   */
  isEffectActive(effectName) {
    return this.activeEffects.has(effectName);
  }
  
  /**
   * Get combined slow factor from Time Slow ability if active
   */
  getSlowFactor() {
    const timeSlow = this.abilities.timeSlow;
    if (timeSlow && timeSlow.active) {
      return timeSlow.config.slowFactor;
    }
    return 1.0;
  }
  
  /**
   * Get speed multiplier from Speed Boost ability if active
   */
  getSpeedMultiplier() {
    const speedBoost = this.abilities.speedBoost;
    if (speedBoost && speedBoost.active) {
      return speedBoost.config.speedMultiplier;
    }
    return 1.0;
  }
  
  /**
   * Check if player is shielded
   */
  isShielded() {
    return this.abilities.shield.active;
  }
  
  /**
   * Deactivate shield (e.g., when it blocks a collision)
   */
  deactivateShield() {
    const shield = this.abilities.shield;
    if (shield && shield.active) {
      shield.active = false;
      if (shield.deactivate) shield.deactivate();
      console.log("🛡️ Shield ability deactivated after blocking collision");
    }
  }
  
  /**
   * Is player currently immune to obstacles?
   */
  isPlayerInvincible() {
    return this.invincibilityTimer > 0 || this.abilities.shield.active || this.abilities.lightning.active;
  }
  
  /**
   * Get stats for analytics
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Reset all abilities (on game over/restart)
   */
  reset() {
    for (const ability of Object.values(this.abilities)) {
      if (ability.deactivate) ability.deactivate();
    }
    this.activeEffects.clear();
    this.invincibilityTimer = 0;
  }
  
  /**
   * Cleanup
   */
  dispose() {
    for (const ability of Object.values(this.abilities)) {
      ability.dispose();
    }
    this.activeEffects.clear();
    console.log('✅ AbilityManager disposed');
  }
}
