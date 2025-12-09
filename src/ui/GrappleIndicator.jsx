/**
 * ✅ PHASE 5.2: Enhanced Grappling Hook UI with Targeting Display
 * Shows targeting mode, target count, and cooldown with device-specific controls
 * Bottom-right indicator - ALWAYS VISIBLE
 */

import React, { useState, useEffect } from 'react';
import { Anchor, Target } from 'lucide-react';

export default function GrappleIndicator({ grappleData }) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(isTouchDevice || isSmallScreen || isMobileUA);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!grappleData) return null;

  const { isActive, isTargeting, hasTarget, targetCount, cooldownProgress, canUse, cooldownRemaining, isInvincible } = grappleData;

  // Get device-specific control text - STAYS VISIBLE ALWAYS
  const getControlText = () => {
    if (isMobile) {
      return 'HOLD'; // Mobile: just "HOLD" without [G]
    } else {
      return 'HOLD [G]'; // Desktop: "HOLD [G]"
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 'clamp(50px, 10vw, 60px)',
      right: 'clamp(10px, 2vw, 15px)',
      zIndex: 75,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      pointerEvents: 'none'
    }}>
      {/* Grapple icon with cooldown */}
      <div style={{
        position: 'relative',
        width: 'clamp(40px, 8vw, 50px)',
        height: 'clamp(40px, 8vw, 50px)',
        background: isTargeting
          ? 'rgba(255, 100, 0, 0.4)'  // Orange when targeting
          : canUse 
            ? 'rgba(91, 143, 199, 0.3)'
            : 'rgba(128, 128, 128, 0.3)',
        border: `2px solid ${isTargeting ? '#ff6600' : canUse ? '#5b8fc7' : '#666666'}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(5px)',
        boxShadow: isTargeting
          ? '0 0 20px rgba(255, 100, 0, 0.8)'
          : canUse ? '0 0 15px rgba(91, 143, 199, 0.5)' : 'none',
        animation: isActive ? 'grapplePulse 0.3s infinite' : isTargeting ? 'targetingPulse 0.6s infinite' : 'none'
      }}>
        {isTargeting ? (
          <Target 
            size={window.innerWidth < 640 ? 20 : 24} 
            color="#ff6600"
            style={{
              animation: 'spin 2s linear infinite'
            }}
          />
        ) : (
          <Anchor 
            size={window.innerWidth < 640 ? 20 : 24} 
            color={canUse ? '#5b8fc7' : '#666666'} 
          />
        )}
        
        {/* Cooldown overlay */}
        {!canUse && !isTargeting && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `conic-gradient(
              rgba(0, 0, 0, 0.7) ${cooldownProgress * 100}%,
              transparent ${cooldownProgress * 100}%
            )`,
            borderRadius: '50%'
          }}></div>
        )}
      </div>

      {/* Targeting mode info */}
      {isTargeting && (
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 12px)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 'bold',
          color: hasTarget ? '#ff6600' : '#ff3333',
          textAlign: 'center',
          textShadow: '0 0 8px #ff6600',
          animation: 'targetingBlink 1s infinite'
        }}>
          {hasTarget ? `${targetCount} TARGET${targetCount !== 1 ? 'S' : ''}` : 'NO TARGET'}
        </div>
      )}

      {/* Active grapple indicator */}
      {isActive && (
        <div style={{
          fontSize: 'clamp(9px, 1.5vw, 10px)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 'bold',
          color: '#5b8fc7',
          textAlign: 'center',
          textShadow: '0 0 5px #5b8fc7',
          animation: 'grappleActive 0.5s infinite'
        }}>
          GRAPPLING
          {isInvincible && (
            <div style={{
              fontSize: 'clamp(8px, 1.4vw, 9px)',
              color: '#ffaa00',
              marginTop: '2px'
            }}>
              INVINCIBLE
            </div>
          )}
        </div>
      )}

      {/* Cooldown timer text */}
      {!canUse && !isTargeting && !isActive && cooldownRemaining > 0 && (
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 12px)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 'bold',
          color: '#666666',
          textAlign: 'center'
        }}>
          {cooldownRemaining.toFixed(1)}s
        </div>
      )}

      {/* Ready indicator with device-specific text - ALWAYS VISIBLE, NO FADE */}
      {canUse && !isTargeting && (
        <div style={{
          fontSize: 'clamp(9px, 1.5vw, 10px)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 'bold',
          color: '#5b8fc7',
          textAlign: 'center',
          textShadow: '0 0 5px #5b8fc7',
          animation: 'grappleReady 1s infinite'
        }}>
          {getControlText()}
        </div>
      )}

      <style>{`
        @keyframes grapplePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes targetingPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(255, 100, 0, 0.8);
          }
          50% { 
            transform: scale(1.08);
            box-shadow: 0 0 30px rgba(255, 100, 0, 1);
          }
        }
        @keyframes grappleReady {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes grappleActive {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(-2px); }
        }
        @keyframes targetingBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
