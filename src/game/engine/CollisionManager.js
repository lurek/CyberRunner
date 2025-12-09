import * as THREE from "three";
import { checkCollisionAABB } from "../../utils/collision.js";
import { checkSlideCollision } from "./CollisionFixes.js";
import { playSfx } from "../../utils/sound.js";
import { DestructibleObstacleManager } from "../systems/DestructibleObstacleManager.js";
import { BarObstacleSystem } from "../systems/BarObstacleSystem.js";
import { SlidingObstacleSystem } from "../systems/SlidingObstacleSystem.js";
import { UnavoidableObstacleSystem } from "../systems/UnavoidableObstacleSystem.js";
import audioManager from '../../utils/audio/AudioManager.js';

export class CollisionManager {
  constructor(scene, constants, comboSystem, timeScaleRef, onTriggerShake, entitySpawner, particleSystem, energyModeManager, grappleManager, jumpSafetySystem, characterStatsManager, abilityManager, playerController) {
    this.scene = scene;
    this.constants = constants;
    this.comboSystem = comboSystem;
    this.timeScaleRef = timeScaleRef;
    this.onTriggerShake = onTriggerShake;
    this.entitySpawner = entitySpawner;
    this.particleSystem = particleSystem;
    this.energyModeManager = energyModeManager;
    this.grappleManager = grappleManager;
    this.jumpSafetySystem = jumpSafetySystem;
    this.characterStatsManager = characterStatsManager;
    this.abilityManager = abilityManager; // ✨ NEW: For shield checks
    this.playerController = playerController;
    this.destructibleManager = new DestructibleObstacleManager(constants);
    this.barSystem = new BarObstacleSystem(constants);
    this.slidingObstacleSystem = new SlidingObstacleSystem(constants);
    this.unavoidableObstacleSystem = new UnavoidableObstacleSystem(constants);  // ✅ NEW

    // Defensive: last damage time to avoid accidental rapid/phantom hits
    this.lastDamageTimestamp = 0;
    this.damageCooldown = 0.18; // seconds
    // Expose last death/debug info for analytics and diagnostics
    this.lastDeathCause = null;
    this.lastDeathPosition = null;
    this.lastSpeed = 0;
  }

  checkObstacleCollisions(player, obstacles, instancedObstacles, propsRef, gameStatsRef, startGrace = 0) {
    if (!player) return;

    // 🔍 DEBUG: Log collision check info periodically
    if (!this._lastDebugLog || Date.now() - this._lastDebugLog > 2000) {
      const activeObstacles = obstacles?.filter(o => o && o.visible && o.active) || [];
      const activeInstanced = instancedObstacles?.filter(o => o && o.active) || [];
      console.log(`🔍 Collision Check Debug:`, {
        playerPos: { x: player.position.x.toFixed(1), y: player.position.y.toFixed(1), z: player.position.z.toFixed(1) },
        activeObstacles: activeObstacles.length,
        activeInstanced: activeInstanced.length,
        startGrace: startGrace.toFixed(2),
        jumpInvincible: this.jumpSafetySystem?.isInvincible?.() || false
      });
      if (activeObstacles.length > 0) {
        const nearest = activeObstacles.reduce((nearest, o) => {
          const dist = Math.abs(player.position.z - o.position.z);
          return dist < nearest.dist ? { dist, type: o.userData?.type, z: o.position.z } : nearest;
        }, { dist: Infinity });
        console.log(`🎯 Nearest obstacle:`, nearest);
      }
      this._lastDebugLog = Date.now();
    }

    // ✅ CRITICAL FIX: If player just landed (invincibility window active), skip collision checks
    // This prevents phantom damage when landing on obstacles that were spawned during flight
    if (this.jumpSafetySystem?.isInvincible?.()) {
      console.log('🛡️ Collision blocked: landing invincibility active');
      return;
    }

    // NOTE: startGrace is intentionally not used here to avoid skipping
    // legitimate collisions; initial grace is handled at spawn/engine level.
    // ✅ FIX: Respect startGrace for Revive mechanics (invulnerability window)
    if (startGrace > 0) return;

    if (!player.userData) player.userData = {};
    if (!player.userData.localBox) {
      player.userData.localBox = new THREE.Box3(
        new THREE.Vector3(-0.35, 0, -0.35),
        new THREE.Vector3(0.35, 1.8, 0.35)
      );
    }
    if (!player.userData.worldBox) player.userData.worldBox = new THREE.Box3();

    const playerWorldBox = player.userData.worldBox;
    // Use a modified local box when player is sliding so slide clearance logic can work reliably
    const isSlidingGlobal = this.playerController?.state?.isSliding || false;
    let localBoxToUse = player.userData.localBox && player.userData.localBox.clone ? player.userData.localBox.clone() : player.userData.localBox;
    if (isSlidingGlobal && localBoxToUse) {
      try {
        const min = localBoxToUse.min.clone();
        const max = localBoxToUse.max.clone();
        const centerX = (min.x + max.x) / 2;
        const halfWidth = 0.35;
        localBoxToUse.min.x = centerX - halfWidth;
        localBoxToUse.max.x = centerX + halfWidth;
        // Shrink height to sliding height (0.5m tall relative to local box base)
        localBoxToUse.max.y = min.y + 0.5;
      } catch (e) {
        // fallback to default local box
        localBoxToUse = player.userData.localBox;
      }
    }
    playerWorldBox.copy(localBoxToUse).applyMatrix4(player.matrixWorld);
    const playerZ = player.position.z;

    // 🔍 CRITICAL DEBUG: Log player worldBox position once per second
    if (!this._lastPlayerBoxLog || Date.now() - this._lastPlayerBoxLog > 1000) {
      console.log('📦 Player WorldBox:', {
        isEmpty: playerWorldBox.isEmpty(),
        min: { x: playerWorldBox.min.x.toFixed(1), y: playerWorldBox.min.y.toFixed(1), z: playerWorldBox.min.z.toFixed(1) },
        max: { x: playerWorldBox.max.x.toFixed(1), y: playerWorldBox.max.y.toFixed(1), z: playerWorldBox.max.z.toFixed(1) },
        playerPos: { x: player.position.x.toFixed(1), y: player.position.y.toFixed(1), z: player.position.z.toFixed(1) }
      });
      this._lastPlayerBoxLog = Date.now();
    }

    // --- 1. CHECK COMPLEX OBSTACLES ---
    if (obstacles) {
      for (let obstacle of obstacles) {
        if (!obstacle || !obstacle.visible || !obstacle.active) continue;
        if (Math.abs(playerZ - obstacle.position.z) > 120) continue;

        obstacle.updateMatrixWorld(true);

        if (!obstacle.userData.worldBox) obstacle.userData.worldBox = new THREE.Box3();

        const obstacleWorldBox = obstacle.userData.worldBox;
        if (obstacle.userData.localBox) {
          obstacleWorldBox.copy(obstacle.userData.localBox).applyMatrix4(obstacle.matrixWorld);
        } else {
          const box = new THREE.Box3().setFromObject(obstacle);
          obstacleWorldBox.copy(box);
        }

        const playerState = this.playerController?.state || {};
        const obstacleMetadata = obstacle.userData || {};

        // 🔍 DEBUG: Log when obstacle is close to player
        const distToObstacle = Math.abs(playerZ - obstacle.position.z);
        if (distToObstacle < 5) {
          console.log(`🎯 CLOSE OBSTACLE (${distToObstacle.toFixed(1)}m):`, {
            type: obstacle.userData?.type,
            playerBox: playerWorldBox ? { minY: playerWorldBox.min?.y?.toFixed(2), maxY: playerWorldBox.max?.y?.toFixed(2) } : 'null',
            obstBox: obstacleWorldBox ? { minY: obstacleWorldBox.min?.y?.toFixed(2), maxY: obstacleWorldBox.max?.y?.toFixed(2) } : 'null',
            intersects: playerWorldBox?.intersectsBox?.(obstacleWorldBox)
          });
        }

        const hasCollision = checkSlideCollision(playerWorldBox, obstacleWorldBox, playerState, obstacleMetadata);

        if (hasCollision) {
          console.log("💥 HITBOX COLLISION:", obstacle.userData.type);
          // Dump diagnostic info to help trace phantom collisions
          try {
            console.log('DEBUG_OBSTACLE:', {
              id: obstacle.userData?.id,
              type: obstacle.userData?.type,
              visible: obstacle.visible,
              active: obstacle.active,
              userData: obstacle.userData
            });
            console.log('PLAYER_WORLD_BOX:', playerWorldBox.min, playerWorldBox.max);
            console.log('OBSTACLE_WORLD_BOX:', obstacleWorldBox.min, obstacleWorldBox.max);
          } catch (e) {
            console.warn('Failed to dump obstacle debug info', e);
          }

          this.handleCollision(obstacle, player, propsRef, gameStatsRef);
          return;
        }

        // Distance Fallback
        if (!hasCollision && !obstacleMetadata.canSlideUnder && !obstacleMetadata.canJumpOver) {
          const dist = player.position.distanceTo(obstacle.position);
          if (dist < 1.5) {
            console.log("⚠️ DISTANCE COLLISION:", obstacle.userData.type);
            this.handleCollision(obstacle, player, propsRef, gameStatsRef);
            return;
          }
        }
      }
    }

    // --- 1.5. REMOVED: Old bar obstacle checks (bars no longer spawn) ---

    // --- 1.7. CHECK SLIDING OBSTACLES (energy_barrier, drone_turret, plasma_gate, tall_wall, bar_high, bar_low) ---
    if (obstacles) {
      for (let obstacle of obstacles) {
        const obsType = obstacle.userData?.type;
        // ✅ Updated: now includes tall_wall, bar_high, bar_low
        if (obsType !== 'energy_barrier' && obsType !== 'drone_turret' && obsType !== 'plasma_gate' &&
          obsType !== 'tall_wall' && obsType !== 'bar_high' && obsType !== 'bar_low') continue;
        if (Math.abs(playerZ - obstacle.position.z) > 120) continue;

        obstacle.updateMatrixWorld(true);

        const playerHeight = player.position.y;
        const isSliding = this.playerController?.state?.isSliding || false;  // ✅ Check if player is sliding

        // Use the obstacle's worldBox center Y (collision box center) so sliding
        // checks consider the actual barrier height (child meshes may be offset).
        let obstacleCenterY = 0;
        try {
          if (obstacle.userData?.worldBox) {
            const tmp = new THREE.Vector3();
            obstacle.userData.worldBox.getCenter(tmp);
            obstacleCenterY = tmp.y;
          } else {
            obstacleCenterY = obstacle.position.y || 0;
          }
        } catch (e) {
          obstacleCenterY = obstacle.position.y || 0;
        }

        const obstacleData = {
          position: { x: obstacle.position.x, y: obstacleCenterY, z: obstacle.position.z },
          id: obstacle.userData.id,
          type: obsType,
          userData: obstacle.userData
        };

        // ✅ Handle different obstacle types
        let collisionResult;
        if (obsType === 'tall_wall') {
          // Use UnavoidableObstacleSystem for tall walls
          collisionResult = this.unavoidableObstacleSystem.checkTallWallCollision(
            player.position,
            player.userData?.worldBox || new THREE.Box3(),
            obstacleData
          );
        } else if (obsType === 'bar_high' || obsType === 'bar_low') {
          // Bar obstacles: give NO DAMAGE if sliding
          const slidingCollisionResult = this.slidingObstacleSystem.checkSlidingObstacleCollision(
            player.position,
            playerHeight,
            obstacleData,
            obsType
          );
          // ✅ NEW: If player is sliding, grant no damage
          if (isSliding && slidingCollisionResult.zone === 'safe_slide') {
            collisionResult = { canSlide: true, damageAmount: 0, zone: 'safe_slide_under' };
          } else {
            collisionResult = slidingCollisionResult;
          }
        } else {
          // Standard sliding obstacles
          collisionResult = this.slidingObstacleSystem.checkSlidingObstacleCollision(
            player.position,
            playerHeight,
            obstacleData,
            obsType
          );
        }

        if (!collisionResult.canSlide) {
          console.log("⚡ SLIDING OBSTACLE HIT:", obsType, collisionResult);
          // Diagnostic dump for sliding obstacles
          try {
            console.log('DEBUG_SLIDING_OBSTACLE:', {
              id: obstacle.userData?.id,
              type: obsType,
              visible: obstacle.visible,
              active: obstacle.active,
              userData: obstacle.userData
            });
            const tempBox = obstacle.userData?.worldBox || new THREE.Box3().setFromObject(obstacle);
            console.log('OBSTACLE_WORLD_BOX:', tempBox.min, tempBox.max);
          } catch (e) {
            console.warn('Failed to dump sliding obstacle info', e);
          }

          // EXTRA SAFETY: verify actual AABB overlap between player and obstacle
          try {
            const obsWorldBox = obstacle.userData?.worldBox || new THREE.Box3().setFromObject(obstacle);
            if (!playerWorldBox.intersectsBox(obsWorldBox)) {
              console.log('IGNORED SLIDING COLLISION: no AABB overlap', { type: obsType, playerCenterY: player.position.y, obsBoxMin: obsWorldBox.min, obsBoxMax: obsWorldBox.max });
            } else {
              this.handleSlidingObstacleCollision(obstacle, player.position, collisionResult, propsRef, gameStatsRef);
            }
          } catch (e) {
            console.warn('Error during sliding AABB check, falling back to handle', e);
            this.handleSlidingObstacleCollision(obstacle, player.position, collisionResult, propsRef, gameStatsRef);
          }
          return;
        } else if (collisionResult.feedback === 'success' || collisionResult.zone === 'safe_slide_under') {
          // ✅ FIX: Only award bonus ONCE per obstacle (check if already rewarded)
          if (!obstacle.userData.slideRewardGiven) {
            obstacle.userData.slideRewardGiven = true;
            console.log("✅ SUCCESSFUL SLIDE UNDER:", obsType);
            if (gameStatsRef.current) gameStatsRef.current.score += 30; // Bonus points for slide
            this.comboSystem?.onNearMiss(performance.now() / 1000, 0.5);
          }
        }
      }
    }

    // --- 2. CHECK INSTANCED OBSTACLES ---
    if (instancedObstacles) {
      for (let obstData of instancedObstacles) {
        if (!obstData || !obstData.active) continue;
        if (Math.abs(playerZ - obstData.position.z) > 120) continue;

        const obstacleWorldBox = new THREE.Box3();
        // ✅ FIX: Check for localBox in both locations (instanced obstacles store it directly)
        const obstLocalBox = obstData.localBox || obstData.userData?.localBox;
        if (obstLocalBox) {
          const tempMatrix = new THREE.Matrix4();
          tempMatrix.makeTranslation(obstData.position.x, obstData.position.y, obstData.position.z);
          obstacleWorldBox.copy(obstLocalBox).applyMatrix4(tempMatrix);
        } else {
          const sizeMap = {
            'box': new THREE.Vector3(0.9, 1.5, 0.9),
            'spike': new THREE.Vector3(0.7, 1.2, 0.7),
            'barrier': new THREE.Vector3(3.0, 0.8, 0.4)
          };
          const size = sizeMap[obstData.type] || new THREE.Vector3(0.8, 1.0, 0.6);
          obstacleWorldBox.setFromCenterAndSize(obstData.position, size);
        }

        const playerState = this.playerController?.state || {};
        const obstacleMetadata = obstData.userData || obstData;

        // 🔍 DEBUG: Log when instanced obstacle is close to player
        const distToObstacle = Math.abs(playerZ - obstData.position.z);
        if (distToObstacle < 5) {
          console.log(`🎯 CLOSE INSTANCED (${distToObstacle.toFixed(1)}m):`, {
            type: obstData.type,
            playerBox: playerWorldBox ? { minY: playerWorldBox.min?.y?.toFixed(2), maxY: playerWorldBox.max?.y?.toFixed(2) } : 'null',
            obstBox: { minY: obstacleWorldBox.min?.y?.toFixed(2), maxY: obstacleWorldBox.max?.y?.toFixed(2) },
            intersects: playerWorldBox?.intersectsBox?.(obstacleWorldBox)
          });
        }

        const hasCollision = checkSlideCollision(playerWorldBox, obstacleWorldBox, playerState, obstacleMetadata);

        if (hasCollision) {
          // Before applying collision, perform safety checks and dump metadata
          // Compute world box size and skip if zero (hidden/placeholder)
          const sizeVec = new THREE.Vector3();
          obstacleWorldBox.getSize(sizeVec);
          if (sizeVec.x < 0.01 || sizeVec.y < 0.01 || sizeVec.z < 0.01) {
            console.log('SKIP INSTANCED COLLISION: zero-size worldBox', { type: obstData.type, id: obstData.id, size: sizeVec });
            continue;
          }

          console.log("💥 INSTANCED HITBOX COLLISION:", obstData.type);
          try {
            console.log('DEBUG_INSTANCED:', {
              id: obstData.id,
              type: obstData.type,
              active: obstData.active,
              visible: obstData.visible,
              userData: obstData.userData,
              position: obstData.position
            });
            console.log('PLAYER_WORLD_BOX:', playerWorldBox.min, playerWorldBox.max);
            console.log('INSTANCED_OBSTACLE_WORLD_BOX:', obstacleWorldBox.min, obstacleWorldBox.max);
          } catch (e) {
            console.warn('Failed to dump instanced obstacle debug info', e);
          }

          this.handleCollision(obstData, player, propsRef, gameStatsRef);
          return;
        }

        if (!hasCollision && !obstacleMetadata.canSlideUnder) {
          const dx = Math.abs(player.position.x - obstData.position.x);
          const dz = Math.abs(playerZ - obstData.position.z);
          if (dx < 0.8 && dz < 0.8) {
            if (player.position.y < 1.0) {
              console.log("⚠️ INSTANCED FALLBACK COLLISION:", obstData.type);
              this.handleCollision(obstData, player, propsRef, gameStatsRef);
              return;
            }
          }
        }
      }
    }

    // --- 3. REMOVED: Duplicate bar obstacle check (no longer needed) ---
  }

  handleBarCollision(barObstacle, playerPos, collisionInfo, propsRef, gameStatsRef) {
    const shieldActive = propsRef.current.shieldActive;
    const energyInvincible = this.energyModeManager?.isInvincible?.();
    const isInvincible = shieldActive || energyInvincible;

    if (isInvincible) {
      this.particleSystem?.spawn('impact', barObstacle.position, { r: 0, g: 1, b: 1 });
      playSfx('shield_hit', propsRef.current.sfxOn);
      audioManager.play('shield_block');
      if (shieldActive) {
        propsRef.current.onPowerUp?.('shield', false);
      }
    } else {
      audioManager.play('crash');
      gameStatsRef.current.health = Math.max(
        0,
        gameStatsRef.current.health - collisionInfo.damageAmount
      );
      this.onTriggerShake?.(0.7);
      this.particleSystem?.spawn('impact', barObstacle.position, { r: 1, g: 0, b: 0 });
      playSfx('crash', propsRef.current.sfxOn);

      if (gameStatsRef.current.health <= 0) {
        // Record death metadata for analytics
        try {
          this.lastDeathCause = obstacle.userData?.type || 'bar_collision';
          this.lastDeathPosition = { x: obstacle.position.x, y: obstacle.position.y, z: obstacle.position.z } || { x: playerPos.x, y: playerPos.y, z: playerPos.z };
          this.lastSpeed = this.playerController?.speed || 0;
          try { window.gameEngine = window.gameEngine || {}; window.gameEngine.lastDeathCause = this.lastDeathCause; window.gameEngine.lastDeathPosition = this.lastDeathPosition; window.gameEngine.lastSpeed = this.lastSpeed; } catch (e) { }
        } catch (e) { }
        audioManager.play('game_over');
        propsRef.current.onGameOver(gameStatsRef.current);
      }
    }

    this.disableObstacle(barObstacle);
  }

  handleSlidingObstacleCollision(obstacle, playerPos, collisionInfo, propsRef, gameStatsRef) {
    const shieldActive = propsRef.current.shieldActive;
    const energyInvincible = this.energyModeManager?.isInvincible?.();
    const jumpSafetyInvincible = this.jumpSafetySystem?.isInvincible?.() || false;
    const isInvincible = shieldActive || energyInvincible || jumpSafetyInvincible;

    if (isInvincible) {
      this.particleSystem?.spawn('impact', obstacle.position, { r: 0, g: 1, b: 1 });
      playSfx('shield_hit', propsRef.current.sfxOn);
      audioManager.play('shield_block');
      if (shieldActive) {
        propsRef.current.onPowerUp?.('shield', false);
      }
      if (jumpSafetyInvincible) {
        console.log('🛡️ Sliding obstacle blocked: landing invincibility');
      }
    } else {
      audioManager.play('crash');
      // Apply damage from sliding obstacle collision
      const damageAmount = collisionInfo.damageAmount || 20;
      gameStatsRef.current.health = Math.max(
        0,
        gameStatsRef.current.health - damageAmount
      );

      // Visual and audio feedback
      this.onTriggerShake?.(0.6);

      // Different particle colors based on obstacle type
      const particleColor = obstacle.userData?.type === 'energy_barrier' ? { r: 0, g: 1, b: 1 } :
        obstacle.userData?.type === 'plasma_gate' ? { r: 0.6, g: 0, b: 1 } :
          { r: 1, g: 0.4, b: 0 }; // drone_turret (orange)

      this.particleSystem?.spawn('impact', obstacle.position, particleColor);

      // Play appropriate sound
      const hitSound = obstacle.userData?.hitSound || 'crash';
      playSfx(hitSound, propsRef.current.sfxOn);

      if (gameStatsRef.current.health <= 0) {
        // Record death metadata for analytics
        try {
          this.lastDeathCause = obstacle.userData?.type || 'sliding_obstacle_collision';
          this.lastDeathPosition = { x: obstacle.position.x, y: obstacle.position.y, z: obstacle.position.z } || { x: playerPos.x, y: playerPos.y, z: playerPos.z };
          this.lastSpeed = this.playerController?.speed || 0;
          try { window.gameEngine = window.gameEngine || {}; window.gameEngine.lastDeathCause = this.lastDeathCause; window.gameEngine.lastDeathPosition = this.lastDeathPosition; window.gameEngine.lastSpeed = this.lastSpeed; } catch (e) { }
        } catch (e) { }
        audioManager.play('game_over');
        propsRef.current.onGameOver(gameStatsRef.current);
      }
    }

    this.disableObstacle(obstacle);
  }

  handleCollision(obstacle, player, propsRef, gameStatsRef) {
    const type = obstacle.userData?.type || obstacle.type || 'unknown';

    // Defensive guards: ensure obstacle and player positions make sense
    const now = performance.now() / 1000;
    if (now - this.lastDamageTimestamp < this.damageCooldown) {
      console.warn('Skipping collision: within damage cooldown');
      return;
    }

    if (!obstacle || !obstacle.position) {
      console.warn('Skipping collision: invalid obstacle');
      return;
    }

    // Do not perform an extra Z-distance guard here — collision detection
    // already validated overlap via hitboxes. Removing this guard fixes
    // missed damage when objects' reported positions differ slightly.

    // 1. HOVERBOARD IMMUNITY
    const isHoverboardActive = this.playerController?.state?.hoverboardMode || false;
    const isGroundObstacle = type === 'barrier' || type === 'spike' || obstacle.position.y < 0.5;

    if (isHoverboardActive && isGroundObstacle) {
      console.log("🛹 HOVERBOARD SAVED YOU");
      return;
    }

    // 2. INVINCIBILITY CHECK
    const shieldActive = propsRef.current.shieldActive;
    const energyInvincible = this.energyModeManager?.isInvincible() || false;
    const grappleInvincible = this.grappleManager?.isPlayerInvincible?.() || false;
    const jumpSafetyInvincible = this.jumpSafetySystem?.isInvincible?.() || false;
    const abilityShielded = this.abilityManager?.isShielded?.() || false; // ✨ NEW: Check ability shield

    const isInvincible = shieldActive || energyInvincible || grappleInvincible || jumpSafetyInvincible || abilityShielded;

    if (isInvincible) {
      this.particleSystem?.spawn('impact', obstacle.position || obstacle, { r: 0, g: 1, b: 1 });
      playSfx('shield_hit', propsRef.current.sfxOn);
      audioManager.play('shield_block');

      if (shieldActive && !energyInvincible) {
        propsRef.current.onPowerUp?.('shield', false);
      }

      // ✨ NEW: Deactivate ability shield if it was used
      if (abilityShielded) {
        this.abilityManager?.deactivateShield?.();
        console.log("🛡️ Ability Shield: Absorbed collision and deactivated");
      }
      console.log("🛡️ BLOCKED DAMAGE:", { type, shieldActive, energyInvincible, jumpSafetyInvincible, abilityShielded });
      // mark last damage time so we don't immediately re-apply
      this.lastDamageTimestamp = now;
    } else {
      console.log("🩸 TAKING DAMAGE from:", type);
      gameStatsRef.current.health = Math.max(0, gameStatsRef.current.health - 25);
      this.lastDamageTimestamp = now;
      this.onTriggerShake?.(1.0);
      this.particleSystem?.spawn('impact', obstacle.position || obstacle, { r: 1, g: 0, b: 0 });
      playSfx('crash', propsRef.current.sfxOn);
      audioManager.play('crash');

      if (this.playerController) {
        this.playerController.resetToLane();
      }

      if (this.particleSystem?.particles?.length > 500) {
        const toRemove = this.particleSystem.particles.length - 400;
        this.particleSystem.particles.splice(0, toRemove);
      }

      if (this.comboSystem) {
        this.comboSystem.onHit();
      }

      if (gameStatsRef.current.health <= 0) {
        // Record death metadata for analytics
        try {
          this.lastDeathCause = type || 'obstacle_collision';
          this.lastDeathPosition = { x: player.position.x, y: player.position.y, z: player.position.z };
          this.lastSpeed = this.playerController?.speed || 0;
          // Expose for external access (debug/analytics hook)
          try { window.gameEngine = window.gameEngine || {}; window.gameEngine.lastDeathCause = this.lastDeathCause; window.gameEngine.lastDeathPosition = this.lastDeathPosition; window.gameEngine.lastSpeed = this.lastSpeed; } catch (e) { }
        } catch (e) { /* non-fatal */ }
        audioManager.play('game_over');
        propsRef.current.onGameOver(gameStatsRef.current);
      }
    }

    this.disableObstacle(obstacle);
  }

  disableObstacle(obstacle) {
    obstacle.active = false;
    if (obstacle.visible !== undefined) obstacle.visible = false;
    if (obstacle.type) {
      this.entitySpawner?.hideInstancedObstacle(obstacle, obstacle.type);
    }
  }

  checkCoinCollisions(player, coins, propsRef, gameStatsRef, coinSparkles, multiplier = 1.0) {
    if (!coins) return;
    const playerZ = player.position.z;
    const magnetActive = propsRef.current.isMagnetActive;
    // ✅ FIX: Apply character's magnet radius modifier (e.g., SWAT = 1.1x)
    const baseMagnetRange = this.constants.PLAYER.MAGNET_RADIUS || 8;
    const characterMagnetRange = this.characterStatsManager?.getModifiedMagnetRadius?.(baseMagnetRange) || baseMagnetRange;
    const magnetRange = magnetActive ? (characterMagnetRange * 2.5) : Math.max(1.5, characterMagnetRange * 0.19);

    for (let coin of coins) {
      if (!coin.active || Math.abs(playerZ - coin.position.z) > 40) continue;
      const distance = player.position.distanceTo(coin.position);
      if (magnetActive && distance < magnetRange) coin.position.lerp(player.position, 0.25);
      if (distance < 2.2) this.collectCoin(coin, propsRef, gameStatsRef, coinSparkles, multiplier);
    }
  }

  collectCoin(coin, propsRef, gameStatsRef, coinSparkles, multiplier = 1.0) {
    coin.active = false;
    this.entitySpawner?.hideInstancedCoin(coin);
    coinSparkles?.removeCoin(coin);
    const comboData = this.comboSystem?.onCoinCollect(performance.now() / 1000);
    const coinValue = (propsRef.current.multiplier || 1) * (comboData?.multiplier || 1) * multiplier;
    gameStatsRef.current.coins += Math.floor(coinValue);
    gameStatsRef.current.score += (10 * Math.floor(coinValue));
    this.particleSystem?.spawn('coin', coin.position);
    playSfx('coin', propsRef.current.sfxOn);
    audioManager.play('coin');
    this.energyModeManager?.onCoinCollect();
  }

  checkPowerUpCollisions(player, powerUps, propsRef, gameStatsRef, powerUpAuras) {
    if (!powerUps || !player.userData.worldBox) return;
    const playerWorldBox = player.userData.worldBox;
    for (let pu of powerUps) {
      if (!pu.visible || !pu.active) continue;
      if (!pu.userData) pu.userData = {};
      if (!pu.userData.worldBox) pu.userData.worldBox = new THREE.Box3().setFromObject(pu);
      const puWorldBox = pu.userData.worldBox;
      if (pu.userData.localBox) puWorldBox.copy(pu.userData.localBox).applyMatrix4(pu.matrixWorld);
      else puWorldBox.setFromObject(pu);

      let hit = checkCollisionAABB(playerWorldBox, puWorldBox);
      if (!hit && player.position.distanceTo(pu.position) < 2.5) hit = true;

      if (hit) {
        pu.visible = false;
        pu.active = false;
        powerUpAuras?.removePowerUp(pu);
        this.particleSystem?.spawn('powerup', pu.position);
        playSfx('powerup', propsRef.current.sfxOn);
        audioManager.play('powerup');

        const type = pu.userData.type;

        if (type === 'health') {
          gameStatsRef.current.health = Math.min(100, gameStatsRef.current.health + 25);
          console.log('❤️ Health collected: +25 HP');
        }

        // Trigger the power-up callback
        propsRef.current.onPowerUp?.(type, true);
      }
    }
  }

  checkNearMisses(player, obstacles, instancedObstacles, gameStatsRef, propsRef) {
    const playerPos = player.position;
    const checkNearMissFor = (obst) => {
      if (!obst || !obst.active) return;
      if (Math.abs(playerPos.z - obst.position.z) < 0.5) {
        const latDist = Math.abs(playerPos.x - obst.position.x);
        if (latDist > 0.8 && latDist < 2.2) {
          let alreadyChecked = false;
          if (obst.userData && typeof obst.userData.nearMissChecked !== 'undefined') alreadyChecked = obst.userData.nearMissChecked;
          else if (typeof obst.nearMissChecked !== 'undefined') alreadyChecked = obst.nearMissChecked;

          if (!alreadyChecked) {
            if (obst.userData) obst.userData.nearMissChecked = true;
            else obst.nearMissChecked = true;
            if (gameStatsRef.current) gameStatsRef.current.score += 20;
            this.comboSystem?.onNearMiss(performance.now() / 1000, latDist);
          }
        }
      }
    };
    if (obstacles) obstacles.forEach(o => checkNearMissFor(o));
    if (instancedObstacles) instancedObstacles.forEach(o => checkNearMissFor(o));
  }

  dispose() { }
}