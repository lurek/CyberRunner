import React from 'react';
import { Shield, Zap, Magnet, Coins, Flame, Activity, Clock } from 'lucide-react';
import GrappleIndicator from './GrappleIndicator'; 
import AbilityReadyIndicator from './indicators/AbilityReadyIndicator'; 
import { CONSTANTS } from '../utils/constants.js'; 

const HudIcon = ({ icon, color, style }) => (
  <div style={{
    background: 'rgba(28, 28, 60, 0.7)',
    border: `1px solid ${color}`,
    color: color,
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(5px)',
    boxShadow: `0 0 10px ${color}`,
    animation: 'pulse 1.5s infinite',
    ...style
  }}>
    {React.cloneElement(icon, { size: 16 })}
  </div>
);

function GameHUD({
  score,
  distance,
  coins,
  health,
  fps, 
  onPause,
  shield,
  multiplier,
  isMagnetActive,
  isTimeSlowActive, 
  combo,
  difficultyPhase,
  grappleData, 
  playerLane, 
}) {

  const healthPercent = Math.max(0, Math.min(100, health));
  const showCombo = combo && combo.combo > 0; 
  const isHotStreak = combo && combo.combo >= CONSTANTS.COMBO.HOT_STREAK_THRESHOLD;
  const fpsColor = fps >= 50 ? '#00ff00' : fps >= 30 ? '#ffd700' : '#ff0000';

  const handlePauseClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onPause) onPause();
  };

  return (
    <>
      {/* LEFT STATS: Coins, Dist, FPS - Made Compact */}
      <div style={{
        position:'fixed',
        left: 'calc(var(--mobile-padding-left) - 4px)',
        top: 'var(--mobile-padding-top)',
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 'clamp(10px, 1.8vw, 12px)',
        background: 'rgba(26, 26, 46, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '6px 10px',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)',
        minWidth: '80px',
        color: '#b8b8c8',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <Coins size={14} color="#ffd700" /> <span style={{ color: '#fff' }}>{coins}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ opacity: 0.7 }}>DIST</span> <span style={{ color: '#fff' }}>{distance}m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <Activity size={14} color={fpsColor} /> <span style={{ color: fpsColor }}>{fps}</span>
        </div>
      </div>

      {/* COMBO DISPLAY - Moved Up to clear space */}
      {showCombo && (
        <div style={{
          position: 'fixed',
          left: 'calc(var(--mobile-padding-left) - 4px)',
          top: 'calc(var(--mobile-padding-top) + 90px)', 
          zIndex: 70,
          fontFamily: "'Orbitron', sans-serif",
          background: isHotStreak 
            ? 'linear-gradient(135deg, rgba(255, 100, 0, 0.2), rgba(255, 200, 0, 0.2))'
            : 'rgba(12, 8, 40, 0.5)',
          border: `1px solid ${isHotStreak ? '#ff6600' : '#ffd700'}`,
          padding: '6px 10px',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)',
          boxShadow: isHotStreak ? '0 0 15px #ff6600' : '0 0 5px #ffd700',
          animation: isHotStreak ? 'comboFlash 0.5s infinite' : 'none',
          pointerEvents: 'none',
          transformOrigin: 'left top',
          transform: 'scale(0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            {isHotStreak && <Flame size={14} color="#ff6600" />}
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: isHotStreak ? '#ffaa00' : '#ffd700' }}>
              {combo.combo}x
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#cfefff', opacity: 0.9 }}>
            {combo.multiplier.toFixed(1)}x Mult
          </div>
          {/* Combo Timer Bar */}
          <div style={{
            width: '100%', height: '2px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '1px', marginTop: '4px', overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.max(0, (combo.timeRemaining / CONSTANTS.COMBO.TIMEOUT) * 100)}%`,
              height: '100%',
              background: isHotStreak ? 'linear-gradient(90deg, #ff6600, #ffaa00)' : 'linear-gradient(90deg, #ffd700, #ffaa00)',
              transition: 'width 0.1s linear'
            }}></div>
          </div>
        </div>
      )}

      {/* CENTER SCORE - Pushed down to safely clear notch */}
      <div style={{
        position: 'fixed',
        top: 'calc(var(--mobile-padding-top) + 25px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 65,
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 'clamp(24px, 5vw, 32px)',
        fontWeight: '800',
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none',
        letterSpacing: '1px'
      }}>
        {score}
      </div>

      {/* RIGHT: Powerups & Pause - Tighter spacing */}
      <div style={{
        position:'fixed',
        right: 'calc(var(--mobile-padding-right) + 50px)',
        top: 'calc(var(--mobile-padding-top) + 4px)',
        zIndex: 70,
        display: 'flex',
        gap: '4px',
        pointerEvents: 'none'
      }}>
        {shield && <HudIcon icon={<Shield />} color="#5b8fc7" />}
        {multiplier > 1 && <HudIcon icon={<Zap />} color="#ffd700" />}
        {isMagnetActive && <HudIcon icon={<Magnet />} color="#00ff00" />}
        {isTimeSlowActive && <HudIcon icon={<Clock />} color="#aaaaff" />} 
      </div>
      
      {/* PAUSE BUTTON - Standard size but ensured padding */}
      <button 
        onClick={handlePauseClick}
        onTouchStart={handlePauseClick}
        style={{
          position: 'fixed',
          right: 'var(--mobile-padding-right)',
          top: 'var(--mobile-padding-top)',
          zIndex: 10000,
          width: '42px',
          height: '42px',
          background: 'rgba(91, 143, 199, 0.2)',
          border: '2px solid rgba(91, 143, 199, 0.4)',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          padding: 0
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="4" width="4" height="16" rx="1" fill="#5b8fc7" />
          <rect x="14" y="4" width="4" height="16" rx="1" fill="#5b8fc7" />
        </svg>
      </button>

      {/* BOTTOM-LEFT: Health Bar - MOBILE OPTIMIZED */}
      <div style={{
        position: 'fixed',
        bottom: 'clamp(8px, 3vw, 12px)',
        left: 'clamp(8px, 3vw, 12px)',
        width: 'clamp(120px, 28vw, 180px)',
        height: 'clamp(14px, 2.5vw, 16px)',
        background: 'rgba(12, 8, 40, 0.8)',
        border: `${healthPercent < 25 ? '2px' : '1px'} solid ${healthPercent < 25 ? '#ff0000' : 'rgba(255, 0, 0, 0.4)'}`,
        borderRadius: '6px',
        overflow: 'hidden',
        zIndex: 65,
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        boxShadow: `0 0 ${healthPercent < 25 ? '15px' : '8px'} ${healthPercent < 25 ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 0, 0, 0.2)'}`
      }}>
        <div style={{
          width: `${healthPercent}%`,
          height: '100%',
          background: healthPercent > 50 
            ? 'linear-gradient(90deg, #00ff00, #88ff00)' 
            : healthPercent > 25 
              ? 'linear-gradient(90deg, #ffaa00, #ff6600)' 
              : 'linear-gradient(90deg, #ff0000, #ff3300)',
          boxShadow: `0 0 ${healthPercent < 25 ? '12px' : '6px'} ${healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffaa00' : '#ff0000'}`,
          transition: 'width 0.2s ease',
        }}></div>
        <div style={{
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(8px, 2vw, 11px)', 
          fontFamily: "'Orbitron', sans-serif", 
          color: '#ffffff', 
          fontWeight: 'bold', 
          textShadow: '0 0 4px #000',
          pointerEvents: 'none'
        }}>
          ❤️ {Math.round(health)}
        </div>
      </div>

      <GrappleIndicator grappleData={grappleData} />
      <AbilityReadyIndicator grappleData={grappleData} playerLane={playerLane} />
    </>
  );
}

// ✅ FIX #28: Memoize GameHUD to prevent lag on high score updates
export default React.memo(GameHUD, (prevProps, nextProps) => {
  return (
    prevProps.score === nextProps.score &&
    prevProps.distance === nextProps.distance &&
    prevProps.coins === nextProps.coins &&
    prevProps.health === nextProps.health &&
    prevProps.fps === nextProps.fps &&
    prevProps.shield === nextProps.shield &&
    prevProps.multiplier === nextProps.multiplier &&
    prevProps.isMagnetActive === nextProps.isMagnetActive &&
    prevProps.isTimeSlowActive === nextProps.isTimeSlowActive &&
    prevProps.combo === nextProps.combo &&
    prevProps.difficultyPhase === nextProps.difficultyPhase &&
    prevProps.grappleData === nextProps.grappleData &&
    prevProps.playerLane === nextProps.playerLane
  );
});
