// ============================================================================
// FILE: BAR_OBSTACLE_SYSTEM.js
// Purpose: Complete bar obstacle implementation with slide-under mechanics
// Location: src/game/systems/BarObstacleSystem.js
// ============================================================================

import * as THREE from 'three';

export class BarObstacleSystem {
  constructor(constants = {}) {
    this.constants = {
      BAR_HEIGHT: constants.BAR_HEIGHT || 1.8, // Raised to 1.8m for clear "slide under" traversability
      BAR_SLIDE_THRESHOLD: constants.BAR_SLIDE_THRESHOLD || 1.4,
      BAR_DAMAGE_ZONE_TOP: constants.BAR_DAMAGE_ZONE_TOP || 1.5,
      BAR_DAMAGE_ZONE_BOTTOM: constants.BAR_DAMAGE_ZONE_BOTTOM || 1.4,
      BAR_DAMAGE_TOP_HIT: constants.BAR_DAMAGE_TOP_HIT || 25,
      BAR_DAMAGE_EDGE_HIT: constants.BAR_DAMAGE_EDGE_HIT || 15,
      BAR_PARTICLE_COLOR: { r: 0, g: 1, b: 1 },
      ...constants
    };

    this.lastBarCollisions = new Map();
  }

  checkBarCollision(playerPos, playerBox, barData) {
    const playerY = playerPos.y;
    // Bar group is at Y=0, bar mesh is at Y=1.0 within the group
    const barGroupY = barData.position?.y || barData.y || 0;
    const barMeshOffsetY = 1.0; // ✅ Updated to 1.0m (reduced from 1.8m)
    const actualBarTopY = barGroupY + barMeshOffsetY;

    // Safe sliding zone: below 0.6m (can crouch/slide under easily)
    const safeSlideCutoff = barGroupY + 0.6;
    // Damage zone bottom: 0.6m (start of collision zone)
    const damageZoneBottom = barGroupY + 0.6;
    // Damage zone top: 0.85m (just hitting the bar)
    const damageZoneTop = barGroupY + 0.85;

    const now = performance.now();
    const lastHit = this.lastBarCollisions.get(barData.id || JSON.stringify(barData.position));
    if (lastHit && now - lastHit < 100) {
      return { canSlide: true, damageAmount: 0, zone: 'debounce' };
    }

    // SAFE: Player is well above the bar
    if (playerY > actualBarTopY + 0.3) {
      return { canSlide: true, damageAmount: 0, zone: 'above' };
    }

    // SAFE: Player is sliding/crouching under (Y < 1.0)
    if (playerY < safeSlideCutoff) {
      return { canSlide: true, damageAmount: 0, zone: 'safe_slide' };
    }

    // HIT: Player hits top of bar (Y > 1.25)
    if (playerY >= damageZoneTop) {
      this.lastBarCollisions.set(barData.id || JSON.stringify(barData.position), now);
      return {
        canSlide: false,
        damageAmount: this.constants.BAR_DAMAGE_TOP_HIT,
        zone: 'top_hit',
        impactType: 'head_collision'
      };
    }

    // EDGE: Player grazes the bar (1.0 <= Y <= 1.25)
    if (playerY >= damageZoneBottom && playerY < damageZoneTop) {
      const edgeProximity = (playerY - damageZoneBottom) /
        (damageZoneTop - damageZoneBottom);
      const damage = Math.ceil(this.constants.BAR_DAMAGE_EDGE_HIT * edgeProximity);

      this.lastBarCollisions.set(barData.id || JSON.stringify(barData.position), now);
      return {
        canSlide: false,
        damageAmount: damage,
        zone: 'edge_contact',
        impactType: 'glancing_blow',
        severity: edgeProximity
      };
    }

    return { canSlide: true, damageAmount: 0, zone: 'unknown' };
  }

  static createBarGeometry(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'bar',
      canSlideUnder: true,
      isBar: true,
      hitSound: 'bar_whoosh'
    };

    // ✅ FIXED: Posts are now 1.0m tall (reduced from 1.8m) for proper slide clearance
    const postGeometry = new THREE.BoxGeometry(0.15, 1.0, 0.2);
    const postL = new THREE.Mesh(postGeometry, materials.barrier || new THREE.MeshStandardMaterial({ color: 0x00ffff }));
    postL.position.set(-1.125, 0.5, 0);
    postL.castShadow = true;
    group.add(postL);

    const postR = new THREE.Mesh(postGeometry, materials.barrier || new THREE.MeshStandardMaterial({ color: 0x00ffff }));
    postR.position.set(1.125, 0.5, 0);
    postR.castShadow = true;
    group.add(postR);

    // ✅ FIXED: Horizontal bar at 1.0m height (reduced from 1.8m) - player slides under at ~0.6m
    const barGeometry = new THREE.BoxGeometry(2.4, 0.25, 0.3);
    const barMaterial = materials.barTop || new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.y = 1.0;  // ✅ Reduced from 1.8m
    bar.castShadow = true;
    group.add(bar);

    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.0, 0),  // ✅ Centered at 1.0m
      new THREE.Vector3(2.4, 0.25, 0.3)
    );

    return group;
  }

  createBarVisuals(group) {
    const glowGeometry = new THREE.BoxGeometry(2.5, 0.4, 0.4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1.0;  // ✅ Updated to match bar height
    group.add(glow);

    group.userData.glowMesh = glow;
    group.userData.animTime = 0;

    return group;
  }

  updateBarVisuals(barGroup, deltaTime) {
    if (!barGroup.userData.glowMesh) return;

    barGroup.userData.animTime = (barGroup.userData.animTime + deltaTime * 2) % (Math.PI * 2);
    const pulse = 0.15 + Math.sin(barGroup.userData.animTime) * 0.1;
    barGroup.userData.glowMesh.material.opacity = pulse;

    barGroup.userData.glowMesh.scale.y = 1 + Math.sin(barGroup.userData.animTime) * 0.05;
  }

  clearDebounce(barId) {
    this.lastBarCollisions.delete(barId);
  }

  getActiveBarCollisions(playerZ, barObstacles, maxDistance = 120) {
    if (!barObstacles) return [];
    return barObstacles.filter(bar =>
      bar.userData?.isBar && Math.abs(playerZ - (bar.position?.z || 0)) < maxDistance
    );
  }
}
