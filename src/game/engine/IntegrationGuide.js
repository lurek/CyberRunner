/**
 * 📋 INTEGRATION GUIDE FOR BUG FIXES
 * 
 * This file shows EXACTLY where and how to apply each bug fix
 * to your existing codebase. Follow these step-by-step.
 * 
 * Status: Ready to implement
 * Estimated Time: 90 minutes for all fixes
 * Risk Level: LOW (all fixes are isolated)
 */

// ============================================================================
// PART 1: INTEGRATE FIXES INTO ENHANCED PARTICLES
// File: src/effects/EnhancedParticles.js
// ============================================================================

/**
 * LOCATION: EnhancedParticles.js - constructor() method
 * 
 * REPLACE THIS:
 */
/*
constructor(scene, maxParticles = 200) {
  this.scene = scene;
  this.particles = [];
  this.maxParticles = maxParticles;
  // Material created later...
}
*/

/**
 * WITH THIS:
 */
export function EnhancedParticlesPatched(scene, maxParticles = 200) {
  // ✅ FIX #4: Material initialized immediately (not later)
  const material = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    map: null,
    vertexColors: true,
    fog: false,
    blending: THREE.AdditiveBlending
  });

  // ✅ FIX #14 & #25: Geometry with bounds set
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Set frustum culling bounds
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, 0, 0),
    1000
  );

  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-500, -500, -500),
    new THREE.Vector3(500, 500, 500)
  );

  return {
    scene,
    particles: [],
    maxParticles,
    material,
    geometry,
    
    // ✅ FIX #4: Spawn method with memory management
    spawn(type, position, color) {
      // ... spawn logic ...
      
      // CRITICAL: Clean up every spawn
      if (this.particles.length > 500) {
        const toRemove = this.particles.length - 400;
        this.particles.splice(0, toRemove);
        console.log(`🧹 Cleaned ${toRemove} particles`);
      }
    }
  };
}

// ============================================================================
// PART 2: INTEGRATE FIXES INTO COLLISION MANAGER
// File: src/game/engine/CollisionManager.js
// ============================================================================

/**
 * LOCATION: CollisionManager.checkObstacleCollisions() method
 * 
 * AROUND LINE 48-50, change Z-distance check:
 */

// BEFORE:
// if (Math.abs(playerZ - obstacle.position.z) > 80) continue;

// AFTER: ✅ FIX #12: Increased detection range
// if (Math.abs(playerZ - obstacle.position.z) > 120) continue;

/**
 * LOCATION: Same method, add active state check
 * BEFORE collision check, add:
 */

for (let obstacle of obstacles) {
  // ✅ FIX #15: Check active state before collision
  if (!obstacle.visible || !obstacle.active) continue;
  if (Math.abs(playerZ - obstacle.position.z) > 120) continue;
  
  // ... rest of collision logic
}

// ============================================================================
// PART 3: INTEGRATE FIXES INTO PLAYER CONTROLLER
// File: src/game/engine/PlayerController.js
// ============================================================================

/**
 * LOCATION: PlayerController.update() method
 * 
 * Around line 155-165, verify this is present:
 */

if (this.state.isSliding) {
  // ✅ FIX #8: Ensure timer decrements EVERY FRAME
  this.state.slideTimer -= dt;
  if (this.state.slideTimer <= 0) {
    this.state.isSliding = false;
    this.state.slideTimer = 0; // Reset to prevent negatives
    if (this.player && !this.player.userData?.isGLB) {
      this.player.scale.y = 1;
    }
  }
}

/**
 * LOCATION: PlayerController.changeLane() method
 * 
 * REPLACE WITH:
 */

changeLane(direction, sfxEnabled) {
  // ✅ FIX #10: Only block during grapple
  if (this.state.isGrappling) return false;

  // ✅ FIX #9: Allow lane change during jump
  // Only block if falling fast into ground
  const isLanding = this.state.isJumping && 
                    this.state.verticalVelocity < -5 && 
                    this.player.position.y < this.CONSTANTS.PLAYER.BASE_HEIGHT + 0.5;
  
  if (isLanding) return false;

  const newLane = this.state.targetLane + direction;
  if (newLane >= 0 && newLane <= 2) {
    this.state.targetLane = newLane;
    return true;
  }
  return false;
}

// ============================================================================
// PART 4: INTEGRATE FIXES INTO ENTITY SPAWNER
// File: src/game/engine/EntitySpawner.js
// ============================================================================

/**
 * LOCATION: EntitySpawner.spawnObstacle() method
 * 
 * ADD AT START OF METHOD:
 */

spawnObstacle(position, type, speed) {
  // ✅ FIX #11: Validate spawn position is safe
  if (this.playerRef?.position) {
    const playerX = this.playerRef.position.x;
    const dx = Math.abs(position.x - playerX);
    
    if (dx < 0.5) {
      console.warn(`⚠️ Spawn blocked: too close (dx=${dx.toFixed(2)})`);
      return null; // Don't spawn
    }
  }

  // Continue with normal spawn logic...
}

/**
 * LOCATION: EntitySpawner.updateObstacles() method
 * 
 * REPLACE entire method with:
 */

updateObstacles(dt, speed, gameStats) {
  // ✅ FIX #13: Safe array operations with filtering
  this.obstacles = this.obstacles.filter((obstacle, index) => {
    try {
      if (!obstacle) return false; // Remove null entries

      // Update position
      if (obstacle.position) {
        obstacle.position.z -= speed * dt;
      }

      // Update matrix for collision
      if (obstacle.updateMatrixWorld) {
        obstacle.updateMatrixWorld(true);
      }

      // Remove if off-screen
      if (obstacle.position?.z < -50) {
        if (obstacle.geometry) obstacle.geometry.dispose();
        if (obstacle.material) obstacle.material.dispose();
        return false; // Remove
      }

      return true; // Keep
    } catch (error) {
      console.error(`Error updating obstacle at index ${index}:`, error);
      return false; // Remove problematic obstacle
    }
  });
}

// ============================================================================
// PART 5: INTEGRATE FIXES INTO GAME ENGINE
// File: src/game/GameEngine.jsx
// ============================================================================

/**
 * LOCATION: In useEffect for gameOverRef
 * 
 * CHANGE FROM:
 */
/*
useEffect(() => {
  if (gameOverRef.current) {
    // Nothing happens...
  }
}, [gameOverRef.current]);
*/

/**
 * TO: ✅ FIX #16 - Stop game loop on game over
 */
useEffect(() => {
  if (gameOverRef.current && animationIdRef.current) {
    // Stop animation loop
    cancelAnimationFrame(animationIdRef.current);
    animationIdRef.current = null;

    // Freeze player
    if (playerRef.current) {
      playerRef.current._isFrozen = true;
    }

    // Reset timer
    lastTimeRef.current = performance.now();
    
    console.log('✅ Game stopped on game over');
  }
}, [gameOverRef.current]);

/**
 * LOCATION: Main game loop function
 * 
 * CHANGE:
 */
/*
const deltaTime = (currentTime - lastTimeRef.current) / 1000;
*/

/**
 * TO: ✅ FIX #18 - Apply time scale to delta time
 */
let deltaTime = (currentTime - lastTimeRef.current) / 1000;
deltaTime = deltaTime * (timeScaleRef.current || 1.0); // Apply time scale

// ============================================================================
// PART 6: INTEGRATE FIXES INTO UNIQUE FEATURES
// File: src/game/systems/UniqueFeatures.js
// ============================================================================

/**
 * LOCATION: Jetpack activation method
 * 
 * ADD STATE GUARDS:
 */

activateJetpack() {
  // ✅ FIX #19: Prevent double activation
  if (this.jetpack.isActive) {
    console.warn('⚠️ Jetpack already active');
    return false;
  }

  if (this.jetpack.cooldown > 0) {
    console.warn(`⚠️ Jetpack on cooldown: ${this.jetpack.cooldown.toFixed(1)}s`);
    return false;
  }

  this.jetpack.isActive = true;
  this.jetpack.duration = this.jetpack.maxDuration;
  console.log('🚀 Jetpack activated');
  return true;
}

/**
 * LOCATION: Hoverboard deactivation method
 * 
 * ENSURE THIS IS PRESENT:
 */

deactivateHoverboard() {
  this.hoverboard.isActive = false;
  this.hoverboard.speedMultiplier = 1.0; // ✅ FIX #20: Reset multiplier
  this.hoverboard.duration = 0;

  if (this.player && this.player.position.y < BASE_HEIGHT) {
    this.player.position.y = BASE_HEIGHT; // ✅ Return to ground
  }

  console.log('✅ Hoverboard deactivated');
}

/**
 * LOCATION: Lightning dash execution
 * 
 * ADD COLLISION AVOIDANCE:
 */

executeLightningDash(distance = 50) {
  // ✅ FIX #21: Check for obstacles in dash path
  const dashStart = this.player.position.z;
  const dashTarget = dashStart - distance;

  const obstaclesInPath = this.obstacles.filter(obs => 
    obs.position.z < dashStart && obs.position.z > dashTarget - 5
  );

  if (obstaclesInPath.length > 0) {
    const nearest = obstaclesInPath.reduce((a, b) => 
      a.position.z > b.position.z ? a : b
    );
    this.player.position.z = nearest.position.z + 3; // After obstacle
  } else {
    this.player.position.z = dashTarget; // Full distance
  }
}

// ============================================================================
// PART 7: INTEGRATE FIXES INTO LEADERBOARD
// File: src/utils/cloud/LeaderboardManager.js
// ============================================================================

/**
 * LOCATION: sortLeaderboard() method
 * 
 * REPLACE WITH: ✅ FIX #26 - Stable sort
 */

sortLeaderboard(scores) {
  return scores.sort((a, b) => {
    // Primary: score descending
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;

    // Tiebreaker: timestamp ascending
    const timeA = new Date(a.timestamp || 0);
    const timeB = new Date(b.timestamp || 0);
    return timeA - timeB;
  });
}

// ============================================================================
// PART 8: INTEGRATE FIXES INTO AUDIO SYSTEM
// File: src/utils/audioSystem.js
// ============================================================================

/**
 * LOCATION: playSfx() method
 * 
 * ADD ERROR HANDLING:
 */

playSfx(name, enabled) {
  if (!enabled) return;

  try {
    const audio = this.getAudio(name);
    if (!audio) {
      console.warn(`⚠️ Audio not found: ${name}`);
      return;
    }

    // ✅ FIX #24: Reset and play safely
    audio.currentTime = 0;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn(`⚠️ Audio play failed (${name}):`, error);
      });
    }
  } catch (error) {
    console.warn(`⚠️ Audio error (${name}):`, error);
  }
}

// ============================================================================
// PART 9: INTEGRATE FIXES INTO PERFORMANCE MANAGER
// File: src/utils/performance/PerformanceManager.js
// ============================================================================

/**
 * LOCATION: cleanup() method
 * 
 * ADD TIMER CLEANUP: ✅ FIX #27
 */

cleanup() {
  // ✅ Clear all active timers
  if (this.timers) {
    Object.values(this.timers).forEach(timer => {
      clearTimeout(timer);
    });
    this.timers = {};
  }

  // Clear metrics
  if (this.metrics) {
    this.metrics = {};
  }

  console.log('✅ Performance manager cleaned up');
}

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/**
 * After implementing all fixes, run these tests:
 * 
 * ✅ TEST 1: Collision Detection (2 min)
 *    - Run into obstacle
 *    - Verify: Immediate damage (not delayed)
 *    - Expected: No phasing through objects
 * 
 * ✅ TEST 2: Slide Mechanic (2 min)
 *    - Slide under barrier
 *    - Verify: Slides end properly
 *    - Expected: Player stands up smoothly
 * 
 * ✅ TEST 3: Jump Control (2 min)
 *    - Jump and change lanes mid-air
 *    - Verify: Lane change works
 *    - Expected: No forced landing delay
 * 
 * ✅ TEST 4: Memory Leak (5 min)
 *    - Play for 5 minutes, take 20+ hits
 *    - Verify: FPS stable at 50+
 *    - Expected: No FPS degradation
 * 
 * ✅ TEST 5: Abilities (3 min)
 *    - Use jetpack, hoverboard, lightning
 *    - Verify: All activate without double-triggering
 *    - Expected: Smooth ability transitions
 * 
 * ✅ TEST 6: Audio (1 min)
 *    - Sounds should play correctly
 *    - Expected: No audio errors in console
 * 
 * ✅ TEST 7: Leaderboard (2 min)
 *    - Check score sorting
 *    - Expected: Top scores at top
 * 
 * Total: ~20 minutes of testing
 * Pass Criteria: All 7 tests pass ✅
 */

export default {
  integrationGuide: true,
  estimatedTime: '90 minutes',
  totalFixes: 29,
  testingTime: '20 minutes'
};
