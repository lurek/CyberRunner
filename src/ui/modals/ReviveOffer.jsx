/**
 * Revive Offer Modal
 * Shows players options to continue after death
 * Multiple revive options: tokens, coins, gems, or watch ad
 */

import React, { useState, useEffect } from 'react';
import { Heart, Coins, Gem, Video, X } from 'lucide-react';
import './ReviveOffer.css';

export default function ReviveOffer({
  visible,
  reviveTokens = 0,
  coins = 0,
  gems = 0,
  adsWatchedToday = 0,
  maxDailyAds = 3,
  onUseToken,
  onUseCoins,
  onUseGems,
  onWatchAd,
  onDecline
}) {
  const [countdown, setCountdown] = useState(10);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Countdown timer
  useEffect(() => {
    if (!visible) {
      setCountdown(10);
      return;
    }
    
    if (countdown <= 0) {
      onDecline();
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [visible, countdown, onDecline]);
  
  // Cost constants
  const COIN_COST = 500;
  const GEM_COST = 50;
  
  // Check affordability
  const canUseToken = reviveTokens > 0;
  const canUseCoins = coins >= COIN_COST;
  const canUseGems = gems >= GEM_COST;
  const canWatchAd = adsWatchedToday < maxDailyAds;
  
  // Has any revive option
  const hasAnyOption = canUseToken || canUseCoins || canUseGems || canWatchAd;
  
  if (!visible) return null;
  
  return (
    <div className="revive-overlay">
      <div className="revive-modal">
        {/* Close button */}
        <button 
          className="revive-close"
          onClick={onDecline}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        {/* Header */}
        <div className="revive-header">
          <div className="revive-icon-large">
            <Heart size={48} />
          </div>
          <h2 className="revive-title">Continue Running?</h2>
          <p className="revive-subtitle">
            Choose how to revive and keep going
          </p>
        </div>
        
        {/* Countdown */}
        <div className="revive-countdown">
          <div className="countdown-circle">
            <svg viewBox="0 0 36 36" className="countdown-svg">
              <path
                className="countdown-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="countdown-fill"
                strokeDasharray={`${(countdown / 10) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="countdown-text">{countdown}s</div>
          </div>
        </div>
        
        {/* Options */}
        <div className="revive-options">
          {/* Watch Ad Option (Best Deal) */}
          {canWatchAd && (
            <ReviveOption
              icon={<Video size={24} />}
              title="Watch Ad"
              subtitle="FREE"
              badge="BEST DEAL"
              enabled={true}
              selected={selectedOption === 'ad'}
              onClick={() => setSelectedOption('ad')}
              color="green"
            />
          )}
          
          {/* Token Option (Premium) */}
          {canUseToken && (
            <ReviveOption
              icon={<Heart size={24} />}
              title="Use Token"
              subtitle={`${reviveTokens} available`}
              enabled={true}
              selected={selectedOption === 'token'}
              onClick={() => setSelectedOption('token')}
              color="cyan"
            />
          )}
          
          {/* Coin Option */}
          <ReviveOption
            icon={<Coins size={24} />}
            title="Pay Coins"
            subtitle={`${COIN_COST} coins`}
            enabled={canUseCoins}
            selected={selectedOption === 'coins'}
            onClick={() => canUseCoins && setSelectedOption('coins')}
            color="gold"
          />
          
          {/* Gem Option (Expensive) */}
          <ReviveOption
            icon={<Gem size={24} />}
            title="Pay Gems"
            subtitle={`${GEM_COST} gems`}
            enabled={canUseGems}
            selected={selectedOption === 'gems'}
            onClick={() => canUseGems && setSelectedOption('gems')}
            color="purple"
          />
        </div>
        
        {/* Warning for no options */}
        {!hasAnyOption && (
          <div className="revive-warning">
            <p>No revive options available</p>
            <p className="revive-warning-sub">
              Earn tokens, coins, or gems to continue
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="revive-actions">
          {selectedOption && (
            <button
              className="revive-btn revive-btn-primary"
              onClick={() => {
                if (selectedOption === 'ad') onWatchAd();
                else if (selectedOption === 'token') onUseToken();
                else if (selectedOption === 'coins') onUseCoins();
                else if (selectedOption === 'gems') onUseGems();
              }}
            >
              <Heart size={18} />
              <span>Revive Now</span>
            </button>
          )}
          
          <button
            className="revive-btn revive-btn-secondary"
            onClick={onDecline}
          >
            <X size={18} />
            <span>Give Up</span>
          </button>
        </div>
        
        {/* Info text */}
        <div className="revive-info">
          {canWatchAd && (
            <p className="revive-info-text">
              📺 {maxDailyAds - adsWatchedToday} free ad revives remaining today
            </p>
          )}
          <p className="revive-info-text">
            💡 You'll continue with 100 HP and 3s invincibility
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual revive option card
 */
function ReviveOption({
  icon,
  title,
  subtitle,
  badge,
  enabled,
  selected,
  onClick,
  color = 'cyan'
}) {
  return (
    <div
      className={`revive-option ${enabled ? 'enabled' : 'disabled'} ${selected ? 'selected' : ''} revive-option-${color}`}
      onClick={enabled ? onClick : undefined}
    >
      {badge && (
        <div className="revive-badge">{badge}</div>
      )}
      
      <div className="revive-option-icon">
        {icon}
      </div>
      
      <div className="revive-option-content">
        <div className="revive-option-title">{title}</div>
        <div className="revive-option-subtitle">{subtitle}</div>
      </div>
      
      {selected && (
        <div className="revive-option-check">✓</div>
      )}
      
      {!enabled && (
        <div className="revive-option-lock">🔒</div>
      )}
    </div>
  );
}
