/**
 * Fixed InputHandler
 * - Prevents keyboard repeat events (Overshoot Fix)
 */
export class InputHandler {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isEnabled = false;

    this.holdTimer = null;
    this.holdThreshold = 200;
    this.swipeThreshold = 30;

    this.isGrappleKeyDown = false;
    this.targetingActive = false;
    this.isHolding = false;
  }

  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;

    this.keydownHandler = (e) => {
      // ✅ FIX: Prevent key repeat from firing lane change multiple times
      if (e.repeat) return;

      if (e.code === "KeyG" && !this.isGrappleKeyDown) {
        this.isGrappleKeyDown = true;
        e.preventDefault();
        if (this.callbacks.grappleStart) {
          this.callbacks.grappleStart();
          this.targetingActive = true;
        }
        return;
      }

      if (this.isGrappleKeyDown && this.targetingActive) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          this.callbacks.grappleCycle?.(-1);
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          this.callbacks.grappleCycle?.(1);
        }
        return;
      }

      if (e.code === "ArrowLeft") { e.preventDefault(); this.callbacks.changeLane(-1); }
      else if (e.code === "ArrowRight") { e.preventDefault(); this.callbacks.changeLane(1); }
      else if (e.code === "ArrowUp" || e.code === "Space") { e.preventDefault(); this.callbacks.jump(); }
      else if (e.code === "ArrowDown") {
        console.log('🔽 InputHandler: ArrowDown detected');
        e.preventDefault();
        this.callbacks.slide();
      }

      // ✨ NEW: Ability activation keys
      else if (e.code === "KeyE") { e.preventDefault(); this.callbacks.activateLightning?.(); }
      else if (e.code === "KeyQ") { e.preventDefault(); this.callbacks.activateShield?.(); }
      else if (e.code === "KeyR") { e.preventDefault(); this.callbacks.activateSpeedBoost?.(); }
      else if (e.code === "KeyT") { e.preventDefault(); this.callbacks.activateTimeSlow?.(); }
    };

    this.keyupHandler = (e) => {
      if (e.code === "KeyG" && this.isGrappleKeyDown) {
        this.isGrappleKeyDown = false;
        this.targetingActive = false;
        e.preventDefault();
        this.callbacks.grappleConfirm?.();
      }
    };

    this.touchStartHandler = (e) => {
      if (e.touches.length > 1) return;

      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isHolding = true;
      this.targetingActive = false;

      this.holdTimer = setTimeout(() => {
        if (this.isHolding) {
          this.targetingActive = true;
          if (navigator.vibrate) navigator.vibrate(20);
          this.callbacks.grappleStart?.();
        }
      }, this.holdThreshold);
    };

    this.touchMoveHandler = (e) => {
      if (!this.isHolding) return;

      const dx = e.touches[0].clientX - this.touchStartX;
      const dy = e.touches[0].clientY - this.touchStartY;

      if (!this.targetingActive && (Math.abs(dx) > this.swipeThreshold || Math.abs(dy) > this.swipeThreshold)) {
        if (this.holdTimer) {
          clearTimeout(this.holdTimer);
          this.holdTimer = null;
        }
        return;
      }

      if (this.targetingActive) {
        e.preventDefault();
        if (Math.abs(dx) > 40) {
          const direction = Math.sign(dx);
          this.callbacks.grappleCycle?.(direction);
          this.touchStartX = e.touches[0].clientX;
        }
      }
    };

    this.touchEndHandler = (e) => {
      if (this.holdTimer) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }

      if (!this.isHolding) return;
      this.isHolding = false;

      if (this.targetingActive) {
        this.callbacks.grappleConfirm?.();
        this.targetingActive = false;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < 10 && absDy < 10) {
        this.callbacks.jump();
        return;
      }

      if (absDx > absDy) {
        if (absDx > this.swipeThreshold) {
          this.callbacks.changeLane(dx > 0 ? 1 : -1);
        }
      } else {
        if (absDy > this.swipeThreshold) {
          if (dy < 0) this.callbacks.jump();
          else this.callbacks.slide();
        }
      }
    };

    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
    window.addEventListener("touchstart", this.touchStartHandler, { passive: false });
    window.addEventListener("touchmove", this.touchMoveHandler, { passive: false });
    window.addEventListener("touchend", this.touchEndHandler);
  }

  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    if (this.holdTimer) clearTimeout(this.holdTimer);

    window.removeEventListener("keydown", this.keydownHandler);
    window.removeEventListener("keyup", this.keyupHandler);
    window.removeEventListener("touchstart", this.touchStartHandler);
    window.removeEventListener("touchmove", this.touchMoveHandler);
    window.removeEventListener("touchend", this.touchEndHandler);
  }
}