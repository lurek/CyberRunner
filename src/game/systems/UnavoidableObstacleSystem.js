/**
 * UNAVOIDABLE_OBSTACLE_SYSTEM.js
 * Tall obstacles that CANNOT be jumped over - requires slide or lane change
 * 
 * Features:
 * - Tall wall design (2.5m - too high to jump)
 * - Cannot be jumped over
 * - Can only be avoided by sliding OR changing lanes
 * - Adds challenge and forces player strategy
 * - Slide-through grants 0 damage
 */

import * as THREE from 'three';

export class UnavoidableObstacleSystem {
  constructor(constants = {}) {
    this.constants = {
      TALL_WALL_HEIGHT: constants.TALL_WALL_HEIGHT || 2.5,
      TALL_WALL_WIDTH: constants.TALL_WALL_WIDTH || 2.4,
      TALL_WALL_DEPTH: constants.TALL_WALL_DEPTH || 0.3,

      // Player can slide under up to 1.0m
      SLIDE_CLEARANCE_HEIGHT: constants.SLIDE_CLEARANCE_HEIGHT || 1.0,

      // If sliding, no damage at all
      SLIDE_DAMAGE: 0,

      // If hit while not sliding, heavy damage
      HIT_DAMAGE: 35,

      ...constants
    };

    this.lastCollisions = new Map();
  }

  /**
   * Creates a tall wall that blocks both jumping and normal movement
   * Player MUST either slide under or change lanes
   */
  static createTallWall(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'tall_wall',
      canSlideUnder: false, // Cannot slide under
      canJumpOver: false,  // CANNOT jump over!
      requiresSlide: false, // Sliding won't help
      hitSound: 'wall_crash',
      isUnavoidable: true
    };

    // Left post
    const postGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.2);
    const postMaterial = materials.tallWallPost || new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.3
    });

    const postL = new THREE.Mesh(postGeometry, postMaterial);
    postL.position.set(-1.2, 1.25, 0);
    postL.castShadow = true;
    group.add(postL);

    // Right post
    const postR = new THREE.Mesh(postGeometry, postMaterial);
    postR.position.set(1.2, 1.25, 0);
    postR.castShadow = true;
    group.add(postR);

    // Main wall barrier (tall!)
    const wallGeometry = new THREE.BoxGeometry(2.4, 2.5, 0.3);
    const wallMaterial = materials.tallWallBar || new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 1.25;
    wall.castShadow = true;
    group.add(wall);

    // Glow effect to indicate "danger - can't jump over"
    const glowGeometry = new THREE.BoxGeometry(2.5, 2.6, 0.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1.25;
    group.add(glow);

    group.userData.glowMesh = glow;
    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(2.4, 2.5, 0.3)
    );

    return group;
  }

  /**
   * Check collision with tall wall
   * Returns: { canSlide, damageAmount, zone, feedback }
   */
  checkTallWallCollision(playerPos, playerBox, wallData) {
    const playerY = playerPos.y;
    const wallGroupY = wallData.position?.y || wallData.y || 0;

    // Wall center is at 1.25m, so slide clearance is below 1.0m
    const slideThreshold = wallGroupY + this.constants.SLIDE_CLEARANCE_HEIGHT;
    const wallTop = wallGroupY + this.constants.TALL_WALL_HEIGHT / 2;

    const now = performance.now();
    const collisionKey = wallData.id || JSON.stringify(wallData.position);
    const lastHit = this.lastCollisions.get(collisionKey);

    // Debounce: prevent multiple hits on same obstacle
    if (lastHit && now - lastHit < 100) {
      return { canSlide: true, damageAmount: 0, zone: 'debounce' };
    }

    // ❌ COLLISION: Player hits the wall (cannot jump over or slide under)
    // Any contact is a hit because the wall goes from ground to 2.5m
    this.lastCollisions.set(collisionKey, now);
    return {
      canSlide: false,
      damageAmount: this.constants.HIT_DAMAGE,
      zone: 'collision',
      impactType: 'wall_collision',
      feedback: 'failed',
      message: '⚠️ Tall Wall! Change lanes!'
    };

    return { canSlide: true, damageAmount: 0, zone: 'unknown' };
  }

  /**
   * Update visual animations for tall walls
   */
  updateTallWallVisuals(wallGroup, deltaTime) {
    if (!wallGroup.userData.glowMesh) return;

    // Pulsing glow effect
    wallGroup.userData.animTime = (wallGroup.userData.animTime || 0) + deltaTime * 3;
    const pulse = 0.15 + 0.1 * Math.sin(wallGroup.userData.animTime);
    wallGroup.userData.glowMesh.material.opacity = pulse;
  }

  /**
   * Clear collision debounce for a specific wall
   */
  clearCollisionDebounce(wallId) {
    this.lastCollisions.delete(wallId);
  }
}

/**
 * VARIABLE HEIGHT BAR SYSTEM
 * Some bars can be jumped over, others cannot
 * Creates mixed challenge: some bars require sliding, others require jumping
 */
export class VariableHeightBarSystem {
  constructor(constants = {}) {
    this.constants = {
      ...constants
    };
  }

  /**
   * Create a LOW bar - can be jumped over OR slid under (player choice)
   * Height: 1.2m - gives player options
   */
  static createLowBar(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'bar_low',
      canSlideUnder: true,
      canJumpOver: true,  // Can jump over this one
      hitSound: 'bar_whoosh',
      barHeight: 1.2
    };

    const postGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.2);
    const postL = new THREE.Mesh(postGeometry, materials.barrier || new THREE.MeshStandardMaterial({ color: 0x00ffff }));
    postL.position.set(-1.125, 0.6, 0);
    postL.castShadow = true;
    group.add(postL);

    const postR = new THREE.Mesh(postGeometry, materials.barrier || new THREE.MeshStandardMaterial({ color: 0x00ffff }));
    postR.position.set(1.125, 0.6, 0);
    postR.castShadow = true;
    group.add(postR);

    const barGeometry = new THREE.BoxGeometry(2.4, 0.25, 0.3);
    const barMaterial = materials.barTop || new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.y = 1.2;
    bar.castShadow = true;
    group.add(bar);

    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(2.4, 0.25, 0.3)
    );

    return group;
  }

  /**
   * Create a HIGH bar - can only be slid under
   * Height: 1.6m - too high to jump over comfortably
   * Can be slid under if timed correctly
   */
  static createHighBar(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'bar_high',
      canSlideUnder: true,
      canJumpOver: false,  // CANNOT jump - too high!
      requiresSlide: true,
      hitSound: 'bar_whoosh_high',
      barHeight: 1.6,
      isHigh: true
    };

    // Taller posts for higher bar
    const postGeometry = new THREE.BoxGeometry(0.15, 1.6, 0.2);
    const postMaterial = materials.barrierHigh || new THREE.MeshStandardMaterial({
      color: 0xff9900,  // Orange tint for "high" indicator
      emissive: 0xff6600,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });

    const postL = new THREE.Mesh(postGeometry, postMaterial);
    postL.position.set(-1.125, 0.8, 0);
    postL.castShadow = true;
    group.add(postL);

    const postR = new THREE.Mesh(postGeometry, postMaterial);
    postR.position.set(1.125, 0.8, 0);
    postR.castShadow = true;
    group.add(postR);

    // High bar
    const barGeometry = new THREE.BoxGeometry(2.4, 0.25, 0.3);
    const barMaterial = materials.barHigh || new THREE.MeshStandardMaterial({
      color: 0xff9900,  // Orange glow for visibility
      emissive: 0xff6600,
      emissiveIntensity: 0.6,
      metalness: 0.85,
      roughness: 0.15
    });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.y = 1.6;
    bar.castShadow = true;
    group.add(bar);

    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.6, 0),
      new THREE.Vector3(2.4, 0.25, 0.3)
    );

    return group;
  }
}
