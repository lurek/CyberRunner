/**
 * DangerZoneVisuals.jsx
 * ✅ PHASE 0.2 - Visual Warning System for Jump Safety
 * 
 * Shows red danger indicators on the ground where obstacles are approaching
 */

import React, { useEffect, useState } from 'react';
import './DangerZoneVisuals.css';

export default function DangerZoneVisuals({ dangerZones, camera }) {
  const [screenPositions, setScreenPositions] = useState([]);
  
  useEffect(() => {
    if (!dangerZones || dangerZones.length === 0 || !camera) {
      setScreenPositions([]);
      return;
    }
    
    // Project 3D danger zones to screen coordinates
    const positions = dangerZones.map((zone, index) => {
      const vector = zone.position.clone();
      vector.project(camera);
      
      // Convert to screen space
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
      
      // Calculate fade based on lifetime
      const now = performance.now() / 1000;
      const age = now - zone.time;
      const opacity = Math.max(0, 1 - (age / zone.lifetime));
      
      return {
        id: `danger-${index}-${zone.time}`,
        x,
        y,
        opacity,
        visible: vector.z < 1 // Only show if in front of camera
      };
    });
    
    setScreenPositions(positions);
  }, [dangerZones, camera]);
  
  if (screenPositions.length === 0) return null;
  
  return (
    <>
      {screenPositions.map((pos) => {
        if (!pos.visible) return null;
        
        return (
          <div
            key={pos.id}
            className="danger-zone-indicator"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              opacity: pos.opacity
            }}
          >
            <div className="danger-zone-pulse" />
            <div className="danger-zone-ring" />
          </div>
        );
      })}
    </>
  );
}
