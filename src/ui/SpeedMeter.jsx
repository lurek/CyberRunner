/**
 * ✅ PHASE 4.2: Speed Meter Component
 * Visual gauge showing current speed progression
 */

import React from 'react';
import { Zap } from 'lucide-react';

export default function SpeedMeter({ speed, maxSpeed, baseSpeed }) {
  // Calculate speed as percentage of max
  const speedPercent = ((speed - baseSpeed) / (maxSpeed - baseSpeed)) * 100;
  const clampedPercent = Math.max(0, Math.min(100, speedPercent));

  // Color based on speed tier
  const getSpeedColor = () => {
    if (clampedPercent < 30) return { primary: '#00ff00', glow: '#00ff00' };
    if (clampedPercent < 60) return { primary: '#ffd700', glow: '#ffd700' };
    if (clampedPercent < 85) return { primary: '#ff6600', glow: '#ff6600' };
    return { primary: '#ff0000', glow: '#ff0000' };
  };

  const colors = getSpeedColor();
  const isMax = clampedPercent >= 99;

  return (
    <div style={{
      position: 'fixed',
      // ✅ RESPONSIVE FIX: Moved higher to avoid overlap with grapple indicator
      right: 'clamp(10px, 3vw, 20px)',
      bottom: 'clamp(130px, 18vw, 150px)',
      zIndex: 70,
      width: 'clamp(140px, 35vw, 200px)',
      fontFamily: "'Orbitron', sans-serif"
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
        fontSize: '12px',
        color: colors.primary,
        fontWeight: 'bold',
        textShadow: `0 0 5px ${colors.glow}`
      }}>
        <Zap size={14} />
        <span>SPEED</span>
        {isMax && <span style={{ animation: 'pulse 0.5s infinite' }}>MAX!</span>}
      </div>

      {/* Speed Bar */}
      <div style={{
        width: '100%',
        height: '18px', // ✅ RESPONSIVE FIX: Matched health bar height
        background: 'rgba(12, 8, 40, 0.8)',
        border: `1px solid ${colors.primary}`,
        borderRadius: '5px', // ✅ RESPONSIVE FIX: Matched health bar radius
        overflow: 'hidden',
        backdropFilter: 'blur(5px)',
        boxShadow: `0 0 10px ${colors.glow}`,
        position: 'relative'
      }}>
        {/* Fill */}
        <div style={{
          width: `${clampedPercent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.glow})`,
          boxShadow: `inset 0 0 10px ${colors.glow}`,
          transition: 'width 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated shine effect */}
          {clampedPercent > 5 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-50%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'speedShine 2s infinite'
            }} />
          )}
        </div>

        {/* Percentage Text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '0 0 3px #000, 0 0 5px #000',
          pointerEvents: 'none'
        }}>
          {Math.round(clampedPercent)}%
        </div>

        {/* Tick marks */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}>
          {[25, 50, 75].map(tick => (
            <div key={tick} style={{
              position: 'absolute',
              left: `${tick}%`,
              top: 0,
              width: '1px',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.2)'
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes speedShine {
          0% { left: -50%; }
          100% { left: 150%; }
        }
      `}</style>
    </div>
  );
}