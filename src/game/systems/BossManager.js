/**
 * Boss Manager - Phase 4
 * Creates epic boss encounters with unique mechanics
 */

import * as THREE from "three";

export class BossManager {
  constructor(constants, scene) {
    this.constants = constants;
    this.scene = scene;
    this.currentBoss = null;
    this.bossPhase = 0;
    this.bossHealth = 0;
    this.maxBossHealth = 0;
    this.bossActive = false;
    this.bossDefeated = false;
    this.bossTimer = 0;
    this.attackTimer = 0;
    this.nextAttackTime = 0;
    this.bossType = null;
    
    // Boss geometries and materials
    this.initializeBossAssets();
  }

  initializeBossAssets() {
    // Create reusable geometries for bosses
    this.geometries = {
      core: new THREE.IcosahedronGeometry(2, 2),
      shield: new THREE.SphereGeometry(3, 16, 16),
      spike: new THREE.ConeGeometry(0.5, 2, 8),
      ring: new THREE.TorusGeometry(4, 0.3, 8, 32),
      orb: new THREE.SphereGeometry(1.5, 12, 12),
      beam: new THREE.CylinderGeometry(0.3, 0.3, 30, 12)
    };

    this.materials = {
      boss1: new THREE.MeshStandardMaterial({
        color: 0xff0066,
        emissive: 0xff0066,
        emissiveIntensity: 1.0,
        metalness: 1.0,
        roughness: 0.2
      }),
      boss2: new THREE.MeshStandardMaterial({
        color: 0x6600ff,
        emissive: 0x6600ff,
        emissiveIntensity: 1.0,
        metalness: 1.0,
        roughness: 0.2
      }),
      boss3: new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 1.0,
        metalness: 1.0,
        roughness: 0.2
      }),
      shield: new THREE.MeshStandardMaterial({
        color: 0x5b8fc7,
        emissive: 0x5b8fc7,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      }),
      attack: new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7
      })
    };
  }

  /**
   * Spawn a boss encounter
   */
  spawnBoss(playerPosition, difficulty) {
    if (this.bossActive) return;

    // Select boss type based on difficulty
    const bossTypes = ['spinner', 'laser', 'swarm'];
    this.bossType = bossTypes[Math.min(Math.floor(difficulty * 3), 2)];
    
    this.bossActive = true;
    this.bossDefeated = false;
    this.bossPhase = 1;
    this.maxBossHealth = 10 + Math.floor(difficulty * 10);
    this.bossHealth = this.maxBossHealth;
    this.bossTimer = 0;
    this.attackTimer = 0;
    this.nextAttackTime = 2.0;

    // Create boss visual
    this.currentBoss = this.createBossVisual(this.bossType, playerPosition);
    this.scene.add(this.currentBoss);

    console.log(`👹 Boss spawned: ${this.bossType} (Health: ${this.maxBossHealth})`);

    return {
      type: this.bossType,
      health: this.bossHealth,
      maxHealth: this.maxBossHealth
    };
  }

  createBossVisual(type, playerPosition) {
    const boss = new THREE.Group();
    boss.name = "boss";
    boss.position.set(0, 3, playerPosition.z - 40);
    boss.userData.type = type;
    boss.userData.attacks = [];

    switch(type) {
      case 'spinner':
        // Spinning core with rotating blades
        const core = new THREE.Mesh(this.geometries.core, this.materials.boss1);
        boss.add(core);

        for (let i = 0; i < 4; i++) {
          const spike = new THREE.Mesh(this.geometries.spike, this.materials.boss1);
          const angle = (i / 4) * Math.PI * 2;
          spike.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
          spike.rotation.z = -angle;
          boss.add(spike);
        }
        break;

      case 'laser':
        // Laser cannon boss
        const laserCore = new THREE.Mesh(this.geometries.orb, this.materials.boss2);
        boss.add(laserCore);

        const ring1 = new THREE.Mesh(this.geometries.ring, this.materials.boss2);
        ring1.rotation.x = Math.PI / 2;
        boss.add(ring1);

        const ring2 = new THREE.Mesh(this.geometries.ring, this.materials.boss2);
        ring2.rotation.z = Math.PI / 2;
        ring2.scale.set(0.8, 0.8, 0.8);
        boss.add(ring2);
        break;

      case 'swarm':
        // Swarm controller with orbiting drones
        const swarmCore = new THREE.Mesh(this.geometries.core, this.materials.boss3);
        swarmCore.scale.set(1.5, 1.5, 1.5);
        boss.add(swarmCore);

        for (let i = 0; i < 6; i++) {
          const orb = new THREE.Mesh(this.geometries.orb, this.materials.boss3);
          orb.scale.set(0.5, 0.5, 0.5);
          const angle = (i / 6) * Math.PI * 2;
          orb.position.set(Math.cos(angle) * 4, Math.sin(angle) * 2, 0);
          orb.userData.orbitAngle = angle;
          boss.add(orb);
        }
        break;
    }

    return boss;
  }

  /**
   * Update boss behavior
   */
  update(deltaTime, playerPosition) {
    if (!this.bossActive || !this.currentBoss) return null;

    this.bossTimer += deltaTime;
    this.attackTimer += deltaTime;

    // Update boss position (hover in front of player)
    const targetZ = playerPosition.z - 35;
    this.currentBoss.position.z += (targetZ - this.currentBoss.position.z) * 0.02;

    // Update boss visuals
    this.updateBossVisuals(deltaTime);

    // Generate attacks
    if (this.attackTimer >= this.nextAttackTime && !this.bossDefeated) {
      const attack = this.generateAttack(playerPosition);
      this.attackTimer = 0;
      this.nextAttackTime = 1.5 + Math.random() * 1.5;
      return attack;
    }

    // Update existing attacks
    this.updateAttacks(deltaTime, playerPosition);

    return null;
  }

  updateBossVisuals(deltaTime) {
    if (!this.currentBoss) return;

    const type = this.currentBoss.userData.type;
    
    switch(type) {
      case 'spinner':
        // Rotate the entire boss
        this.currentBoss.rotation.y += deltaTime * 2;
        // Pulse emissive
        const core = this.currentBoss.children[0];
        if (core && core.material) {
          core.material.emissiveIntensity = 1.0 + Math.sin(this.bossTimer * 3) * 0.5;
        }
        break;

      case 'laser':
        // Rotate rings
        this.currentBoss.children[1].rotation.z += deltaTime * 1.5;
        this.currentBoss.children[2].rotation.x += deltaTime * -2;
        break;

      case 'swarm':
        // Orbit drones
        for (let i = 1; i < this.currentBoss.children.length; i++) {
          const orb = this.currentBoss.children[i];
          orb.userData.orbitAngle += deltaTime * 1.5;
          const angle = orb.userData.orbitAngle;
          const radius = 4 + Math.sin(this.bossTimer * 2) * 0.5;
          orb.position.x = Math.cos(angle) * radius;
          orb.position.z = Math.sin(angle) * radius;
          orb.position.y = Math.sin(angle * 2) * 2;
        }
        break;
    }
  }

  // ✅ FIX #25: Boss attack pattern definitions
  getBossPatterns(type) {
    const patterns = {
      spinner: {
        AGGRESSIVE: [
          { count: 3, delay: 0, type: 'moving_barrier' },
          { count: 2, delay: 0.3, type: 'moving_barrier' }
        ],
        DEFENSIVE: [
          { count: 2, delay: 0, type: 'moving_barrier' }
        ],
        RANDOM: () => Math.random() > 0.5 ? 
          [{ count: Math.floor(Math.random() * 4 + 1), delay: 0, type: 'moving_barrier' }] :
          [{ count: 2, delay: 0, type: 'moving_barrier' }, { count: 1, delay: 0.2, type: 'moving_barrier' }]
      },
      laser: {
        AGGRESSIVE: [
          { count: 2, delay: 0, type: 'laser_grid' },
          { count: 1, delay: 0.4, type: 'laser_grid' }
        ],
        DEFENSIVE: [
          { count: 1, delay: 0, type: 'laser_grid' }
        ],
        RANDOM: () => Math.random() > 0.6 ? 
          [{ count: 1, delay: 0, type: 'laser_grid' }] :
          [{ count: 2, delay: 0.2, type: 'laser_grid' }]
      },
      swarm: {
        AGGRESSIVE: [
          { count: 3, delay: 0, type: 'drone' },
          { count: 2, delay: 0.2, type: 'drone' }
        ],
        DEFENSIVE: [
          { count: 1, delay: 0, type: 'drone' }
        ],
        RANDOM: () => [{ count: Math.floor(Math.random() * 3 + 1), delay: Math.random() * 0.3, type: 'drone' }]
      }
    };
    return patterns[type] || {};
  }

  generateAttack(playerPosition) {
    if (!this.currentBoss) return null;

    const type = this.currentBoss.userData.type;
    const attacks = [];
    
    // ✅ FIX #25: Pick random pattern
    const patterns = this.getBossPatterns(type);
    const patternNames = Object.keys(patterns);
    const selectedPattern = patternNames[Math.floor(Math.random() * patternNames.length)];
    const pattern = patterns[selectedPattern];
    
    if (!pattern) return attacks;
    
    // Execute selected pattern
    const attacks_data = typeof pattern === 'function' ? pattern() : pattern;
    
    attacks_data.forEach(attack => {
      for (let i = 0; i < attack.count; i++) {
        setTimeout(() => {
          // ✅ FIX #25: Randomize lanes for variety
          const randomLane = Math.floor(Math.random() * 3);
          attacks.push({
            type: attack.type,
            lane: randomLane,
            z: this.currentBoss.position.z - (10 + Math.random() * 5),
            data: { pattern: selectedPattern }
          });
        }, attack.delay * 1000);
      }
    });
    
    console.log(`🤖 Boss ${type}: ${selectedPattern} pattern`);
    return attacks;
  }

  updateAttacks(deltaTime, playerPosition) {
    // Update any special attack visuals here if needed
  }

  /**
   * Damage the boss
   */
  damageBoss(amount = 1) {
    if (!this.bossActive || this.bossDefeated) return false;

    this.bossHealth -= amount;

    // Boss phase transitions
    if (this.bossHealth <= this.maxBossHealth * 0.66 && this.bossPhase === 1) {
      this.bossPhase = 2;
      this.nextAttackTime *= 0.8; // Attack faster
    }
    if (this.bossHealth <= this.maxBossHealth * 0.33 && this.bossPhase === 2) {
      this.bossPhase = 3;
      this.nextAttackTime *= 0.7; // Attack even faster
    }

    if (this.bossHealth <= 0) {
      this.defeatBoss();
      return true; // Boss defeated
    }

    return false;
  }

  defeatBoss() {
    this.bossDefeated = true;
    this.bossActive = false;

    if (this.currentBoss) {
      // Explosion effect (simple scale animation)
      const explosionDuration = 1.0;
      const startTime = performance.now();
      
      const animateExplosion = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed < explosionDuration && this.currentBoss) {
          const scale = 1 + (elapsed / explosionDuration) * 3;
          this.currentBoss.scale.set(scale, scale, scale);
          this.currentBoss.traverse(child => {
            if (child.material) {
              child.material.opacity = 1 - (elapsed / explosionDuration);
            }
          });
          requestAnimationFrame(animateExplosion);
        } else {
          this.removeBoss();
        }
      };
      animateExplosion();
    }

    console.log('🎉 Boss defeated!');
  }

  removeBoss() {
    if (this.currentBoss) {
      this.scene.remove(this.currentBoss);
      this.currentBoss = null;
    }
  }

  /**
   * Get boss state for UI
   */
  getBossState() {
    if (!this.bossActive) return null;

    return {
      active: this.bossActive,
      type: this.bossType,
      health: this.bossHealth,
      maxHealth: this.maxBossHealth,
      phase: this.bossPhase,
      healthPercent: (this.bossHealth / this.maxBossHealth) * 100
    };
  }

  /**
   * Check if player can damage boss (by shooting coins at it or near miss)
   */
  checkBossDamage(playerPosition, gameStats) {
    if (!this.bossActive || this.bossDefeated || !this.currentBoss) return false;

    // Check if player is close enough and has combo
    const distance = Math.abs(playerPosition.z - this.currentBoss.position.z);
    
    // Damage boss if player has a high combo (10+) and is close
    if (distance < 20 && gameStats.combo >= 10) {
      // Small chance to damage boss per frame when conditions are met
      if (Math.random() < 0.02) { // 2% chance per frame = ~1 hit per second at 60fps
        return this.damageBoss(1);
      }
    }

    return false;
  }

  reset() {
    this.removeBoss();
    this.bossActive = false;
    this.bossDefeated = false;
    this.bossPhase = 0;
    this.bossHealth = 0;
    this.bossTimer = 0;
  }

  dispose() {
    this.removeBoss();
    Object.values(this.geometries).forEach(g => g.dispose());
    Object.values(this.materials).forEach(m => m.dispose());
  }
}
