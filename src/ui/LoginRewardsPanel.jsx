import React from 'react';
import './LoginRewardsPanel.css';

export default function LoginRewardsPanel({ rewards, currentDay, streak, onClaim, onClose }) {
  if (!rewards) return null;

  const canClaimToday = rewards.find(r => r.isAvailable);

  return (
    <div className="login-rewards-overlay" onClick={onClose}>
      <div className="login-rewards-panel" onClick={(e) => e.stopPropagation()}>
        <div className="login-rewards-header">
          <h2>🎁 Daily Login Rewards</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="streak-display">
          <div className="streak-icon">🔥</div>
          <div className="streak-info">
            <div className="streak-number">{streak} Day Streak!</div>
            <div className="streak-text">Keep it up!</div>
          </div>
        </div>

        <div className="rewards-calendar">
          {rewards.map((reward) => (
            <div 
              key={reward.day} 
              className={`
                reward-day 
                ${reward.isClaimed ? 'claimed' : ''} 
                ${reward.isToday ? 'today' : ''} 
                ${reward.day === 7 ? 'ultimate' : ''}
              `}
            >
              <div className="day-number">Day {reward.day}</div>
              <div className="reward-icon">
                {reward.isClaimed ? '✓' : 
                 reward.coins > 0 ? '🪙' :
                 reward.gems > 0 ? '💎' :
                 reward.tokens ? '🎟️' :
                 reward.trail ? '✨' :
                 reward.character ? '🎭' : '🎁'}
              </div>
              <div className="reward-description">{reward.description}</div>
              {reward.isToday && !reward.isClaimed && (
                <div className="today-indicator">TODAY!</div>
              )}
              {reward.isClaimed && (
                <div className="claimed-badge">Claimed</div>
              )}
            </div>
          ))}
        </div>

        {canClaimToday && (
          <button className="claim-today-btn" onClick={onClaim}>
            Claim Today's Reward!
          </button>
        )}

        <div className="info-text">
          💡 Log in daily to claim rewards. Missing a day will reset your progress!
        </div>
      </div>
    </div>
  );
}
