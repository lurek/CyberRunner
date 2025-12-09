import React from 'react';
import { RefreshCw, Home as HomeIcon, Heart } from 'lucide-react';

export default function GameOverMenu({ score, coins, onRestart, onQuit, reviveTokens = 0, onRevive }) {
  const finalScore = Number(score) || 0;
  const finalCoins = Number(coins) || 0;

  // Inline styles to override any CSS conflicts
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    fontFamily: "'Orbitron', sans-serif",
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    padding: '20px',
    boxSizing: 'border-box'
  };

  const buttonContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    columnGap: '16px',
    rowGap: '16px',
    width: '100%',
    maxWidth: '340px',
    marginTop: '8px',
    boxSizing: 'border-box'
  };

  const baseButtonStyle = {
    width: '100%',
    minWidth: '0',
    height: '56px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
    fontSize: 'clamp(12px, 3vw, 14px)',
    letterSpacing: '0.8px',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', sans-serif",
    padding: '0 16px',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const restartButtonStyle = {
    ...baseButtonStyle,
    background: 'linear-gradient(135deg, rgba(91, 143, 199, 0.3), rgba(91, 143, 199, 0.2))',
    border: '2px solid rgba(91, 143, 199, 0.5)',
    color: '#5b8fc7',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
  };

  const quitButtonStyle = {
    ...baseButtonStyle,
    background: 'rgba(26, 26, 46, 0.4)',
    border: '2px solid rgba(155, 127, 199, 0.4)',
    color: '#9b7fc7',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
  };

  const reviveButtonStyle = {
    ...baseButtonStyle,
    background: 'linear-gradient(135deg, rgba(255, 50, 50, 0.3), rgba(255, 50, 50, 0.2))',
    border: '2px solid rgba(255, 50, 50, 0.5)',
    color: '#ff5050',
    boxShadow: '0 4px 16px rgba(255, 0, 0, 0.3)',
    gridColumn: '1 / -1' // Span full width
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h2 style={{
        fontSize: 'clamp(28px, 7vw, 40px)',
        fontWeight: 900,
        margin: 0,
        color: '#fff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: 'clamp(2px, 0.5vw, 4px)',
        lineHeight: 1.1
      }}>
        GAME OVER
      </h2>

      {/* Stats Card */}
      <div style={{
        color: '#b8b8c8',
        fontSize: 'clamp(14px, 3.5vw, 16px)',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        width: '100%',
        maxWidth: '340px',
        boxSizing: 'border-box'
      }}>
        {/* Score */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <span style={{
            fontSize: 'clamp(9px, 2.2vw, 11px)',
            color: '#8a8a9e',
            letterSpacing: '1.2px',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            SCORE
          </span>
          <span style={{
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            color: '#ffd700',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
            fontWeight: 'bold',
            lineHeight: 1
          }}>
            {finalScore.toLocaleString()}
          </span>
        </div>

        {/* Divider */}
        <div style={{
          width: '2px',
          height: '40px',
          background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.15), transparent)'
        }} />

        {/* Coins */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <span style={{
            fontSize: 'clamp(9px, 2.2vw, 11px)',
            color: '#8a8a9e',
            letterSpacing: '1.2px',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            COINS
          </span>
          <span style={{
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            color: '#ffd700',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
            fontWeight: 'bold',
            lineHeight: 1
          }}>
            {finalCoins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Buttons Container - FIXED WITH CSS GRID */}
      <div style={buttonContainerStyle}>
        {/* Revive Button */}
        {reviveTokens > 0 && onRevive && (
          <button onClick={onRevive} style={reviveButtonStyle}>
            <Heart size={18} strokeWidth={2.5} />
            <span>REVIVE ({reviveTokens})</span>
          </button>
        )}

        {/* Restart Button */}
        <button
          onClick={onRestart}
          style={restartButtonStyle}
        >
          <RefreshCw size={18} strokeWidth={2.5} />
          <span>RESTART</span>
        </button>

        {/* Quit Button */}
        <button
          onClick={onQuit}
          style={quitButtonStyle}
        >
          <HomeIcon size={18} strokeWidth={2.5} />
          <span>QUIT</span>
        </button>
      </div>
    </div>
  );
}
