import * as THREE from 'three';
import { improveSlideHitbox } from './CollisionFixes.js';

export class PlayerController {
  constructor(player, constants, grappleManager, jumpSafetySystem, statsManager) {
    this.player = player;
    this.CONSTANTS = constants;
    this.grappleManager = grappleManager;
    this.jumpSafetySystem = jumpSafetySystem;
    this.statsManager = statsManager;

    this.state = {
      currentLane: 1,
      targetLane: 1,
      verticalVelocity: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      isGrappling: false,
      jumpCount: 0,
      originalBoxHeight: null
    };

    this.laneWidth = constants.LANE_WIDTH;
    this.GRAPPLE_EXIT_VELOCITY_MULTIPLIER = 0.5;
    this.MAX_DELTA_TIME = 0.1;
  }

  changeLane(direction, sfxEnabled) {
    if (this.state.isGrappling) return false;

    // Block lane change only if landing very hard/fast
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

  jump(sfxEnabled, currentSpeed) {
    if (!this.player) return false;
    if (this.state.isGrappling) return false;

    const maxJumps = this.statsManager?.getMaxJumps?.() || 1;

    if (this.state.jumpCount < maxJumps) {
      // ✅ FIX: Apply character's jump height modifier (e.g., Kachujin = 1.08x)
      const baseJumpForce = this.CONSTANTS.PHYSICS.JUMP_FORCE;
      let jumpForce = this.statsManager?.getModifiedJumpVelocity?.(baseJumpForce) || baseJumpForce;
      if (this.state.jumpCount > 0) jumpForce *= 0.85;

      this.state.verticalVelocity = jumpForce;
      this.state.isJumping = true;
      this.state.isSliding = false;
      this.state.jumpCount++;

      if (this.jumpSafetySystem?.recordJump) {
        this.jumpSafetySystem.recordJump(this.player.position, currentSpeed);
      }

      if (this.player) {
        if (!this.player.userData) this.player.userData = {};
        this.player.userData.isSliding = false;
        // restore hitbox when leaving jump
        improveSlideHitbox(this.player, false);
        if (!this.player.userData?.isGLB) {
          this.player.scale.y = 1;
        }
      }
      return true;
    }
    return false;
  }

  slide(sfxEnabled) {
    if (!this.player) return false;
    if (this.state.isGrappling) return false;

    if (this.state.isSliding) {
      this.state.isSliding = false;
      this.state.slideTimer = 0;
      if (this.player) {
        if (!this.player.userData) this.player.userData = {};
        this.player.userData.isSliding = false;
        // restore hitbox when slide ends
        improveSlideHitbox(this.player, false);
        if (!this.player.userData?.isGLB) this.player.scale.y = 1;
      }
      return false;
    }

    if (!this.state.isSliding) {
      this.state.isSliding = true;
      this.state.slideTimer = this.CONSTANTS.PHYSICS.SLIDE_DURATION;

      if (this.state.isJumping) {
        this.state.verticalVelocity = -this.CONSTANTS.PHYSICS.GRAVITY * 1.5;
      }

      // ✅ FIXED: Only squeezing for non-GLB models
      // GLB models use Anim_slide animation for proper visual
      if (this.player) {
        if (!this.player.userData) this.player.userData = {};
        this.player.userData.isSliding = true;
        // tighten hitbox for sliding so player can pass under bars
        improveSlideHitbox(this.player, true);
        if (!this.player.userData?.isGLB) this.player.scale.y = 0.5;
      }
      return true;
    }
    return false;
  }

  update(dt, speed, gameSpeed, lanePositions) {
    if (!this.player) return;
    dt = Math.min(dt, this.MAX_DELTA_TIME);

    // Forward Movement
    if (gameSpeed) {
      this.player.position.z -= gameSpeed * 60 * dt;
    }

    // Grapple Logic
    if (this.grappleManager?.isActive && !this.state.isGrappling) {
      this.state.isGrappling = true;
    }

    if (this.state.isGrappling) {
      if (this.grappleManager?.updatePosition) {
        const grapplePos = this.grappleManager.updatePosition(dt, this.player.position);
        if (grapplePos) {
          this.player.position.copy(grapplePos);
        } else {
          this.state.isGrappling = false;
          this.state.currentLane = this.grappleManager.getLastTargetLane();
          this.state.targetLane = this.state.currentLane;
          this.player.position.x = lanePositions[this.state.currentLane];
          this.state.verticalVelocity = this.CONSTANTS.PHYSICS.JUMP_FORCE * 0.5;
          this.state.isJumping = true;
        }
      } else {
        this.state.isGrappling = false;
      }
    } else {
      // Normal Movement
      const targetX = lanePositions[this.state.targetLane];
      const dampening = this.CONSTANTS.PHYSICS.LANE_CHANGE_SPEED;
      const alpha = 1 - Math.exp(-dampening * dt);

      this.player.position.x = THREE.MathUtils.lerp(this.player.position.x, targetX, alpha);

      if (Math.abs(this.player.position.x - targetX) < 0.01) {
        this.player.position.x = targetX;
      }

      this.player.position.y += this.state.verticalVelocity * dt;
      this.state.verticalVelocity -= this.CONSTANTS.PHYSICS.GRAVITY * dt;

      // Ground Detection
      const isGrounded = this.player.position.y <= (this.CONSTANTS.PLAYER.BASE_HEIGHT + 0.01);
      const isMovingDown = this.state.verticalVelocity <= 0;

      if (isGrounded && isMovingDown) {
        this.player.position.y = this.CONSTANTS.PLAYER.BASE_HEIGHT;
        this.state.verticalVelocity = 0;
        this.state.jumpCount = 0;
        this.state.currentLane = this.state.targetLane;

        // ✅ CRITICAL FIX: Only record landing if we were PREVIOUSLY jumping
        // This prevents "infinite invincibility" while just running
        if (this.state.isJumping) {
          this.state.isJumping = false;
          if (this.jumpSafetySystem?.recordLanding) {
            this.jumpSafetySystem.recordLanding(this.player.position);
            console.log('✅ LANDING RECORDED: invincibility activated for 500ms');
          }
        }
      }
    }

    // Slide Timer
    if (this.state.isSliding) {
      this.state.slideTimer -= dt;
      if (this.state.slideTimer <= 0) {
        this.state.isSliding = false;
        this.state.slideTimer = 0;
        if (this.player && !this.player.userData?.isGLB) {
          this.player.scale.y = 1;
        }
      }
    }

    // Update Hitbox
    if (this.player.userData?.worldBox) {
      this.player.userData.worldBox.copy(this.player.userData.localBox).applyMatrix4(this.player.matrixWorld);

      if (this.state.isSliding) {
        const minY = this.player.userData.worldBox.min.y;
        this.player.userData.worldBox.max.y = minY + 0.4;

        const centerX = (this.player.userData.worldBox.min.x + this.player.userData.worldBox.max.x) / 2;
        const halfWidth = 0.35;
        this.player.userData.worldBox.min.x = centerX - halfWidth;
        this.player.userData.worldBox.max.x = centerX + halfWidth;
      }
    }

    // Safety: Hard Clamp to floor (Moved to end of update loop for stability)
    if (this.player.position.y < this.CONSTANTS.PLAYER.BASE_HEIGHT) {
      this.player.position.y = this.CONSTANTS.PLAYER.BASE_HEIGHT;
      if (this.state.verticalVelocity < 0) this.state.verticalVelocity = 0;
    }
  }

  reset() {
    this.state.currentLane = 1;
    this.state.targetLane = 1;
    this.state.verticalVelocity = 0;
    this.state.isJumping = false;
    this.state.isSliding = false;
    this.state.slideTimer = 0;
    this.state.isGrappling = false;
    this.state.jumpCount = 0;
    if (this.player && !this.player.userData?.isGLB) {
      this.player.scale.y = 1;
    }
  }

  resetToLane() {
    this.state.currentLane = this.state.targetLane;
    if (this.lanePositions && this.lanePositions[this.state.targetLane] !== undefined) {
      this.player.position.x = this.lanePositions[this.state.targetLane];
    }
  }

  resetFromCollision(lanePositions) {
    this.state.isSliding = false;
    this.state.slideTimer = 0;
    this.state.verticalVelocity = 0;
    this.state.isJumping = false;
    this.lanePositions = lanePositions;

    if (lanePositions && this.state.currentLane >= 0 && this.state.currentLane <= 2) {
      this.player.position.x = lanePositions[this.state.currentLane];
    }

    if (this.player && !this.player.userData?.isGLB) {
      this.player.scale.y = 1;
    }

    // Safety: Hard Clamp to floor
    if (this.player.position.y < this.CONSTANTS.PLAYER.BASE_HEIGHT) {
      this.player.position.y = this.CONSTANTS.PLAYER.BASE_HEIGHT;
      if (this.state.verticalVelocity < 0) this.state.verticalVelocity = 0;
    }
  }
}