import React, { useEffect, useState } from 'react';
import './AbilityReadyIndicator.css';

export default function AbilityReadyIndicator({ 
  grappleData, 
  playerLane 
}) {
  const [pulseGrapple, setPulseGrapple] = useState(false);
  const [showGrappleHint, setShowGrappleHint] = useState(true);
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

  // Pulse animation when abilities become ready
  useEffect(() => {
    if (grappleData?.canUse && !pulseGrapple) {
      setPulseGrapple(true);
      setTimeout(() => setPulseGrapple(false), 2000);
    }
  }, [grappleData?.canUse]);

  // Auto-fade grapple hint after 8 seconds (longer text needs more time)
  useEffect(() => {
    if (grappleData?.canUse && !grappleData?.isTargeting) {
      setShowGrappleHint(true);
      const fadeTimer = setTimeout(() => {
        setShowGrappleHint(false);
      }, 8000); // 8 seconds for longer text

      return () => clearTimeout(fadeTimer);
    } else {
      setShowGrappleHint(false);
    }
  }, [grappleData?.canUse, grappleData?.isTargeting]);

  const grappleReady = grappleData?.canUse;
  const grappleTargeting = grappleData?.isTargeting;

  // Get device-specific instruction text
  const getInstructionText = () => {
    if (isMobile) {
      return "Grappling Hook Ready! Touch & Hold to activate, Swipe to select target, Release to use";
    } else {
      return "Grappling Hook Ready! Hold [G] to activate, [←] [→] to select target, Release [G] to use";
    }
  };

  return (
    <>
      {/* Grapple Indicator - Top center - FADES AWAY */}
      {grappleReady && !grappleTargeting && showGrappleHint && (
        <div className={`ability-indicator grapple ${pulseGrapple ? 'pulse' : ''} ${!showGrappleHint ? 'fade-out' : ''}`}>
          <div className="ability-icon">🎯</div>
          <div className="ability-hint">
            <div className="ability-instruction">{getInstructionText()}</div>
          </div>
        </div>
      )}

      {/* Grapple Targeting UI */}
      {grappleTargeting && (
        <div className="grapple-targeting-ui">
          <div className="targeting-status">
            <div className="scanning-text">SCANNING...</div>
            <div className="target-count">
              {grappleData.targetCount > 0 
                ? `${grappleData.targetCount} TARGET${grappleData.targetCount > 1 ? 'S' : ''} FOUND`
                : 'NO TARGETS'}
            </div>
          </div>
          {grappleData.hasTarget && !isMobile && (
            <div className="targeting-controls">
              <div className="control-hint">[←] [→] Cycle Targets</div>
              <div className="control-hint">Release [G] to Launch</div>
            </div>
          )}
          {grappleData.hasTarget && isMobile && (
            <div className="targeting-controls">
              <div className="control-hint">Release to Launch</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
