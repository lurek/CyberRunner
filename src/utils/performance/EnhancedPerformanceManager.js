/**
 * Enhanced Performance Manager with detailed metrics
 * Monitors FPS, memory, draw calls, and provides optimization suggestions
 */

export class EnhancedPerformanceManager {
  constructor() {
    this.metrics = {
      fps: 60,
      avgFps: 60,
      minFps: 60,
      maxFps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      memory: 0,
      updateTime: 0,
      renderTime: 0
    };

    this.history = {
      fps: [],
      frameTime: [],
      maxHistoryLength: 300 // 5 seconds at 60fps
    };

    this.warnings = new Set();
    this.lastFrameTime = performance.now();
    this.fpsBuffer = [];
    this.bufferSize = 60; // Average over 60 frames
  }

  startFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame(renderer) {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Calculate FPS
    const fps = 1000 / frameTime;
    this.fpsBuffer.push(fps);
    if (this.fpsBuffer.length > this.bufferSize) {
      this.fpsBuffer.shift();
    }

    // Update metrics
    this.metrics.fps = fps;
    this.metrics.frameTime = frameTime;
    this.metrics.avgFps = this.fpsBuffer.reduce((a, b) => a + b, 0) / this.fpsBuffer.length;
    this.metrics.minFps = Math.min(...this.fpsBuffer);
    this.metrics.maxFps = Math.max(...this.fpsBuffer);

    // Get renderer info
    if (renderer && renderer.info) {
      this.metrics.drawCalls = renderer.info.render.calls;
      this.metrics.triangles = renderer.info.render.triangles;
    }

    // Estimate memory usage (if available)
    if (performance.memory) {
      this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
    }

    // Store history
    this.history.fps.push(fps);
    this.history.frameTime.push(frameTime);
    if (this.history.fps.length > this.history.maxHistoryLength) {
      this.history.fps.shift();
      this.history.frameTime.shift();
    }

    // Check for performance issues
    this.checkPerformance();
  }

  checkPerformance() {
    this.warnings.clear();

    // Low FPS warning
    if (this.metrics.avgFps < 30) {
      this.warnings.add('CRITICAL: FPS below 30');
    } else if (this.metrics.avgFps < 45) {
      this.warnings.add('WARNING: FPS below 45');
    }

    // High draw calls
    if (this.metrics.drawCalls > 200) {
      this.warnings.add('High draw calls (>200)');
    }

    // Frame time spikes
    if (this.metrics.frameTime > 33) {
      this.warnings.add('Frame time spike detected');
    }

    // Memory warning
    if (this.metrics.memory > 500) {
      this.warnings.add('High memory usage (>500MB)');
    }

    // Unstable framerate
    const fpsVariance = this.metrics.maxFps - this.metrics.minFps;
    if (fpsVariance > 30) {
      this.warnings.add('Unstable framerate (high variance)');
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      warnings: Array.from(this.warnings)
    };
  }

  getSuggestions() {
    const suggestions = [];

    if (this.metrics.avgFps < 45) {
      suggestions.push({
        priority: 'HIGH',
        issue: 'Low FPS',
        suggestion: 'Enable Low Quality mode or reduce particle count'
      });
    }

    if (this.metrics.drawCalls > 200) {
      suggestions.push({
        priority: 'MEDIUM',
        issue: 'High draw calls',
        suggestion: 'Consider using more instanced meshes'
      });
    }

    if (this.metrics.memory > 500) {
      suggestions.push({
        priority: 'MEDIUM',
        issue: 'High memory usage',
        suggestion: 'Check for memory leaks, dispose unused geometries'
      });
    }

    const fpsVariance = this.metrics.maxFps - this.metrics.minFps;
    if (fpsVariance > 30) {
      suggestions.push({
        priority: 'LOW',
        issue: 'FPS variance',
        suggestion: 'Profile to find frame spikes, consider object pooling'
      });
    }

    return suggestions;
  }

  getPerformanceGrade() {
    const avgFps = this.metrics.avgFps;
    
    if (avgFps >= 55) return { grade: 'A', color: '#00ff00', label: 'Excellent' };
    if (avgFps >= 45) return { grade: 'B', color: '#88ff00', label: 'Good' };
    if (avgFps >= 35) return { grade: 'C', color: '#ffaa00', label: 'Fair' };
    if (avgFps >= 25) return { grade: 'D', color: '#ff6600', label: 'Poor' };
    return { grade: 'F', color: '#ff0000', label: 'Critical' };
  }

  // Debug overlay data
  getDebugOverlay() {
    const grade = this.getPerformanceGrade();
    
    return {
      fps: {
        current: Math.round(this.metrics.fps),
        average: Math.round(this.metrics.avgFps),
        min: Math.round(this.metrics.minFps),
        max: Math.round(this.metrics.maxFps)
      },
      performance: {
        grade: grade.grade,
        color: grade.color,
        label: grade.label
      },
      rendering: {
        drawCalls: this.metrics.drawCalls,
        triangles: this.metrics.triangles
      },
      memory: {
        used: this.metrics.memory,
        unit: 'MB'
      },
      timing: {
        frameTime: this.metrics.frameTime.toFixed(2),
        targetFrameTime: 16.67
      },
      warnings: Array.from(this.warnings)
    };
  }

  // Export performance report
  generateReport() {
    const suggestions = this.getSuggestions();
    const grade = this.getPerformanceGrade();

    return {
      summary: {
        grade: grade.grade,
        label: grade.label,
        avgFps: Math.round(this.metrics.avgFps),
        stability: `${((1 - ((this.metrics.maxFps - this.metrics.minFps) / 60)) * 100).toFixed(0)}%`
      },
      metrics: this.metrics,
      suggestions: suggestions,
      warnings: Array.from(this.warnings),
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.fpsBuffer = [];
    this.history.fps = [];
    this.history.frameTime = [];
    this.warnings.clear();
  }
}

// Singleton instance
let performanceManagerInstance = null;

export function getPerformanceManager() {
  if (!performanceManagerInstance) {
    performanceManagerInstance = new EnhancedPerformanceManager();
  }
  return performanceManagerInstance;
}

// React hook for easy integration
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState(null);
  const managerRef = React.useRef(getPerformanceManager());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(managerRef.current.getDebugOverlay());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
