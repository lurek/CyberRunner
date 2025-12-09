// CharacterShop was removed as a dedicated page — functionality handled in CharacterPreviewPage
// Keep a tiny stub export to avoid runtime import failures in case other modules still import it.
import React from 'react';

export default function CharacterShop() {
  return null;
}

/**
 * Character Card Component
 */
function CharacterCard({
  character,
  isOwned,
  isSelected,
  canAfford,
  isFree,
  onPurchase,
  onSelect
}) {
  const stats = character.stats || {};
  
  return (
    <div className={`character-card ${isOwned ? 'owned' : ''} ${isSelected ? 'selected' : ''}`}>
      {/* Selection Indicator */}
      {isSelected && (
        <div className="selected-badge">
          ✓ EQUIPPED
        </div>
      )}
      
      {/* Character Icon */}
      <div className="character-icon">
        <div className="character-avatar">
          {character.id === 'default' && '🏃'}
          {character.id === 'cyberpunk_yiqi' && '🤖'}
          {character.id === 'space_police' && '👮'}
          {character.id === 'space_soldier' && '🛡️'}
          {character.id === 'war_hero' && '⚔️'}
        </div>
      </div>
      
      {/* Character Info */}
      <div className="character-info">
        <h3 className="character-name">{character.name}</h3>
        <p className="character-description">{character.description}</p>
        
        {/* Stats */}
        <div className="character-stats">
          {stats.speed !== 1.0 && (
            <StatBar 
              label="Speed" 
              value={stats.speed} 
              icon="⚡"
              isPositive={stats.speed > 1.0}
            />
          )}
          {stats.jumpHeight !== 1.0 && (
            <StatBar 
              label="Jump" 
              value={stats.jumpHeight} 
              icon="🦘"
              isPositive={stats.jumpHeight > 1.0}
            />
          )}
          {stats.magnetRadius !== 1.0 && (
            <StatBar 
              label="Magnet" 
              value={stats.magnetRadius} 
              icon="🧲"
              isPositive={stats.magnetRadius > 1.0}
            />
          )}
          
          {/* Special Abilities */}
          {stats.startWithShield && (
            <div className="stat-special">
              <span className="stat-icon">🛡️</span>
              <span>Starts with Shield</span>
            </div>
          )}
          {stats.doubleJump && (
            <div className="stat-special">
              <span className="stat-icon">🦘</span>
              <span>Double Jump</span>
            </div>
          )}
          {stats.grappleCooldown && (
            <div className="stat-special">
              <span className="stat-icon">🎯</span>
              <span>-{((1 - stats.grappleCooldown) * 100)}% Grapple CD</span>
            </div>
          )}
          {stats.reviveInvincibility && (
            <div className="stat-special">
              <span className="stat-icon">👻</span>
              <span>{stats.reviveInvincibility}s Invincibility</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Button */}
      <div className="character-actions">
        {isFree ? (
          <button 
            className={`character-btn ${isSelected ? 'btn-equipped' : 'btn-select'}`}
            onClick={onSelect}
          >
            {isSelected ? '✓ Equipped' : 'Select'}
          </button>
        ) : isOwned ? (
          <button 
            className={`character-btn ${isSelected ? 'btn-equipped' : 'btn-select'}`}
            onClick={onSelect}
          >
            {isSelected ? '✓ Equipped' : 'Equip'}
          </button>
        ) : (
          <button 
            className={`character-btn btn-purchase ${!canAfford ? 'btn-disabled' : ''}`}
            onClick={onPurchase}
            disabled={!canAfford}
          >
            {canAfford ? (
              <>
                <span className="btn-icon">💰</span>
                <span>Buy {character.cost.toLocaleString()}</span>
              </>
            ) : (
              <>
                <span className="btn-icon">🔒</span>
                <span>Need {(character.cost - 0).toLocaleString()}</span>
              </>
            )}
          </button>
        )}
        
        {/* Currency Icon */}
        {!isFree && !isOwned && (
          <div className="currency-badge">
            {character.currency === 'coins' ? '🪙 COINS' : '💎 GEMS'}
          </div>
        )}
      </div>
      
      {/* Lock Overlay for Unowned */}
      {!isOwned && !isFree && (
        <div className="lock-overlay">
          <div className="lock-icon">🔒</div>
        </div>
      )}
    </div>
  );
}

/**
 * Stat Bar Component
 */
function StatBar({ label, value, icon, isPositive }) {
  const percentage = ((value - 1) * 100).toFixed(0);
  const displayValue = percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  
  return (
    <div className="stat-row">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
        {displayValue}
      </span>
    </div>
  );
}
