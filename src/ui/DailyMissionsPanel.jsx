import React from 'react';
import './DailyMissionsPanel.css';

export default function DailyMissionsPanel({ missions, onClaim, onClose }) {
  if (!missions) return null;

  const completedCount = missions.filter(m => m.completed).length;
  const allCompleted = completedCount === missions.length;

  return (
    <div className="daily-missions-overlay" onClick={onClose}>
      <div className="daily-missions-panel" onClick={(e) => e.stopPropagation()}>
        <div className="daily-missions-header">
          <h2>📋 Daily Missions</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="missions-progress">
          <div className="progress-text">
            {completedCount} / {missions.length} Complete
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(completedCount / missions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="missions-list">
          {missions.map((mission, index) => (
            <div 
              key={mission.id} 
              className={`mission-card ${mission.completed ? 'completed' : ''}`}
            >
              <div className="mission-icon">
                {mission.completed ? '✅' : '🎯'}
              </div>
              <div className="mission-content">
                <div className="mission-description">{mission.description}</div>
                <div className="mission-progress-bar">
                  <div 
                    className="mission-progress-fill"
                    style={{ width: `${mission.progressPercent}%` }}
                  />
                  <span className="mission-progress-text">
                    {mission.progress} / {mission.target}
                  </span>
                </div>
              </div>
              <div className="mission-reward">
                <div className="reward-amount">+{mission.reward.coins}</div>
                <div className="reward-type">🪙</div>
              </div>
            </div>
          ))}
        </div>

        {allCompleted && (
          <div className="all-complete-banner">
            <div className="banner-text">🎉 All Missions Complete!</div>
            <button className="claim-all-btn" onClick={onClaim}>
              Claim Rewards
            </button>
          </div>
        )}

        <div className="reset-info">
          ⏰ Missions reset at midnight
        </div>
      </div>
    </div>
  );
}
