/**
 * 🔧 SafeSpawnValidator.js
 * 
 * Validates and ensures safe obstacle spawning
 * Prevents obstacles from spawning too close to player or other obstacles
 * 
 * Fixes: #11 (Obstacle spawn unsafe)
 */

export class SafeSpawnValidator {
  constructor(constants) {
    this.constants = constants;
    this.SPAWN_DISTANCE = 60;           // Must be this far ahead
    this.SPAWN_BUFFER_ZONE = 30;        // Additional buffer after SPAWN_DISTANCE
    this.MIN_OBSTACLE_SPACING = 5.0;    // Minimum distance between obstacles
    this.SPAWN_HISTORY = [];            // Track recent spawns
    this.HISTORY_DURATION = 5.0;        // Keep history for 5 seconds
  }

  /**
   * ✅ FIX #11: Validate obstacle spawn position is safe
   * 
   * @param {Object} obstacleDefinition - Obstacle to spawn
   * @param {THREE.Vector3} playerPosition - Player's current position
   * @param {Array} existingObstacles - Already spawned obstacles
   * @returns {Object} - Safe obstacle definition or null if unsafe
   */
  validateSpawn(obstacleDefinition, playerPosition, existingObstacles = []) {
    if (!obstacleDefinition || !playerPosition) {
      console.error('❌ Invalid spawn parameters');
      return null;
    }

    // Step 1: Ensure spawn is far enough ahead
    const MIN_SPAWN_Z = playerPosition.z + this.SPAWN_DISTANCE;
    const MAX_SPAWN_Z = playerPosition.z + this.SPAWN_DISTANCE + this.SPAWN_BUFFER_ZONE;
    
    let spawnZ = obstacleDefinition.position?.z || (playerPosition.z + this.SPAWN_DISTANCE + 20);
    
    // Clamp to safe range
    if (spawnZ < MIN_SPAWN_Z) {
      console.warn(`⚠️ Obstacle spawn too close (${spawnZ}), moving to ${MIN_SPAWN_Z}`);
      spawnZ = MIN_SPAWN_Z + Math.random() * 15; // Add slight randomness
    }
    
    if (spawnZ > MAX_SPAWN_Z) {
      spawnZ = MAX_SPAWN_Z - Math.random() * 5;
    }
    
    // Step 2: Check spacing from existing obstacles
    const conflicts = this.findConflictingObstacles(
      spawnZ, 
      obstacleDefinition.position?.x, 
      existingObstacles
    );
    
    if (conflicts.length > 0) {
      console.warn(`⚠️ Spawn conflict with ${conflicts.length} obstacle(s), adjusting position`);
      
      // Try shifting forward
      spawnZ = Math.max(...conflicts.map(obs => obs.position.z)) + this.MIN_OBSTACLE_SPACING + 3;
      
      // Verify new position isn't beyond buffer
      if (spawnZ > MAX_SPAWN_Z + 20) {
        console.warn('⚠️ Cannot find safe spawn position, deferring spawn');
        return null; // Defer spawning
      }
    }
    
    // Step 3: Verify lane position is valid (if applicable)
    if (obstacleDefinition.position?.x !== undefined) {
      const validLanes = this.constants.LANE_POSITIONS || [-2.5, 0, 2.5];
      const laneX = obstacleDefinition.position.x;
      
      // Verify X is within valid range
      const minX = Math.min(...validLanes) - 1.0;
      const maxX = Math.max(...validLanes) + 1.0;
      
      if (laneX < minX || laneX > maxX) {
        console.warn(`⚠️ Invalid X position ${laneX}, clamping to valid range`);
        obstacleDefinition.position.x = Math.max(minX, Math.min(maxX, laneX));
      }
    }
    
    // Step 4: Create safe definition
    const safeDefinition = {
      ...obstacleDefinition,
      position: {
        ...obstacleDefinition.position,
        z: spawnZ
      },
      isSafeSpawn: true,
      spawnValidatedAt: performance.now()
    };
    
    // Track spawn
    this.recordSpawn(safeDefinition);
    
    console.log(`✅ Safe spawn validated at Z=${spawnZ.toFixed(1)}`);
    return safeDefinition;
  }

  /**
   * Find obstacles that conflict with spawn position
   */
  findConflictingObstacles(spawnZ, spawnX, existingObstacles) {
    const conflicts = [];
    const Z_TOLERANCE = this.MIN_OBSTACLE_SPACING;
    const X_TOLERANCE = 2.0; // Lane width

    for (let obstacle of existingObstacles) {
      if (!obstacle || !obstacle.active) continue;
      
      const obsZ = obstacle.position?.z || 0;
      const obsX = obstacle.position?.x || 0;
      
      const zDist = Math.abs(spawnZ - obsZ);
      const xDist = Math.abs(spawnX - obsX);
      
      // Conflict if too close in both axes
      if (zDist < Z_TOLERANCE && xDist < X_TOLERANCE) {
        conflicts.push(obstacle);
      }
    }
    
    return conflicts;
  }

  /**
   * Track recent spawns for analytics
   */
  recordSpawn(definition) {
    this.SPAWN_HISTORY.push({
      position: { ...definition.position },
      type: definition.type || 'unknown',
      timestamp: performance.now()
    });
    
    // Clean old entries
    const now = performance.now();
    this.SPAWN_HISTORY = this.SPAWN_HISTORY.filter(
      spawn => (now - spawn.timestamp) < this.HISTORY_DURATION * 1000
    );
  }

  /**
   * Get spawn analytics for debugging
   */
  getSpawnAnalytics() {
    return {
      recentSpawns: this.SPAWN_HISTORY.length,
      avgSpawnsPerSecond: (this.SPAWN_HISTORY.length / this.HISTORY_DURATION).toFixed(2),
      lastSpawn: this.SPAWN_HISTORY[this.SPAWN_HISTORY.length - 1]
    };
  }

  /**
   * Reset spawn history
   */
  reset() {
    this.SPAWN_HISTORY = [];
  }
}
