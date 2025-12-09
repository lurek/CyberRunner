import React, { useState } from 'react';
import './AchievementsPanel.css';

export default function AchievementsPanel({ achievements, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!achievements) return null;

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'distance', name: 'Distance', icon: '🏃' },
    { id: 'coins', name: 'Coins', icon: '🪙' },
    { id: 'survival', name: 'Survival', icon: '♥️' },
    { id: 'skills', name: 'Skills', icon: '🎯' },
    { id: 'perfect', name: 'Perfect', icon: '💫' },
    { id: 'score', name: 'Score', icon: '🏆' },
    { id: 'special', name: 'Special', icon: '⭐' }
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

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
    <div className="achievements-overlay" onClick={onClose}>
      <div className="achievements-panel" onClick={(e) => e.stopPropagation()}>
        <div className="achievements-header">
          <h2>🏆 Achievements</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="achievements-stats">
          <div className="stat-item">
            <div className="stat-value">{unlockedCount} / {totalCount}</div>
            <div className="stat-label">Unlocked</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{completionPercent}%</div>
            <div className="stat-label">Complete</div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
          </div>
        </div>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="tab-icon">{cat.icon}</span>
              <span className="tab-name">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="achievements-list">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} tier-${achievement.tier}`}
            >
              <div className="achievement-icon">
                {achievement.unlocked ? achievement.icon : '🔒'}
              </div>
              <div className="achievement-content">
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-description">{achievement.description}</div>
                <div className="achievement-progress-bar">
                  <div
                    className="achievement-progress-fill"
                    style={{ width: `${achievement.progressPercent}%` }}
                  ></div>
                  <span className="achievement-progress-text">
                    {achievement.progress} / {achievement.target}
                  </span>
                </div>
                <div className="achievement-reward">
                  {achievement.reward.coins && (
                    <span className="reward-item">🪙 {achievement.reward.coins}</span>
                  )}
                  {achievement.reward.gems && (
                    <span className="reward-item">💎 {achievement.reward.gems}</span>
                  )}
                  {achievement.reward.character && (
                    <span className="reward-item">🎭 Character</span>
                  )}
                  {achievement.reward.skin && (
                    <span className="reward-item">✨ Skin</span>
                  )}
                  {achievement.reward.trail && (
                    <span className="reward-item">💫 Trail</span>
                  )}
                </div>
              </div>
              <div
                className="achievement-tier-badge"
                style={{ background: getTierColor(achievement.tier) }}
              >
                {achievement.tier.toUpperCase()}
              </div>
              {achievement.unlocked && (
                <div className="achievement-unlocked-badge">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
