/**
 * BoosterSelector.jsx - FIXED RESPONSIVE VERSION
 * Allows player to select which boosters to use before each game starts
 * Shows owned boosters and lets player choose which ones to activate
 */

import React, { useState, useEffect } from 'react';

export default function BoosterSelector({ onStart, onBack, boosterData = {} }) {
  const [selectedBoosters, setSelectedBoosters] = useState({});
  const [totalBoosts, setTotalBoosts] = useState(0);

  const boosterInfo = {
    shield_start: {
      name: '🛡️ Shield Start',
      description: 'Start with shield active',
      icon: '🛡️',
      color: '#5b8fc7'
    },
    speed_start: {
      name: '⚡ Speed Start',
      description: '2x speed multiplier at start',
      icon: '⚡',
      color: '#ffd700'
    },
    magnet_start: {
      name: '🧲 Magnet Start',
      description: 'Magnet active from start',
      icon: '🧲',
      color: '#00ff00'
    },
    score_2x: {
      name: '⭐ 2x Score',
      description: 'Double coin rewards',
      icon: '⭐',
      color: '#ffaa00'
    },
    health_pack: {
      name: '❤️ Health Pack',
      description: '+100 health at start',
      icon: '❤️',
      color: '#ff0000'
    }
  };

  useEffect(() => {
    const count = Object.values(selectedBoosters).reduce((a, b) => a + b, 0);
    setTotalBoosts(count);
  }, [selectedBoosters]);

  const toggleBooster = (boosterId) => {
    const owned = boosterData[boosterId] || 0;
    if (owned <= 0) return;

    setSelectedBoosters(prev => ({
      ...prev,
      [boosterId]: prev[boosterId] ? 0 : 1
    }));
  };

  const handleStart = () => {
    if (onStart) {
      onStart(selectedBoosters);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, rgba(10,10,30,0.98), rgba(20,20,50,0.98))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(10px)',
      overflow: 'auto',
      padding: 'max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'rgba(20,20,50,0.95)',
        border: '2px solid rgba(91,143,199,0.6)',
        borderRadius: '16px',
        padding: 'clamp(20px, 4vw, 32px)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'auto',
        boxShadow: '0 0 40px rgba(91,143,199,0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* HEADER */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid rgba(91,143,199,0.3)'
        }}>
          <h2 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 'bold',
            color: '#00ffff',
            margin: '0 0 8px 0',
            textShadow: '0 0 10px rgba(0,255,255,0.5)'
          }}>
            ⚡ SELECT BOOSTERS
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 'clamp(12px, 3vw, 14px)',
            margin: 0
          }}>
            Choose which boosters to activate for this game
          </p>
        </div>

        {/* BOOSTER GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {Object.entries(boosterInfo).map(([id, info]) => {
            const owned = boosterData[id] || 0;
            const selected = selectedBoosters[id] || 0;
            const isAvailable = owned > 0;

            return (
              <div
                key={id}
                onClick={() => toggleBooster(id)}
                style={{
                  background: selected 
                    ? 'rgba(91,143,199,0.15)' 
                    : 'rgba(30,30,60,0.8)',
                  border: `2px solid ${selected ? info.color : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  position: 'relative',
                  opacity: isAvailable ? 1 : 0.5,
                  boxShadow: selected ? `0 0 20px ${info.color}40` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (isAvailable) {
                    e.currentTarget.style.background = 'rgba(40,40,80,0.9)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAvailable) {
                    e.currentTarget.style.background = selected 
                      ? 'rgba(91,143,199,0.15)' 
                      : 'rgba(30,30,60,0.8)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{
                  fontSize: '32px',
                  minWidth: '32px',
                  textAlign: 'center'
                }}>
                  {info.icon}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#ffffff',
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    {info.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '6px'
                  }}>
                    {info.description}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(91,143,199,0.8)',
                    fontWeight: 600
                  }}>
                    Owned: {owned}
                  </div>
                </div>

                {selected && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: info.color,
                    textShadow: `0 0 10px ${info.color}`
                  }}>
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SELECTED SUMMARY */}
        {totalBoosts > 0 && (
          <div style={{
            background: 'rgba(91,143,199,0.1)',
            border: '1px solid rgba(91,143,199,0.4)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.8)'
          }}>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>
              Selected: {totalBoosts} booster{totalBoosts !== 1 ? 's' : ''}
            </p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>
              These will be applied when you start playing
            </p>
          </div>
        )}

        {/* BUTTONS */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={onBack}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: '2px solid rgba(91,143,199,0.5)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'rgba(91,143,199,0.2)',
              color: '#5b8fc7',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(91,143,199,0.3)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(91,143,199,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(91,143,199,0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ← BACK
          </button>
          
          <button 
            onClick={handleStart}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: '2px solid #00ff00',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'linear-gradient(135deg, #00ff00, #00cc00)',
              color: '#000',
              flex: 1,
              minWidth: '180px',
              maxWidth: '300px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,0,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ▶ PLAY GAME
          </button>
        </div>
      </div>
    </div>
  );
}
