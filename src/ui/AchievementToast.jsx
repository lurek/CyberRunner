import React, { useEffect, useState } from 'react';
import './AchievementToast.css';

export default function AchievementToast({ achievement, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for fade out
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return '#888';
    }
  };

  return (
    <div className={`achievement-toast ${isVisible ? 'visible' : ''}`}>
      <div className="toast-sparkles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${20 + i * 6}%`,
            animationDelay: `${i * 0.1}s`
          }}>✨</div>
        ))}
      </div>
      
      <div className="toast-header">
        <div className="toast-title">🏆 Achievement Unlocked!</div>
        <button className="toast-close" onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}>×</button>
      </div>

      <div className="toast-content">
        <div className="toast-icon">
          {achievement.icon}
        </div>
        <div className="toast-details">
          <div 
            className="toast-tier"
            style={{ background: getTierColor(achievement.tier) }}
          >
            {achievement.tier.toUpperCase()}
          </div>
          <div className="toast-name">{achievement.name}</div>
          <div className="toast-description">{achievement.description}</div>
          <div className="toast-rewards">
            {achievement.reward.coins && (
              <span className="reward-badge">🪙 +{achievement.reward.coins}</span>
            )}
            {achievement.reward.gems && (
              <span className="reward-badge">💎 +{achievement.reward.gems}</span>
            )}
            {achievement.reward.character && (
              <span className="reward-badge">🎭 Character Unlocked!</span>
            )}
            {achievement.reward.skin && (
              <span className="reward-badge">✨ Skin Unlocked!</span>
            )}
            {achievement.reward.trail && (
              <span className="reward-badge">💫 Trail Unlocked!</span>
            )}
          </div>
        </div>
      </div>

      <div className="toast-progress-bar">
        <div className="toast-progress-fill"></div>
      </div>
    </div>
  );
}

// Container component to manage multiple toasts
export function AchievementToastContainer({ achievements, onDismiss }) {
  const [currentToast, setCurrentToast] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (achievements && achievements.length > 0 && !currentToast) {
      setCurrentToast(achievements[0]);
      setQueue(achievements.slice(1));
    }
  }, [achievements, currentToast]);

  const handleClose = () => {
    onDismiss?.(currentToast);
    
    if (queue.length > 0) {
      setTimeout(() => {
        setCurrentToast(queue[0]);
        setQueue(queue.slice(1));
      }, 500);
    } else {
      setCurrentToast(null);
    }
  };

  return (
    <AchievementToast 
      achievement={currentToast} 
      onClose={handleClose}
    />
  );
}
