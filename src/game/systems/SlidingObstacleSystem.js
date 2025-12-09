// ============================================================================
// FILE: SLIDING_OBSTACLE_SYSTEM.js
// Purpose: Cyberpunk-themed sliding obstacles with advanced slide mechanics
// Features:
// - Energy Barrier Slider (glowing neon structure that requires sliding)
// - Low-clearance Drone Turret (automated defense requiring crouch)
// - Plasma Gate (pulsing barrier that requires perfect timing)
// - Collision detection optimized for slide-under mechanics
// ============================================================================

import * as THREE from 'three';

export class SlidingObstacleSystem {
  constructor(constants = {}) {
    this.constants = {
      // ✅ FIX: Raised obstacle heights so player can slide under
      ENERGY_BARRIER_HEIGHT: constants.ENERGY_BARRIER_HEIGHT || 2.0,  // Was 1.5, now 2.0
      ENERGY_BARRIER_WIDTH: constants.ENERGY_BARRIER_WIDTH || 2.8,
      ENERGY_BARRIER_DEPTH: constants.ENERGY_BARRIER_DEPTH || 0.4,
      
      DRONE_TURRET_HEIGHT: constants.DRONE_TURRET_HEIGHT || 1.9,  // Was 1.4, now 1.9
      PLASMA_GATE_HEIGHT: constants.PLASMA_GATE_HEIGHT || 1.8,  // Was 1.3, now 1.8
      
      // Player slide height is ~0.6-0.8m, so threshold at 1.0m gives clearance
      SLIDE_HEIGHT_THRESHOLD: constants.SLIDE_HEIGHT_THRESHOLD || 1.0,  // Was 0.95, now 1.0
      DAMAGE_ZONE_HEIGHT: constants.DAMAGE_ZONE_HEIGHT || 1.5,  // Was 1.2, now 1.5
      
      PARTICLE_COLOR: { r: 0.0, g: 1.0, b: 1.0 }, // Cyan
      ...constants
    };

    this.lastCollisions = new Map();
  }

  /**
   * ========================================
   * ENERGY BARRIER SLIDER - PRIMARY OBSTACLE
   * ========================================
   * Glowing neon barrier that spans lanes
   * Player must slide under without taking damage
   * Visually striking with cyan neon design
   */
  static createEnergyBarrier(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'energy_barrier',
      canSlideUnder: true,
      requiresSlide: true,
      hitSound: 'energy_barrier_hit',
      slideSound: 'energy_barrier_slide'
    };

    // ========== LEFT SUPPORT PILLAR ==========
    const pillarGeometry = new THREE.BoxGeometry(0.25, 1.3, 0.15);
    const pillarMaterial = materials.barrier || new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const pillarLeft = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarLeft.position.set(-1.4, 0.65, 0);
    pillarLeft.castShadow = true;
    pillarLeft.userData = { baseEmissiveIntensity: 0.6 };
    group.add(pillarLeft);

    const pillarRight = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarRight.position.set(1.4, 0.65, 0);
    pillarRight.castShadow = true;
    pillarRight.userData = { baseEmissiveIntensity: 0.6 };
    group.add(pillarRight);

    // ========== MAIN ENERGY BARRIER BAR ==========
    // This is the part player must slide under
    const barrierGeometry = new THREE.BoxGeometry(2.8, 0.3, 0.4);
    const barrierMaterial = materials.barrierTop || new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0066ff,
      emissiveIntensity: 0.8,
      metalness: 0.95,
      roughness: 0.05,
      wireframe: false
    });

    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.y = 1.85;  // ✅ FIX: Raised from 1.35 to 1.85 (player can slide under at ~0.6-0.8m)
    barrier.castShadow = true;
    barrier.userData = { baseEmissiveIntensity: 0.8 };
    group.add(barrier);

    // ========== ENERGY GLOW EFFECT ==========
    const glowGeometry = new THREE.BoxGeometry(2.9, 0.5, 0.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.15,
      wireframe: false
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1.85;  // ✅ FIX: Match barrier height
    group.add(glow);

    // ========== SIDE ENERGY ARCS ==========
    // Decorative neon elements
    const arcGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.15);
    const arcMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    const arcLeft = new THREE.Mesh(arcGeometry, arcMaterial);
    arcLeft.position.set(-1.5, 0.75, 0);
    group.add(arcLeft);

    const arcRight = new THREE.Mesh(arcGeometry, arcMaterial);
    arcRight.position.set(1.5, 0.75, 0);
    group.add(arcRight);

    // ========== COLLISION BOX ==========
    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.85, 0),  // ✅ FIX: Updated collision height
      new THREE.Vector3(2.8, 0.3, 0.4)
    );

    group.userData.glowMesh = glow;
    group.userData.animTime = 0;

    return group;
  }

  /**
   * ========================================
   * DRONE TURRET - LOW CLEARANCE THREAT
   * ========================================
   * Automated defense system requiring slide
   * Spins and pulses danger indicators
   */
  static createDroneTurret(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'drone_turret',
      canSlideUnder: true,
      requiresSlide: true,
      isDynamic: true,
      hitSound: 'turret_spark',
      slideSound: 'energy_barrier_slide'
    };

    // ========== MAIN TURRET BASE ==========
    const baseGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8);
    const baseMaterial = materials.turretBase || new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.9;  // ✅ FIX: Raised from 1.4 to 1.9
    base.castShadow = true;
    group.add(base);

    // ========== ROTATING BARREL SECTION ==========
    const barrelGeometry = new THREE.BoxGeometry(1.8, 0.25, 0.25);
    const barrelMaterial = materials.turretBarrel || new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0xff6600,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.y = 1.9;  // ✅ FIX: Match base height
    barrel.userData.isBarrel = true;
    base.add(barrel);

    // ========== DANGER INDICATORS (spinning lights) ==========
    const lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const light1 = new THREE.Mesh(lightGeometry, lightMaterial);
    light1.position.set(-0.5, 1.6, 0);
    group.add(light1);

    const light2 = new THREE.Mesh(lightGeometry, lightMaterial);
    light2.position.set(0.5, 1.6, 0);
    group.add(light2);

    // ========== SCAN BEAM (thin cylinder) ==========
    const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.4
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 1.9;  // ✅ FIX: Match turret height
    beam.userData.isBeam = true;
    group.add(beam);

    // ========== COLLISION BOX ==========
    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.9, 0),  // ✅ FIX: Updated collision height
      new THREE.Vector3(1.8, 0.25, 0.25)
    );

    group.userData.rotationSpeed = Math.random() * 2 + 1;
    group.userData.scanAngle = 0;

    return group;
  }

  /**
   * ========================================
   * PLASMA GATE - PULSING BARRIER
   * ========================================
   * Energy gate that pulses between solid and semi-transparent
   * Requires timing to slide through safely
   */
  static createPlasmaGate(materials = {}) {
    const group = new THREE.Group();
    group.userData = {
      type: 'plasma_gate',
      canSlideUnder: true,
      requiresSlide: true,
      isDynamic: true,
      hitSound: 'plasma_hit',
      slideSound: 'plasma_slide'
    };

    // ========== GATE POSTS ==========
    const postGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.25);
    const postMaterial = materials.gatePosts || new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x6600ff,
      emissiveIntensity: 0.7,
      metalness: 0.85,
      roughness: 0.15
    });

    const postLeft = new THREE.Mesh(postGeometry, postMaterial);
    postLeft.position.set(-1.3, 0.6, 0);
    postLeft.castShadow = true;
    group.add(postLeft);

    const postRight = new THREE.Mesh(postGeometry, postMaterial);
    postRight.position.set(1.3, 0.6, 0);
    postRight.castShadow = true;
    group.add(postRight);

    // ========== MAIN PLASMA BARRIER ==========
    const plasmaGeometry = new THREE.BoxGeometry(2.6, 0.35, 0.2);
    const plasmaMaterial = materials.plasmaMain || new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0xcc00ff,
      emissiveIntensity: 0.7,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8
    });

    const plasma = new THREE.Mesh(plasmaGeometry, plasmaMaterial);
    plasma.position.y = 1.75;  // ✅ FIX: Raised from 1.25 to 1.75
    plasma.castShadow = true;
    group.add(plasma);

    // ========== PULSING ENERGY AURA ==========
    const auraGeometry = new THREE.BoxGeometry(2.7, 0.5, 0.3);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0xcc00ff,
      transparent: true,
      opacity: 0.1,
      wireframe: false
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.position.y = 1.75;  // ✅ FIX: Match plasma height
    group.add(aura);

    // ========== COLLISION BOX ==========
    group.userData.localBox = new THREE.Box3();
    group.userData.localBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.75, 0),  // ✅ FIX: Updated collision height
      new THREE.Vector3(2.6, 0.35, 0.2)
    );

    group.userData.auraMesh = aura;
    group.userData.plasmaMesh = plasma;
    group.userData.pulseTime = 0;
    group.userData.pulseSpeed = Math.random() * 2 + 1;

    return group;
  }

  /**
   * ========================================
   * COLLISION DETECTION
   * ========================================
   * Sophisticated collision system for sliding obstacles
   */
  checkSlidingObstacleCollision(playerPos, playerHeight, obstacleData, type) {
    const playerY = playerPos.y;
    const now = performance.now();
    
    const collisionKey = obstacleData.id || JSON.stringify(obstacleData.position);
    const lastHit = this.lastCollisions.get(collisionKey);
    
    // Debounce collision checks
    if (lastHit && now - lastHit < 100) {
      return { canSlide: true, damageAmount: 0, zone: 'debounce' };
    }

    const obstacleY = obstacleData.position?.y || obstacleData.y || 0;
    const slideThreshold = obstacleY + this.constants.SLIDE_HEIGHT_THRESHOLD;
    const damageZone = obstacleY + this.constants.DAMAGE_ZONE_HEIGHT;

    // ========== SAFE ZONE: Player is sliding/crouching ==========
    if (playerY < slideThreshold) {
      return {
        canSlide: true,
        damageAmount: 0,
        zone: 'safe_slide',
        feedback: 'success'
      };
    }

    // ========== SAFE ZONE: Player is well above the obstacle ==========
    if (playerY > damageZone + 0.4) {
      return {
        canSlide: true,
        damageAmount: 0,
        zone: 'above'
      };
    }

    // ========== COLLISION: Player hits obstacle ==========
    if (playerY >= slideThreshold && playerY <= damageZone + 0.4) {
      const collisionSeverity = (playerY - slideThreshold) / 
                                 ((damageZone + 0.4) - slideThreshold);
      
      const damageAmount = Math.ceil(15 * (0.5 + collisionSeverity * 1.5));

      this.lastCollisions.set(collisionKey, now);

      return {
        canSlide: false,
        damageAmount: damageAmount,
        zone: 'collision',
        impactType: 'head_hit',
        severity: collisionSeverity,
        feedback: 'failed'
      };
    }

    return { canSlide: true, damageAmount: 0, zone: 'unknown' };
  }

  /**
   * Update visual animations for sliding obstacles
   */
  updateSlidingObstacleVisuals(obstacleGroup, deltaTime) {
    const type = obstacleGroup.userData?.type;

    switch(type) {
      case 'energy_barrier':
        this._updateEnergyBarrier(obstacleGroup, deltaTime);
        break;
      case 'drone_turret':
        this._updateDroneTurret(obstacleGroup, deltaTime);
        break;
      case 'plasma_gate':
        this._updatePlasmaGate(obstacleGroup, deltaTime);
        break;
    }
  }

  _updateEnergyBarrier(group, deltaTime) {
    if (!group.userData.glowMesh) return;

    group.userData.animTime = (group.userData.animTime + deltaTime * 3) % (Math.PI * 2);
    
    // Pulsing glow effect
    const pulse = 0.1 + Math.sin(group.userData.animTime) * 0.08;
    group.userData.glowMesh.material.opacity = pulse;

    // Slight rotation for visual interest
    group.userData.glowMesh.scale.y = 1 + Math.sin(group.userData.animTime) * 0.08;
  }

  _updateDroneTurret(group, deltaTime) {
    // Rotate barrel
    const barrel = group.children[0]?.children?.find(c => c.userData?.isBarrel);
    if (barrel) {
      barrel.rotation.z += group.userData.rotationSpeed * deltaTime;
    }

    // Scan beam rotation
    const beam = group.children.find(c => c.userData?.isBeam);
    if (beam) {
      group.userData.scanAngle += group.userData.rotationSpeed * deltaTime;
      beam.rotation.z = group.userData.scanAngle;
    }

    // Danger light pulsing
    const lights = group.children.filter((c, i) => i >= 1 && i <= 2);
    lights.forEach(light => {
      light.scale.x = light.scale.y = light.scale.z = 0.8 + Math.sin(Date.now() * 0.005) * 0.3;
    });
  }

  _updatePlasmaGate(group, deltaTime) {
    group.userData.pulseTime += deltaTime * group.userData.pulseSpeed;
    
    // Pulsing effect
    const pulseValue = 0.5 + Math.sin(group.userData.pulseTime) * 0.5;
    
    if (group.userData.auraMesh) {
      group.userData.auraMesh.material.opacity = pulseValue * 0.15;
    }

    if (group.userData.plasmaMesh) {
      group.userData.plasmaMesh.material.opacity = 0.6 + pulseValue * 0.4;
    }
  }

  /**
   * Get all active sliding obstacles near player
   */
  getActiveSlidingObstacles(playerZ, obstacles, maxDistance = 120) {
    if (!obstacles) return [];
    
    return obstacles.filter(obs =>
      (obs.userData?.type === 'energy_barrier' ||
       obs.userData?.type === 'drone_turret' ||
       obs.userData?.type === 'plasma_gate') &&
      Math.abs(playerZ - (obs.position?.z || 0)) < maxDistance
    );
  }

  clearCollisionDebounce(obstacleId) {
    this.lastCollisions.delete(obstacleId);
  }
}

// ============================================================================
// EXPORT HELPER FUNCTIONS
// ============================================================================

export function createRandomSlidingObstacle(materials = {}) {
  const types = ['energy_barrier', 'drone_turret', 'plasma_gate'];
  const selectedType = types[Math.floor(Math.random() * types.length)];

  switch(selectedType) {
    case 'drone_turret':
      return SlidingObstacleSystem.createDroneTurret(materials);
    case 'plasma_gate':
      return SlidingObstacleSystem.createPlasmaGate(materials);
    case 'energy_barrier':
    default:
      return SlidingObstacleSystem.createEnergyBarrier(materials);
  }
}
