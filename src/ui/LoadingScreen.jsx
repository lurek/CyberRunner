import React from 'react';

export default function LoadingScreen({ visible, isEngineReady = false, authInitialized = false }) {
  // ✅ DEBUG: Show what's blocking
  const status = [];
  if (!isEngineReady) status.push('⏳ Engine');
  if (!authInitialized) status.push('⏳ Auth');
  if (isEngineReady && authInitialized) status.push('✅ Ready!');

  console.log('🔄 LoadingScreen render:', { visible, isEngineReady, authInitialized });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#060316',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#5b8fc7',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.5s ease-out'
    }}>
      <div style={{
        fontSize: 'clamp(24px, 5vw, 32px)',
        fontWeight: 700,
        textShadow: '0 0 10px #5b8fc7, 0 0 20px #5b8fc7'
      }}>
        CYBER RUNNER 3D
      </div>

      {/* Animated loading bar */}
      <div style={{
        width: '200px',
        height: '4px',
        background: 'rgba(91, 143, 199, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: '#5b8fc7',
          animation: 'loading-bar 1.5s infinite linear'
        }}></div>
      </div>

      <div style={{
        fontSize: '14px',
        color: '#cfefff',
        opacity: 0.8
      }}>
        Initializing Systems...
      </div>

      {/* ✅ DEBUG: Show loading status */}
      <div style={{
        fontSize: '12px',
        color: '#888',
        marginTop: '10px',
        fontFamily: 'monospace'
      }}>
        {status.join(' | ')}
      </div>

      <style>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}