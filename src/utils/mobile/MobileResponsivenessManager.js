/**
 * ✅ PHASE 0.1: Mobile Responsiveness System
 * Handles viewport configuration, safe areas, orientation, and touch optimization
 */

export class MobileResponsivenessManager {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isIOS = this.detectIOS();
    this.isAndroid = this.detectAndroid();
    this.safeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    this.orientation = 'portrait';
    this.initialized = false;
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  detectAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  init() {
    if (this.initialized) return;
    
    console.log('🔧 Initializing Mobile Responsiveness System...');
    console.log(`📱 Platform: ${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Desktop'}`);
    
    this.setupViewport();
    this.detectSafeAreas();
    this.setupOrientationHandling();
    this.preventGestureConflicts();
    this.optimizeTouchTargets();
    this.setupResizeHandler();
    
    this.initialized = true;
    console.log('✅ Mobile Responsiveness System initialized');
  }

  setupViewport() {
    // Ensure proper viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // Enhanced viewport settings with safe area support
    const viewportContent = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=1.0',
      'user-scalable=no',
      'viewport-fit=cover' // Critical for notch/safe area support
    ].join(', ');

    viewport.setAttribute('content', viewportContent);
    console.log('📐 Viewport configured:', viewportContent);
  }

  detectSafeAreas() {
    // Read CSS environment variables for safe area insets
    const computedStyle = getComputedStyle(document.documentElement);
    
    this.safeAreaInsets = {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10)
    };

    // Apply to CSS custom properties for easy use
    document.documentElement.style.setProperty('--safe-area-top', `${this.safeAreaInsets.top}px`);
    document.documentElement.style.setProperty('--safe-area-right', `${this.safeAreaInsets.right}px`);
    document.documentElement.style.setProperty('--safe-area-bottom', `${this.safeAreaInsets.bottom}px`);
    document.documentElement.style.setProperty('--safe-area-left', `${this.safeAreaInsets.left}px`);

    console.log('🔒 Safe Area Insets:', this.safeAreaInsets);
  }

  setupOrientationHandling() {
    this.updateOrientation();

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateOrientation();
        this.detectSafeAreas(); // Recalculate safe areas
      }, 100);
    });

    window.addEventListener('resize', () => {
      this.updateOrientation();
    });
  }

  updateOrientation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const previousOrientation = this.orientation;

    this.orientation = width > height ? 'landscape' : 'portrait';

    // Apply orientation class to body
    document.body.classList.remove('orientation-portrait', 'orientation-landscape');
    document.body.classList.add(`orientation-${this.orientation}`);

    if (previousOrientation && previousOrientation !== this.orientation) {
      console.log(`🔄 Orientation changed: ${previousOrientation} → ${this.orientation}`);
      
      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent('orientationchange', {
        detail: { orientation: this.orientation }
      }));
    }
  }

  preventGestureConflicts() {
    if (!this.isMobile) return;

    // Prevent pull-to-refresh on mobile browsers
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    // Prevent iOS Safari swipe-back gesture during gameplay
    if (this.isIOS) {
      let touchStartX = 0;
      let touchStartY = 0;

      document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        const touchMoveX = e.touches[0].clientX;
        const touchMoveY = e.touches[0].clientY;
        const diffX = touchMoveX - touchStartX;
        const diffY = Math.abs(touchMoveY - touchStartY);

        // Prevent horizontal swipe from edge (iOS back gesture)
        if (touchStartX < 20 && diffX > 10 && diffY < 50) {
          e.preventDefault();
        }
      }, { passive: false });
    }

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    console.log('🚫 Gesture conflicts prevented');
  }

  optimizeTouchTargets() {
    // Add helper class for touch targets
    const style = document.createElement('style');
    style.textContent = `
      .touch-target {
        min-width: 48px;
        min-height: 48px;
        padding: 12px;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      .touch-target:active {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }

      /* Prevent text selection during gameplay */
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }

      /* Improve touch scrolling on lists/menus */
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);

    // Apply no-select to game canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.add('no-select');
    }
  }

  setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.detectSafeAreas();
        this.updateOrientation();
        
        // Dispatch resize event for UI components
        window.dispatchEvent(new CustomEvent('mobileResize', {
          detail: {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: this.orientation,
            safeAreaInsets: this.safeAreaInsets
          }
        }));
      }, 150);
    });
  }

  // Helper method to get safe area adjusted position
  getSafePosition(position) {
    const adjusted = { ...position };

    if (position.top !== undefined) {
      adjusted.top = `calc(${position.top} + var(--safe-area-top, 0px))`;
    }
    if (position.bottom !== undefined) {
      adjusted.bottom = `calc(${position.bottom} + var(--safe-area-bottom, 0px))`;
    }
    if (position.left !== undefined) {
      adjusted.left = `calc(${position.left} + var(--safe-area-left, 0px))`;
    }
    if (position.right !== undefined) {
      adjusted.right = `calc(${position.right} + var(--safe-area-right, 0px))`;
    }

    return adjusted;
  }

  // Check if orientation lock is available (for future implementation)
  canLockOrientation() {
    return 'orientation' in screen && 'lock' in screen.orientation;
  }

  // Request orientation lock (portrait only)
  async lockOrientation(mode = 'portrait') {
    if (!this.canLockOrientation()) {
      console.warn('⚠️ Orientation lock not supported');
      return false;
    }

    try {
      await screen.orientation.lock(mode);
      console.log(`🔒 Orientation locked to ${mode}`);
      return true;
    } catch (error) {
      console.warn('⚠️ Could not lock orientation:', error.message);
      return false;
    }
  }

  // Get device performance tier for quality settings
  getPerformanceTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4; // GB
    const isMobile = this.isMobile;

    // Simple heuristic
    if (!isMobile && cores >= 8 && memory >= 8) {
      return 'high'; // Desktop/high-end
    } else if (cores >= 4 && memory >= 4) {
      return 'medium'; // Mid-range
    } else {
      return 'low'; // Budget devices
    }
  }

  // Check if device is low-end
  isLowEndDevice() {
    return this.getPerformanceTier() === 'low';
  }

  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      orientation: this.orientation,
      safeAreaInsets: this.safeAreaInsets,
      performanceTier: this.getPerformanceTier(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
}

// Export singleton instance
export const mobileResponsiveness = new MobileResponsivenessManager();
