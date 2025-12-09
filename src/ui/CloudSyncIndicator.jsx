import React, { useState, useEffect } from 'react';

export function CloudSyncIndicator({ visible = false }) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 'env(safe-area-inset-top, 1rem)',
      right: '1rem',
      background: 'rgba(0, 255, 136, 0.12)',
      border: '1px solid #00ff88',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      color: '#00ff88',
      zIndex: 10000,
      boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      pointerEvents: 'none',
      animation: 'fadeInOut 0.3s ease-in-out'
    }}>
      ☁️ Synced
    </div>
  );
}
