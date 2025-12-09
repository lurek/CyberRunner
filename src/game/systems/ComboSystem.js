/**
 * Combo System Manager
 * Tracks player streaks and multipliers for skilled play
 */

export class ComboSystem {
  constructor(constants) {
    this.constants = constants;
    this.reset();
  }

  reset() {
    this.combo = 0;
    this.maxCombo = 0;
    this.coinStreak = 0;
    this.nearMissStreak = 0;
    this.perfectSectionBonus = 0;
    this.lastCoinTime = 0;
    this.lastNearMissTime = 0;
    this.lastEventTime = 0; // ✅ FIX 3: Track last event for timeout
    this.comboMultiplier = 1.0;
    this.sectionDistance = 0;
    this.hitInSection = false;
  }

  // Called when player collects a coin
  onCoinCollect(currentTime) {
    const timeSinceLastCoin = currentTime - this.lastCoinTime;
    
    // If collected within combo window, increase streak
    if (timeSinceLastCoin < 3.0) {  // 3 second window
      this.coinStreak++;
      this.combo++;
    } else {
      // Reset streak if too slow
      this.coinStreak = 1;
      this.combo = 1;
    }
    
    this.lastCoinTime = currentTime;
    this.lastEventTime = currentTime; // ✅ FIX 3: Update last event time
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    
    // Update multiplier based on streak
    this.updateMultiplier();
    
    return {
      combo: this.combo,
      multiplier: this.comboMultiplier,
      streak: this.coinStreak
    };
  }

  // Called when player has a near miss with obstacle
  onNearMiss(currentTime, distance) {
    // Only count if very close (under 1.5 units)
    if (distance < 1.5) {
      this.nearMissStreak++;
      this.combo += 2;  // Near misses worth more
      this.lastNearMissTime = currentTime;
      this.lastEventTime = currentTime; // ✅ FIX 3: Update last event time
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.updateMultiplier();
      
      return {
        combo: this.combo,
        multiplier: this.comboMultiplier,
        nearMissStreak: this.nearMissStreak,
        bonus: 20  // Bonus points for near miss
      };
    }
    return null;
  }

  // Called when player takes damage
  onHit() {
    const lostCombo = this.combo;
    this.combo = 0;
    this.coinStreak = 0;
    this.nearMissStreak = 0;
    this.comboMultiplier = 1.0;
    this.hitInSection = true;
    
    return { lostCombo };
  }

  // ✅ FIX 3: Renamed from updateSection and added timeout logic
  update(currentTime, deltaDistance) {
    // Check for combo timeout
    if (this.combo > 0 && (currentTime - this.lastEventTime) > this.constants.COMBO.TIMEOUT) {
      this.combo = 0;
      this.coinStreak = 0;
      this.nearMissStreak = 0;
      this.comboMultiplier = 1.0;
    }
    
    // Called periodically to update section tracking
    this.sectionDistance += deltaDistance;
    
    // Every 500 units is a section
    if (this.sectionDistance >= 500) {
      const bonus = this.hitInSection ? 0 : this.calculatePerfectSectionBonus();
      this.sectionDistance = 0;
      this.hitInSection = false;
      this.perfectSectionBonus += bonus;
      
      if (bonus > 0) {
        return {
          perfectSection: true,
          bonus: bonus
        };
      }
    }
    
    return null;
  }

  // Calculate multiplier based on current combo
  updateMultiplier() {
    // Base: 1x, increases by 0.1 per 5 combo
    this.comboMultiplier = 1.0 + Math.floor(this.combo / 5) * 0.1;
    // Cap at 3x
    this.comboMultiplier = Math.min(this.comboMultiplier, 3.0);
  }

  // Calculate bonus for perfect section (no damage taken)
  calculatePerfectSectionBonus() {
    return 500 + (this.combo * 10);
  }

  // Get current combo state for UI
  getComboState(currentTime) { // ✅ FIX 3: Accept current time
    return {
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: this.comboMultiplier,
      coinStreak: this.coinStreak,
      nearMissStreak: this.nearMissStreak,
      perfectSectionBonus: this.perfectSectionBonus,
      // ✅ FIX 3: Calculate and send time remaining for HUD
      timeRemaining: (this.combo > 0) 
        ? Math.max(0, this.constants.COMBO.TIMEOUT - (currentTime - this.lastEventTime))
        : 0
    };
  }

  // Check if combo is active (for visual effects)
  isComboActive() {
    return this.combo >= 5;
  }

  // Get combo tier for visual feedback (1-5 stars)
  getComboTier() {
    if (this.combo < 5) return 0;
    if (this.combo < 15) return 1;
    if (this.combo < 30) return 2;
    if (this.combo < 50) return 3;
    if (this.combo < 75) return 4;
    return 5;
  }
}