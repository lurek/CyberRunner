/**
 * COLLISION_FIXES.js
 * Critical collision detection fixes for Cyber Runner 3D
 * 
 * Fixes implemented:
 * 1. Player hitbox initialization race condition
 * 2. Improved slide hitbox (smaller crouch)
 * 3. Obstacle metadata for jump/slide hints
 * 4. Better collision validation
 */

import * as THREE from 'three';

/**
 * Fix #1: Initialize player hitbox immediately after player creation
 * Call this right after GLBPlayerSystem.load() completes
 */
export function initializePlayerHitbox(playerAnchor, constants) {
  if (!playerAnchor) {
    console.error('❌ initializePlayerHitbox: No player provided!');
    return false;
  }

  // Ensure userData exists
  if (!playerAnchor.userData) {
    playerAnchor.userData = {};
  }

  // Create local bounding box (relative to player)
  // Center at (0, 0.6, 0) with size (0.8, 1.2, 0.6)
  const localBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, 0.6, 0),  // Center slightly above ground
    new THREE.Vector3(
      constants.PLAYER.WIDTH || 0.8,
      constants.PLAYER.HEIGHT || 1.2,
      constants.PLAYER.DEPTH || 0.6
    )
  );

  // Create world bounding box (absolute coordinates)
  const worldBox = new THREE.Box3();
  
  // Store both boxes
  playerAnchor.userData.localBox = localBox;
  playerAnchor.userData.worldBox = worldBox;
  
  // Force initial update
  playerAnchor.updateMatrixWorld(true);
  worldBox.copy(localBox).applyMatrix4(playerAnchor.matrixWorld);

  console.log('✅ Player hitbox initialized:', {
    localBox: {
      min: localBox.min.toArray(),
      max: localBox.max.toArray()
    },
    worldBox: {
      min: worldBox.min.toArray(),
      max: worldBox.max.toArray()
    }
  });

  return true;
}
/**
 * Fix #2: Enhanced slide detection and collision
 */
export function improveSlideHitbox(player, isSliding) {
  if (!player || !player.userData || !player.userData.worldBox) {
    return;
  }

  const worldBox = player.userData.worldBox;
  
  if (isSliding) {
    // Make hitbox much smaller when sliding - only 0.5 units tall
    // This allows sliding under barriers at ~1.0-1.5 unit height
    const minY = worldBox.min.y;
    worldBox.max.y = minY + 0.5;  // Was 0.8, now even smaller
    
    // Also make slightly narrower for better clearance
    const centerX = (worldBox.min.x + worldBox.max.x) / 2;
    const halfWidth = 0.35;  // Was 0.4
    worldBox.min.x = centerX - halfWidth;
    worldBox.max.x = centerX + halfWidth;
  } else {
    // Normal hitbox - restore from localBox
    worldBox.copy(player.userData.localBox).applyMatrix4(player.matrixWorld);
  }
}

/**
 * Fix #3: Add metadata to obstacles for better gameplay hints
 */
export function addObstacleMetadata(obstacle, height, isWall = false) {
  if (!obstacle || !obstacle.userData) return;

  // Can player jump over this? (height <= 1.0 units)
  obstacle.userData.canJumpOver = height <= 1.0;
  
  // Can player slide under this? (height >= 1.2 units and not ground)
  obstacle.userData.canSlideUnder = height >= 1.2 && !obstacle.userData.isGround;
  
  // Requires grapple hook? (tall walls)
  obstacle.userData.requiresGrapple = height > 1.8 || isWall;
  
  // Store height for reference
  obstacle.userData.obstacleHeight = height;
  
  // Set visual hint color if needed (optional - for debug/tutorial)
  if (obstacle.userData.canJumpOver) {
    obstacle.userData.hintColor = 0x00ff00;  // Green = jumpable
  } else if (obstacle.userData.canSlideUnder) {
    obstacle.userData.hintColor = 0xffff00;  // Yellow = slide under
  } else if (obstacle.userData.requiresGrapple) {
    obstacle.userData.hintColor = 0xff00ff;  // Magenta = grapple only
  } else {
    obstacle.userData.hintColor = 0xff0000;  // Red = must avoid
  }
}
/**
 * Fix #4: Enhanced collision validation
 */
export function validateCollision(playerBox, obstacleBox, playerState, obstacleData) {
  if (!playerBox || !obstacleBox) return false;

  // Basic AABB check
  if (!playerBox.intersectsBox(obstacleBox)) return false;

  // Enhanced jump clearance check
  if (playerState.isJumping && obstacleData.canJumpOver) {
    // Check if player is safely above obstacle
    const playerBottom = playerBox.min.y;
    const obstacleTop = obstacleBox.max.y;
    
    // Add 0.2 unit buffer for safety
    if (playerBottom > obstacleTop + 0.2) {
      return false;  // Safely cleared by jumping
    }
  }

  // Enhanced slide clearance check  
  if (playerState.isSliding && obstacleData.canSlideUnder) {
    // Check if player is safely below obstacle
    const playerTop = playerBox.max.y;
    const obstacleBottom = obstacleBox.min.y;
    
    // Add 0.1 unit buffer
    if (playerTop < obstacleBottom - 0.1) {
      return false;  // Safely cleared by sliding
    }
  }

  // Collision detected
  return true;
}

/**
 * Debug: Visualize hitboxes (development only)
 */
export function visualizeHitboxes(scene, playerBox, obstacleBoxes, enabled = false) {
  if (!enabled || !scene) return;

  // Remove old helpers
  scene.children.filter(c => c.userData.isHitboxHelper).forEach(h => scene.remove(h));

  // Add new helpers
  if (playerBox) {
    const playerHelper = new THREE.Box3Helper(playerBox, 0x00ff00);
    playerHelper.userData.isHitboxHelper = true;
    scene.add(playerHelper);
  }

  obstacleBoxes.forEach(box => {
    const obstacleHelper = new THREE.Box3Helper(box, 0xff0000);
    obstacleHelper.userData.isHitboxHelper = true;
    scene.add(obstacleHelper);
  });
}

/**
 * Get collision debug info
 */
export function getCollisionDebugInfo(player, obstacles) {
  if (!player || !player.userData) {
    return { error: 'Player not initialized' };
  }

  return {
    player: {
      position: player.position.toArray(),
      hasLocalBox: !!player.userData.localBox,
      hasWorldBox: !!player.userData.worldBox,
      localBoxSize: player.userData.localBox ? 
        player.userData.localBox.getSize(new THREE.Vector3()).toArray() : null,
      worldBoxSize: player.userData.worldBox ?
        player.userData.worldBox.getSize(new THREE.Vector3()).toArray() : null
    },
    obstacles: obstacles.filter(o => o.active).map(o => ({
      type: o.userData?.type || 'unknown',
      position: o.position.toArray(),
      canJumpOver: o.userData?.canJumpOver,
      canSlideUnder: o.userData?.canSlideUnder,
      requiresGrapple: o.userData?.requiresGrapple
    }))
  };
}
/**
 * Enhanced collision check that accounts for slide clearance
 * ✅ FIX #17: Added null checks for safety
 */
export function checkSlideCollision(playerBox, obstacleBox, playerState, obstacleMetadata) {
  // ✅ FIX #17: Validate inputs before processing
  if (!playerBox || !obstacleBox) {
    console.warn('checkSlideCollision: null box provided');
    return false;  // Safe fallback
  }
  
  // Check for empty boxes
  if (playerBox.isEmpty() || obstacleBox.isEmpty()) {
    return false;  // Empty boxes can't collide
  }
  
  // Basic AABB intersection check
  if (!playerBox.intersectsBox(obstacleBox)) {
    return false; // No collision
  }

  // If player is sliding and obstacle can be slid under
  if (playerState?.isSliding && obstacleMetadata?.canSlideUnder) {
    // Check vertical clearance
    const playerTop = playerBox.max.y;
    const obstacleBottom = obstacleBox.min.y;
    
    // Add 0.05 unit safety buffer
    if (playerTop < obstacleBottom - 0.05) {
      console.log('✅ Slide clearance:', {
        playerTop: playerTop.toFixed(2),
        obstacleBottom: obstacleBottom.toFixed(2),
        gap: (obstacleBottom - playerTop).toFixed(2)
      });
      return false; // Safe clearance - no collision
    } else {
      console.warn('⚠️ Slide collision:', {
        playerTop: playerTop.toFixed(2),
        obstacleBottom: obstacleBottom.toFixed(2),
        overlap: (playerTop - obstacleBottom).toFixed(2)
      });
    }
  }

  // Collision detected
  return true;
}

/**
 * Debug: Log collision details
 */
export function logCollisionDebug(player, obstacle, collided) {
  if (!player?.userData?.worldBox) return;
  
  const playerBox = player.userData.worldBox;
  const obstacleBox = obstacle.userData?.worldBox || obstacle.worldBox;
  
  if (!obstacleBox) return;
  
  console.log('Collision Check:', {
    collided,
    playerPos: player.position.toArray().map(v => v.toFixed(2)),
    playerBoxTop: playerBox.max.y.toFixed(2),
    playerBoxBottom: playerBox.min.y.toFixed(2),
    obstaclePos: obstacle.position.toArray().map(v => v.toFixed(2)),
    obstacleBoxTop: obstacleBox.max.y.toFixed(2),
    obstacleBoxBottom: obstacleBox.min.y.toFixed(2),
    isSliding: player.userData?.isSliding,
    obstacleType: obstacle.userData?.type || obstacle.type,
    canSlideUnder: obstacle.userData?.canSlideUnder
  });
}
