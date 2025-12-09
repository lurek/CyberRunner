import React from "react";

export default function PauseMenu({ onResume, onRestart, onQuit, onSettings, visible }) {
  const handleButtonClick = (callback) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Button clicked:', callback.name);
    if (callback) {
      callback();
    }
  };

  if (!visible) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 15, 26, 0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#5b8fc7",
        fontFamily: "Orbitron, sans-serif",
        zIndex: 5000,
        backdropFilter: 'blur(15px)',
        pointerEvents: 'auto',
        WebkitBackdropFilter: 'blur(15px)',
        touchAction: 'manipulation'
      }}
    >
      {/* Glass Panel Container */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: 'clamp(30px, 6vw, 50px) clamp(20px, 5vw, 40px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(91, 143, 199, 0.1)',
        maxWidth: 'min(420px, 90vw)',
        width: '100%'
      }}>
        <h2 style={{ 
          fontSize: "clamp(32px, 8vw, 48px)", 
          marginBottom: "clamp(24px, 5vw, 40px)",
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          letterSpacing: '0.15em',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#5b8fc7',
          margin: '0 0 clamp(24px, 5vw, 40px) 0'
        }}>
          ⏸️ PAUSED
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 3vw, 16px)',
          width: '100%'
        }}>
          {/* Resume Button - Refined Green */}
          <button
            onClick={handleButtonClick(onResume)}
            onTouchEnd={handleButtonClick(onResume)}
            className="glow-btn"
            style={{
              padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 5vw, 32px)',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, rgba(0, 255, 153, 0.25), rgba(0, 200, 120, 0.25))',
              border: '2px solid rgba(0, 255, 153, 0.5)',
              borderRadius: '12px',
              color: '#00ff99',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              minHeight: 'clamp(56px, 12vw, 64px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 153, 0.4), rgba(0, 200, 120, 0.4))';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 153, 0.3), 0 0 30px rgba(0, 255, 153, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 153, 0.25), rgba(0, 200, 120, 0.25))';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0) scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1)'}
          >
            ▶️ RESUME GAME
          </button>

          {/* Restart Button - Refined Gold */}
          <button
            onClick={handleButtonClick(onRestart)}
            onTouchEnd={handleButtonClick(onRestart)}
            className="glow-btn"
            style={{
              padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 5vw, 32px)',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 165, 0, 0.25))',
              border: '2px solid rgba(255, 204, 0, 0.5)',
              borderRadius: '12px',
              color: '#ffcc00',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              minHeight: 'clamp(56px, 12vw, 64px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 204, 0, 0.4), rgba(255, 165, 0, 0.4))';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 204, 0, 0.3), 0 0 30px rgba(255, 204, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 165, 0, 0.25))';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0) scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1)'}
          >
            🔄 RESTART RUN
          </button>

          {/* Quit Button - Refined Red */}
          <button
            onClick={handleButtonClick(onQuit)}
            onTouchEnd={handleButtonClick(onQuit)}
            className="glow-btn"
            style={{
              padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 5vw, 32px)',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.25), rgba(255, 0, 51, 0.25))',
              border: '2px solid rgba(255, 51, 102, 0.5)',
              borderRadius: '12px',
              color: '#ff3366',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              minHeight: 'clamp(56px, 12vw, 64px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 51, 102, 0.4), rgba(255, 0, 51, 0.4))';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 51, 102, 0.3), 0 0 30px rgba(255, 51, 102, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 51, 102, 0.25), rgba(255, 0, 51, 0.25))';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0) scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1)'}
          >
            🚪 QUIT TO MENU
          </button>

          {/* Settings Button - Refined Blue */}
          {onSettings && (
            <button
              onClick={handleButtonClick(onSettings)}
              onTouchEnd={handleButtonClick(onSettings)}
              className="glow-btn"
              style={{
                padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 5vw, 32px)',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.25), rgba(50, 100, 200, 0.25))',
                border: '2px solid rgba(100, 150, 255, 0.5)',
                borderRadius: '12px',
                color: '#6496ff',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'Orbitron, sans-serif',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                minHeight: 'clamp(56px, 12vw, 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'auto',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 150, 255, 0.4), rgba(50, 100, 200, 0.4))';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(100, 150, 255, 0.3), 0 0 30px rgba(100, 150, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 150, 255, 0.25), rgba(50, 100, 200, 0.25))';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0) scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1)'}
            >
              ⚙️ SETTINGS
            </button>
          )}
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: 'clamp(24px, 5vw, 32px)',
          fontSize: 'clamp(11px, 2.8vw, 14px)',
          color: '#8a8a9e',
          textAlign: 'center',
          opacity: 0.8,
          fontWeight: '400',
          letterSpacing: '0.05em'
        }}>
          Press ESC or tap Resume to continue
        </div>
      </div>
    </div>
  );
}
