/**
 * ✅ PHASE 3: Complete Engagement Hub
 * 
 * Unified panel for:
 * - Daily Missions
 * - Weekly Missions  
 * - Login Rewards
 * - Lucky Wheel
 * - Word Hunt
 * - Achievements
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Trophy, Gift, Sparkles, Target, 
  Clock, Coins, Gem, Star, ChevronRight, Check,
  Award, Flame, Zap
} from 'lucide-react';
import './EngagementHub.css';

export default function EngagementHub({ 
  visible, 
  onClose,
  dailyMissions = [],
  weeklyMissions = [],
  loginRewards = {},
  wordHuntProgress = { collected: 0, total: 5, letters: [] },
  achievements = [],
  onClaimDailyMission,
  onClaimWeeklyMission,
  onClaimLoginReward,
  onClaimWordHunt,
  onSpinWheel
}) {
  const [activeTab, setActiveTab] = useState('daily');

  if (!visible) return null;

  return (
    <div className="engagement-hub-overlay">
      <div className="engagement-hub-panel">
        {/* Header */}
        <div className="hub-header">
          <div className="hub-title">
            <Sparkles size={24} color="#5b8fc7" />
            <span>MISSIONS & REWARDS</span>
          </div>
          <button className="hub-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="hub-tabs">
          <HubTab
            icon={<Target size={16} />}
            label="Daily"
            active={activeTab === 'daily'}
            onClick={() => setActiveTab('daily')}
            badge={dailyMissions.filter(m => m.completed && !m.claimed).length}
          />
          <HubTab
            icon={<Calendar size={16} />}
            label="Weekly"
            active={activeTab === 'weekly'}
            onClick={() => setActiveTab('weekly')}
            badge={weeklyMissions.filter(m => m.completed && !m.claimed).length}
          />
          <HubTab
            icon={<Gift size={16} />}
            label="Login"
            active={activeTab === 'login'}
            onClick={() => setActiveTab('login')}
            badge={loginRewards.canClaim ? 1 : 0}
          />
          <HubTab
            icon={<Sparkles size={16} />}
            label="Word Hunt"
            active={activeTab === 'wordhunt'}
            onClick={() => setActiveTab('wordhunt')}
            badge={wordHuntProgress.collected === wordHuntProgress.total ? 1 : 0}
          />
          <HubTab
            icon={<Trophy size={16} />}
            label="Achievements"
            active={activeTab === 'achievements'}
            onClick={() => setActiveTab('achievements')}
            badge={achievements.filter(a => a.unlocked && !a.claimed).length}
          />
        </div>

        {/* Content Area */}
        <div className="hub-content">
          {activeTab === 'daily' && (
            <DailyMissionsTab 
              missions={dailyMissions}
              onClaim={onClaimDailyMission}
            />
          )}
          
          {activeTab === 'weekly' && (
            <WeeklyMissionsTab
              missions={weeklyMissions}
              onClaim={onClaimWeeklyMission}
            />
          )}
          
          {activeTab === 'login' && (
            <LoginRewardsTab
              rewards={loginRewards}
              onClaim={onClaimLoginReward}
            />
          )}
          
          {activeTab === 'wordhunt' && (
            <WordHuntTab
              progress={wordHuntProgress}
              onClaim={onClaimWordHunt}
            />
          )}
          
          {activeTab === 'achievements' && (
            <AchievementsTab
              achievements={achievements}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============= TAB BUTTON =============
function HubTab({ icon, label, active, onClick, badge = 0 }) {
  return (
    <button
      className={`hub-tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="hub-tab-icon">
        {icon}
        {badge > 0 && (
          <span className="hub-tab-badge">{badge}</span>
        )}
      </div>
      <span className="hub-tab-label">{label}</span>
    </button>
  );
}

// ============= DAILY MISSIONS TAB =============
function DailyMissionsTab({ missions, onClaim }) {
  return (
    <div className="missions-container">
      <div className="tab-header">
        <h3><Clock size={18} /> Daily Missions</h3>
        <p>Complete 3 missions daily for bonus rewards!</p>
      </div>

      <div className="missions-list">
        {missions.map((mission, index) => (
          <MissionCard
            key={mission.id || index}
            mission={mission}
            onClaim={onClaim}
          />
        ))}
      </div>

      <div className="missions-footer">
        <div className="refresh-timer">
          <Clock size={14} />
          <span>Resets in: {getTimeUntilMidnight()}</span>
        </div>
      </div>
    </div>
  );
}

// ============= WEEKLY MISSIONS TAB =============
function WeeklyMissionsTab({ missions, onClaim }) {
  const completedCount = missions.filter(m => m.completed).length;
  const totalRewards = missions.reduce((acc, m) => {
    if (m.completed) {
      acc.coins += m.rewards?.coins || 0;
      acc.gems += m.rewards?.gems || 0;
    }
    return acc;
  }, { coins: 0, gems: 0 });

  return (
    <div className="missions-container">
      <div className="tab-header">
        <h3><Calendar size={18} /> Weekly Missions</h3>
        <p>Harder challenges, bigger rewards! Resets every Sunday.</p>
        <div className="weekly-progress">
          <div className="progress-stat">
            <span>Completed:</span>
            <strong>{completedCount}/3</strong>
          </div>
          <div className="progress-stat">
            <Coins size={14} color="#ffd700" />
            <strong>{totalRewards.coins}</strong>
          </div>
          <div className="progress-stat">
            <Gem size={14} color="#9b7fc7" />
            <strong>{totalRewards.gems}</strong>
          </div>
        </div>
      </div>

      <div className="missions-list">
        {missions.map((mission, index) => (
          <MissionCard
            key={mission.id || index}
            mission={mission}
            onClaim={onClaim}
            isWeekly
          />
        ))}
      </div>

      <div className="missions-footer">
        <div className="refresh-timer">
          <Calendar size={14} />
          <span>Resets: {getNextSunday()}</span>
        </div>
      </div>
    </div>
  );
}

// ============= MISSION CARD =============
function MissionCard({ mission, onClaim, isWeekly = false }) {
  const progressPercent = Math.min(100, (mission.progress / mission.target) * 100);
  const canClaim = mission.completed && !mission.claimed;

  return (
    <div className={`mission-card ${mission.completed ? 'completed' : ''} ${canClaim ? 'claimable' : ''}`}>
      <div className="mission-icon">
        {getDifficultyIcon(mission.difficulty)}
      </div>

      <div className="mission-content">
        <div className="mission-header">
          <h4>{mission.name}</h4>
          {mission.difficulty && (
            <span className={`difficulty-badge ${mission.difficulty}`}>
              {mission.difficulty}
            </span>
          )}
        </div>
        
        <p className="mission-desc">{mission.description}</p>

        {/* Progress Bar */}
        <div className="mission-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-text">
            {mission.progress}/{mission.target}
          </span>
        </div>

        {/* Rewards */}
        <div className="mission-rewards">
          {mission.rewards?.coins && (
            <div className="reward-item">
              <Coins size={14} color="#ffd700" />
              <span>{mission.rewards.coins}</span>
            </div>
          )}
          {mission.rewards?.gems && (
            <div className="reward-item">
              <Gem size={14} color="#9b7fc7" />
              <span>{mission.rewards.gems}</span>
            </div>
          )}
          {mission.rewards?.specialReward && (
            <div className="reward-item special">
              <Star size={14} color="#ffaa00" />
              <span>Special</span>
            </div>
          )}
        </div>
      </div>

      {/* Claim Button */}
      <div className="mission-action">
        {mission.claimed ? (
          <div className="claimed-badge">
            <Check size={16} />
            <span>Claimed</span>
          </div>
        ) : canClaim ? (
          <button 
            className="claim-btn"
            onClick={() => onClaim(mission.id)}
          >
            <Gift size={16} />
            Claim
          </button>
        ) : (
          <div className="in-progress">
            <ChevronRight size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============= LOGIN REWARDS TAB =============
function LoginRewardsTab({ rewards, onClaim }) {
  const { streak = 0, canClaim = false, calendar = [] } = rewards;

  return (
    <div className="login-rewards-container">
      <div className="tab-header">
        <h3><Gift size={18} /> Login Rewards</h3>
        <p>Collect rewards for logging in daily!</p>
        <div className="streak-display">
          <Flame size={20} color="#ff6600" />
          <span>{streak} Day Streak</span>
        </div>
      </div>

      <div className="calendar-grid">
        {calendar.map((day, index) => (
          <DayCard
            key={index}
            day={index + 1}
            reward={day}
            current={day.current}
            claimed={day.claimed}
            canClaim={day.current && canClaim}
          />
        ))}
      </div>

      {canClaim && (
        <button className="claim-login-btn" onClick={onClaim}>
          <Gift size={20} />
          Claim Today's Reward
        </button>
      )}

      <div className="login-footer">
        <p>⚠️ Miss a day and your streak resets!</p>
      </div>
    </div>
  );
}

function DayCard({ day, reward, current, claimed, canClaim }) {
  return (
    <div className={`day-card ${current ? 'current' : ''} ${claimed ? 'claimed' : ''} ${canClaim ? 'claimable' : ''}`}>
      <div className="day-number">Day {day}</div>
      <div className="day-reward">
        {reward.coins && (
          <div className="reward-amount">
            <Coins size={16} color="#ffd700" />
            <span>{reward.coins}</span>
          </div>
        )}
        {reward.gems && (
          <div className="reward-amount">
            <Gem size={16} color="#9b7fc7" />
            <span>{reward.gems}</span>
          </div>
        )}
        {reward.special && (
          <div className="reward-special">
            <Star size={16} color="#ffaa00" />
            <span>{reward.special}</span>
          </div>
        )}
      </div>
      {claimed && (
        <div className="claimed-check">
          <Check size={20} />
        </div>
      )}
    </div>
  );
}

// ============= WORD HUNT TAB =============
function WordHuntTab({ progress, onClaim }) {
  const { collected = 0, total = 5, letters = [], canClaim = false } = progress;
  const word = ['C', 'Y', 'B', 'E', 'R'];

  return (
    <div className="wordhunt-container">
      <div className="tab-header">
        <h3><Sparkles size={18} /> Word Hunt</h3>
        <p>Find all 5 letters during your runs!</p>
      </div>

      <div className="word-display">
        {word.map((letter, index) => (
          <div 
            key={index}
            className={`letter-box ${letters.includes(letter) ? 'collected' : ''}`}
          >
            {letters.includes(letter) ? letter : '?'}
          </div>
        ))}
      </div>

      <div className="wordhunt-progress">
        <div className="progress-label">
          Progress: {collected}/{total}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(collected / total) * 100}%` }}
          />
        </div>
      </div>

      {collected === total ? (
        <div className="wordhunt-complete">
          <div className="complete-message">
            <Trophy size={32} color="#ffd700" />
            <h3>Word Complete!</h3>
          </div>
          <div className="complete-rewards">
            <div className="reward-large">
              <Coins size={24} color="#ffd700" />
              <span>5,000 Coins</span>
            </div>
            <div className="reward-large">
              <Gem size={24} color="#9b7fc7" />
              <span>100 Gems</span>
            </div>
          </div>
          {canClaim && (
            <button className="claim-wordhunt-btn" onClick={onClaim}>
              <Gift size={20} />
              Claim Rewards
            </button>
          )}
        </div>
      ) : (
        <div className="wordhunt-hint">
          <p>💡 Letters spawn randomly on the track. Keep your eyes open!</p>
          <p>🔄 Resets daily at midnight</p>
        </div>
      )}
    </div>
  );
}

// ============= ACHIEVEMENTS TAB =============
function AchievementsTab({ achievements }) {
  const categorized = {
    distance: achievements.filter(a => a.category === 'distance'),
    coins: achievements.filter(a => a.category === 'coins'),
    survival: achievements.filter(a => a.category === 'survival'),
    special: achievements.filter(a => a.category === 'special')
  };

  return (
    <div className="achievements-container">
      <div className="tab-header">
        <h3><Trophy size={18} /> Achievements</h3>
        <p>Unlock achievements to earn rewards!</p>
      </div>

      {Object.entries(categorized).map(([category, items]) => (
        items.length > 0 && (
          <div key={category} className="achievement-category">
            <h4 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div className="achievements-list">
              {items.map((achievement, index) => (
                <AchievementCard key={achievement.id || index} achievement={achievement} />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function AchievementCard({ achievement }) {
  const progressPercent = Math.min(100, (achievement.progress / achievement.target) * 100);

  return (
    <div className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}>
      <div className="achievement-icon">
        {achievement.unlocked ? <Trophy size={24} color="#ffd700" /> : <Award size={24} color="#666" />}
      </div>
      <div className="achievement-info">
        <h5>{achievement.name}</h5>
        <p>{achievement.description}</p>
        {!achievement.unlocked && (
          <div className="achievement-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span>{achievement.progress}/{achievement.target}</span>
          </div>
        )}
        {achievement.unlocked && achievement.rewards && (
          <div className="achievement-rewards">
            {achievement.rewards.coins && <span>+{achievement.rewards.coins} 🪙</span>}
            {achievement.rewards.gems && <span>+{achievement.rewards.gems} 💎</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= HELPER FUNCTIONS =============
function getDifficultyIcon(difficulty) {
  switch (difficulty) {
    case 'easy': return <Target size={20} color="#00ff00" />;
    case 'medium': return <Target size={20} color="#ffaa00" />;
    case 'hard': return <Zap size={20} color="#ff0000" />;
    default: return <Target size={20} color="#5b8fc7" />;
  }
}

function getTimeUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function getNextSunday() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  
  return nextSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
