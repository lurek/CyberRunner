/**
 * AbilityButtons.jsx - ENHANCED v4
 * ✅ Shows 3 main abilities with activation indicators
 * ✅ Display cooldown indicators and charge counters
 * ✅ Responsive layout at the bottom of screen
 * 
 * Abilities: ⚡ Lightning, 🛡️ Shield, 🚀 Speed Boost
 */

import React, { useState, useEffect } from 'react';
import './AbilityButtons.css';

export default function AbilityButtons({ 
  abilityStates, 
  onLightningActivate,
  onShieldActivate,
  onSpeedBoostActivate
}) {
  const abilities = abilityStates || {
    lightning: {},
    shield: {},
    speedBoost: {}
  };

  // Format cooldown percentage for display
  const formatCooldown = (percent) => {
    if (percent === undefined) return '0%';
    return `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
  };

  // Render individual ability button
  const renderAbilityButton = (abilityKey, ability, emojiIcon, label, onActivate) => {
    // Safety check: if ability is undefined, return placeholder
    if (!ability) {
      ability = { active: false, ready: false, cooldownPercent: 0, charges: 0 };
    }
    
    const isActive = !!ability.active;
    const isReady = !!ability.ready;
    const cooldownPercent = ability.cooldownPercent || 0;
    const charges = ability.charges || 0;

    return (
      <button 
        key={abilityKey}
        className={`ability-button ${isActive ? 'active' : ''} ${isReady ? 'ready' : 'cooldown'}`}
        onClick={onActivate}
        title={`${label} - Level ${ability.level || 1}`}
        aria-label={`Activate ${label} ability - ${isReady ? 'Ready' : `Cooldown ${cooldownPercent}%`}`}
        disabled={!isReady && !isActive}
      >
        <div className="ability-icon" aria-hidden="true">{emojiIcon}</div>
        
        {/* Active indicator */}
        {isActive && (
          <div className="ability-active-indicator">
            <div className="pulse"></div>
          </div>
        )}
        
        {/* Cooldown ring */}
        {!isReady && cooldownPercent < 100 && (
          <div className="cooldown-ring" style={{
            background: `conic-gradient(#4CAF50 ${cooldownPercent}%, transparent ${cooldownPercent}%)`
          }}>
            <div className="cooldown-text">{formatCooldown(cooldownPercent)}</div>
          </div>
        )}
        
        {/* Charge counter for Speed Boost */}
        {abilityKey === 'speedBoost' && charges > 0 && (
          <div className="charge-indicator">
            {charges}
          </div>
        )}
        
        {/* Ready indicator */}
        {isReady && !isActive && (
          <div className="ready-glow"></div>
        )}
        
        <div className="ability-label">{label}</div>
      </button>
    );
  };

  return (
    <div className="ability-buttons-container">
      <div className="ability-buttons-grid">
        {renderAbilityButton(
          'lightning',
          abilities.lightning,
          '⚡',
          'Lightning',
          onLightningActivate
        )}
        
        {renderAbilityButton(
          'shield',
          abilities.shield,
          '🛡️',
          'Shield',
          onShieldActivate
        )}
        
        {renderAbilityButton(
          'speedBoost',
          abilities.speedBoost,
          '🚀',
          'Speed',
          onSpeedBoostActivate
        )}
      </div>
    </div>
  );
}

