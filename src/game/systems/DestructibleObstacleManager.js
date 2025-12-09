/**
 * ✅ PHASE 5.5: Destructible Obstacles System
 * Some obstacles can be destroyed when player has shield
 * Effect: Explosion particles, bonus points
 * Strategy: Encourages aggressive play with shield
 */

export class DestructibleObstacleManager {
  constructor(constants) {
    this.constants = constants;
    this.destructibleTypes = ['box', 'spike', 'barrier']; // Simple obstacles are destructible
    this.destructionBonus = 50; // Points for destroying an obstacle
    this.destructionCount = 0; // Track consecutive destructions
    this.lastDestructionTime = 0;
    this.destructionComboWindow = 2.0; // 2 seconds to chain destructions
  }

  /**
   * Check if an obstacle type is destructible
   */
  isDestructible(obstacleType) {
    return this.destructibleTypes.includes(obstacleType);
  }

  /**
   * Handle obstacle destruction
   * Returns true if obstacle was destroyed, false if normal collision
   */
  attemptDestruction(obstacle, hasShield, particleSystem, playSfx, sfxOn) {
    if (!hasShield) return false;
    
    const obstacleType = obstacle.type || obstacle.userData?.type;
    if (!this.isDestructible(obstacleType)) return false;

    const currentTime = performance.now() / 1000;
    
    // Check for destruction combo
    if (currentTime - this.lastDestructionTime < this.destructionComboWindow) {
      this.destructionCount++;
    } else {
      this.destructionCount = 1;
    }
    this.lastDestructionTime = currentTime;

    // Destroy the obstacle with enhanced particles!
    if (particleSystem) {
      // Main explosion
      particleSystem.spawn(
        'explosion',
        obstacle.position || obstacle,
        { r: 1, g: 0.5, b: 0 }, // Orange explosion
        'large',
        25 + (this.destructionCount * 5) // More particles for combos!
      );
      
      // Secondary sparkle effect
      setTimeout(() => {
        if (particleSystem) {
          particleSystem.spawn(
            'coin',
            obstacle.position || obstacle,
            { r: 1, g: 0.8, b: 0 }, // Gold sparkles
            'medium',
            10
          );
        }
      }, 100);
    }

    // Play destruction sound with pitch variation based on combo
    if (playSfx && sfxOn) {
      playSfx('crash', sfxOn); 
    }

    const bonusMultiplier = Math.min(this.destructionCount, 5); // Cap at 5x
    console.log(`💥 Destroyed ${obstacleType}! Chain: ${this.destructionCount}x (+${this.destructionBonus * bonusMultiplier} points)`);
    
    return true;
  }

  /**
   * Get the bonus points for destroying an obstacle (includes combo multiplier)
   */
  getDestructionBonus() {
    const bonusMultiplier = Math.min(this.destructionCount, 5);
    return this.destructionBonus * bonusMultiplier;
  }

  /**
   * Get current destruction combo count
   */
  getDestructionCombo() {
    const currentTime = performance.now() / 1000;
    if (currentTime - this.lastDestructionTime > this.destructionComboWindow) {
      this.destructionCount = 0;
    }
    return this.destructionCount;
  }

  /**
   * Check if player should take damage (only for non-destructible obstacles)
   */
  shouldTakeDamage(obstacleType, hasShield) {
    if (!hasShield) return true; // No shield = always take damage
    return !this.isDestructible(obstacleType); // Shield + destructible = no damage
  }

  /**
   * Reset destruction combo
   */
  reset() {
    this.destructionCount = 0;
    this.lastDestructionTime = 0;
  }
}
