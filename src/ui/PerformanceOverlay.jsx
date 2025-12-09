import React, { useState, useEffect } from 'react';
import './PerformanceOverlay.css';

export default function PerformanceOverlay({ performanceManager, visible = false }) {
  const [metrics, setMetrics] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!visible || !performanceManager) return;

    const interval = setInterval(() => {
      setMetrics(performanceManager.getDebugOverlay());
    }, 500); // Update twice per second

    return () => clearInterval(interval);
  }, [visible, performanceManager]);

  if (!visible || !metrics) return null;

  return (
    <div className="performance-overlay">
      <div className="perf-header" onClick={() => setExpanded(!expanded)}>
        <div className="perf-grade" style={{ color: metrics.performance.color }}>
          {metrics.performance.grade}
        </div>
        <div className="perf-fps">
          {metrics.fps.current} FPS
        </div>
        <div className="perf-toggle">{expanded ? '▼' : '▲'}</div>
      </div>

      {expanded && (
        <div className="perf-details">
          <div className="perf-section">
            <div className="perf-section-title">FPS</div>
            <div className="perf-row">
              <span>Current:</span>
              <span className="perf-value">{metrics.fps.current}</span>
            </div>
            <div className="perf-row">
              <span>Average:</span>
              <span className="perf-value">{metrics.fps.average}</span>
            </div>
            <div className="perf-row">
              <span>Min / Max:</span>
              <span className="perf-value">
                {metrics.fps.min} / {metrics.fps.max}
              </span>
            </div>
          </div>

          <div className="perf-section">
            <div className="perf-section-title">Rendering</div>
            <div className="perf-row">
              <span>Draw Calls:</span>
              <span className={`perf-value ${metrics.rendering.drawCalls > 200 ? 'warning' : ''}`}>
                {metrics.rendering.drawCalls}
              </span>
            </div>
            <div className="perf-row">
              <span>Triangles:</span>
              <span className="perf-value">
                {(metrics.rendering.triangles / 1000).toFixed(1)}K
              </span>
            </div>
          </div>

          <div className="perf-section">
            <div className="perf-section-title">Memory</div>
            <div className="perf-row">
              <span>Used:</span>
              <span className={`perf-value ${metrics.memory.used > 500 ? 'warning' : ''}`}>
                {metrics.memory.used} MB
              </span>
            </div>
          </div>

          <div className="perf-section">
            <div className="perf-section-title">Timing</div>
            <div className="perf-row">
              <span>Frame Time:</span>
              <span className={`perf-value ${parseFloat(metrics.timing.frameTime) > 20 ? 'warning' : ''}`}>
                {metrics.timing.frameTime}ms
              </span>
            </div>
            <div className="perf-row">
              <span>Target:</span>
              <span className="perf-value">16.67ms</span>
            </div>
          </div>

          {metrics.warnings.length > 0 && (
            <div className="perf-warnings">
              {metrics.warnings.map((warning, idx) => (
                <div key={idx} className="perf-warning">
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
