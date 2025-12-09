import React, { useEffect, useState } from 'react';

export default function DamageIndicator({ damageDirection, onFade }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (damageDirection) {
      setVisible(true);
      setOpacity(1);

      // Fade out animation
      const fadeInterval = setInterval(() => {
        setOpacity(prev => {
          const newOpacity = prev - 0.05;
          if (newOpacity <= 0) {
            clearInterval(fadeInterval);
            return 0;
          }
          return newOpacity;
        });
      }, 50);

      const cleanupTimeout = setTimeout(() => {
        setVisible(false);
      }, 1000);

      const callbackTimeout = setTimeout(() => {
        if (onFade) onFade();
      }, 1050);

      return () => {
        clearInterval(fadeInterval);
        clearTimeout(cleanupTimeout);
        clearTimeout(callbackTimeout);
      };
    }
  }, [damageDirection, onFade]);

  if (!visible || !damageDirection) return null;

  // ✅ FIXED: Removed the directional arrow logic (red triangle) as requested.
  // Only the screen flash effect remains below.

  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      background: `radial-gradient(circle at center, rgba(255, 0, 0, ${opacity * 0.2}), transparent 70%)`,
      pointerEvents: 'none', 
      zIndex: 99,
      boxShadow: `inset 0 0 ${50 * opacity}px rgba(255, 0, 0, ${opacity * 0.6})`
    }} />
  );
}