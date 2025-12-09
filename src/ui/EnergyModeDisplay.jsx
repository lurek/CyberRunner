/**
 * ✅ PHASE 5.4 IMPROVED: Energy Mode Display Component
 * Responsive, non-intrusive display for Energy Mode progress and activation
 */

import React from 'react';
import { Zap } from 'lucide-react';

export default function EnergyModeDisplay({ energyMode }) {
  if (!energyMode) return null;

  const { isActive, coinsToActivation, timeRemaining, progress } = energyMode;

  // Progress bar display (when building up energy)
  if (!isActive && coinsToActivation > 0 && coinsToActivation < 50) {
    const progressPercent = ((50 - coinsToActivation) / 50) * 100;

    return (
      <div style={{
        position: 'fixed',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 75,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {/* Compact progress bar */}
        <div style={{
          width: 'clamp(200px, 40vw, 300px)',
          height: '8px',
          background: 'rgba(12, 8, 40, 0.8)',
          border: '1px solid rgba(155, 127, 199, 0.5)',
          borderRadius: '10px',
          overflow: 'hidden',
          backdropFilter: 'blur(5px)',
          boxShadow: '0 0 15px rgba(155, 127, 199, 0.3)'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #9b7fc7, #ff69b4)',
            boxShadow: '0 0 10px #9b7fc7',
            transition: 'width 0.3s ease'
          }}></div>
        </div>

        {/* Coin counter badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: 'rgba(12, 8, 40, 0.8)',
          border: '1px solid rgba(155, 127, 199, 0.5)',
          borderRadius: '12px',
          backdropFilter: 'blur(5px)',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 'clamp(10px, 2vw, 12px)',
          color: '#9b7fc7',
          fontWeight: 'bold'
        }}>
          <Zap size={14} color="#9b7fc7" />
          <span>{coinsToActivation} TO ENERGY</span>
        </div>
      </div>
    );
  }

  // Active energy mode display (compact corner notification)
  if (isActive) {
    const timePercent = (timeRemaining / 5.0) * 100;

    return (
      <>
        {/* Top right corner indicator */}
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '10px',
          zIndex: 75,
          padding: 'clamp(10px, 2vw, 15px) clamp(15px, 3vw, 20px)',
          background: 'linear-gradient(135deg, rgba(155, 127, 199, 0.4), rgba(138, 43, 226, 0.4))',
          border: '2px solid #9b7fc7',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 ${20 + progress * 30}px rgba(155, 127, 199, 0.8)`,
          fontFamily: "'Orbitron', sans-serif",
          pointerEvents: 'none',
          animation: 'energyPulse 0.5s infinite',
          minWidth: 'clamp(100px, 15vw, 150px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '6px'
          }}>
            <Zap size={20} color="#9b7fc7" />
            <span style={{
              fontSize: 'clamp(14px, 3vw, 18px)',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '0 0 10px #9b7fc7'
            }}>
              ENERGY
            </span>
          </div>

          {/* Time remaining bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '4px'
          }}>
            <div style={{
              width: `${timePercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #9b7fc7, #ff69b4)',
              transition: 'width 0.1s linear'
            }}></div>
          </div>

          <div style={{
            fontSize: 'clamp(10px, 2vw, 12px)',
            color: '#ff69b4',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {timeRemaining.toFixed(1)}s
          </div>
        </div>

        {/* Screen edge glow effect */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 60,
          boxShadow: `inset 0 0 ${50 + progress * 100}px rgba(155, 127, 199, ${0.2 + progress * 0.3})`,
          borderRadius: '0',
          animation: 'energyGlow 1s infinite'
        }}></div>

        <style>{`
          @keyframes energyPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes energyGlow {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
        `}</style>
      </>
    );
  }

  return null;
}
