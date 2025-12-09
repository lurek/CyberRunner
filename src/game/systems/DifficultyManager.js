/**
 * Difficulty Manager
 * Handles dynamic difficulty scaling with wave-based intensity
 */

export class DifficultyManager {
  constructor(constants) {
    this.constants = constants;
    this.reset();
  }

  reset() {
    this.distance = 0;
    this.currentWave = 1;
    this.waveIntensity = 0.5;  // 0 = calm, 1 = intense
    this.waveTimer = 0;
    this.waveDuration = 15;  // 15 seconds per wave cycle
    this.safeZoneActive = false;
    this.safeZoneDistance = 0;
    this.nextBossSection = 2000;
    this.comboBonus = 1.0;
  }

  update(deltaTime, distanceTraveled, comboMultiplier) {
    this.distance = distanceTraveled;
    this.waveTimer += deltaTime;

    // Wave cycling: intense -> calm -> intense
    const waveProgress = (this.waveTimer % this.waveDuration) / this.waveDuration;

    // Sine wave for smooth intensity changes
    this.waveIntensity = 0.3 + Math.sin(waveProgress * Math.PI) * 0.6;

    // ✅ FIX #23: Logarithmic difficulty progression (smoother)
    // Instead of linear/quadratic, use log scale: EASY -> NORMAL -> HARD -> EXTREME
    const logProgress = Math.log10(this.distance / 1000 + 1) / 5;
    const baseProgression = Math.min(logProgress, 1.0);

    // Apply base difficulty without sharp spikes
    this.waveIntensity = Math.min(this.waveIntensity + baseProgression * 0.3, 1.0);

    // ✅ FIX #23: Set difficulty level for reference
    if (baseProgression < 0.2) this.intensityLevel = 'EASY';
    else if (baseProgression < 0.4) this.intensityLevel = 'EASY+';
    else if (baseProgression < 0.6) this.intensityLevel = 'NORMAL';
    else if (baseProgression < 0.8) this.intensityLevel = 'HARD';
    else this.intensityLevel = 'EXTREME';

    // Apply combo bonus (skilled players get more challenge)
    this.comboBonus = Math.min(comboMultiplier * 0.2, 0.5);

    // Check for safe zone
    if (this.safeZoneActive) {
      this.safeZoneDistance -= deltaTime * this.constants.GAME.BASE_SPEED * 60;
      if (this.safeZoneDistance <= 0) {
        this.safeZoneActive = false;
      }
    }

    // ✅ FIX #23: Log difficulty progression
    if (this.distance % 500 < deltaTime * 60) { // Log every 500m
      console.log(`📊 Difficulty: ${this.intensityLevel} (${this.distance.toFixed(0)}m, intensity: ${this.waveIntensity.toFixed(2)})`);
    }
  }

  // Trigger safe zone (after perfect section or boss defeat)
  triggerSafeZone(duration = 100) {
    this.safeZoneActive = true;
    this.safeZoneDistance = duration;
  }

  // Check if should spawn obstacle
  shouldSpawnObstacle() {
    if (this.safeZoneActive) return false;

    const baseChance = 0.018;
    const intensityMultiplier = 0.5 + this.waveIntensity * 1.5;
    const finalChance = baseChance * intensityMultiplier * (1 + this.comboBonus);

    return Math.random() < finalChance;
  }

  // Check if should spawn coins
  shouldSpawnCoins() {
    const baseChance = 0.02;
    // More coins during low intensity
    const intensityMultiplier = 1.5 - this.waveIntensity * 0.5;
    const finalChance = baseChance * intensityMultiplier;

    return Math.random() < finalChance;
  }

  // ✅ BUG FIX: Removed 'shouldSpawnPowerUp' function.
  // This logic was flawed and is now handled by a simpler timer in GameEngine.jsx.

  // Get obstacle type based on difficulty
  getObstacleType() {
    const difficultyProgress = Math.min(this.distance / 3000, 1.0);

    // Early game: mostly simple obstacles (including new sliding obstacles)
    if (difficultyProgress < 0.3) {
      // ✅ UPDATED: Include new realistic obstacles early
      const easyTypes = ["box", "spike", "barrier", "energy_barrier", "tall_wall", "bar_high", "scooter", "road_divider"];
      return easyTypes[Math.floor(Math.random() * easyTypes.length)];
    }

    // Mid game: mix of simple and complex (add drone_turret, tall_wall)
    if (difficultyProgress < 0.7) {
      const midTypes = ["box", "wall", "spike", "barrier", "laser_grid", "moving_barrier", "energy_barrier", "drone_turret", "tall_wall", "bar_low", "bar_high", "plasma_gate", "scooter", "dumpster", "road_divider"];
      return midTypes[Math.floor(Math.random() * midTypes.length)];
    }

    // Late game: all types including challenging ones
    // ✅ UPDATED: Removed pulse_barrier (ring obstacle looks odd)
    const allTypes = [
      "box", "wall", "spike", "barrier", "drone", "laser_grid", "moving_barrier",
      "rotating_laser", "energy_barrier", "drone_turret", "plasma_gate",
      "tall_wall", "bar_high", "scooter", "dumpster", "road_divider"
    ];
    return allTypes[Math.floor(Math.random() * allTypes.length)];
  }

  // Get coin pattern based on intensity
  getCoinPattern() {
    if (this.waveIntensity < 0.4) {
      // Easy patterns during calm periods
      return Math.random() < 0.6 ? 'line' : 'zigzag';
    } else if (this.waveIntensity < 0.7) {
      // Mix during medium intensity
      const patterns = ['line', 'zigzag', 'circle', 'risk_reward'];
      return patterns[Math.floor(Math.random() * patterns.length)];
    } else {
      // Challenging patterns during intense periods
      return Math.random() < 0.5 ? 'risk_reward' : 'circle';
    }
  }

  // Check if boss section coming up
  isBossSectionNear() {
    return this.distance >= this.nextBossSection - 200 && this.distance < this.nextBossSection;
  }

  // Check if in boss section
  isInBossSection() {
    return this.distance >= this.nextBossSection && this.distance < this.nextBossSection + 300;
  }

  // Complete boss section
  completeBossSection() {
    this.nextBossSection += 2000;
    this.triggerSafeZone(150);
  }

  // Get current state for UI warnings
  getDifficultyState() {
    return {
      wave: Math.floor(this.waveTimer / this.waveDuration) + 1,
      intensity: this.waveIntensity,
      intensityLevel: this.getIntensityLevel(),
      safeZone: this.safeZoneActive,
      bossWarning: this.isBossSectionNear(),
      bossActive: this.isInBossSection()
    };
  }

  getIntensityLevel() {
    if (this.waveIntensity < 0.3) return 'calm';
    if (this.waveIntensity < 0.6) return 'moderate';
    if (this.waveIntensity < 0.8) return 'intense';
    return 'extreme';
  }
}