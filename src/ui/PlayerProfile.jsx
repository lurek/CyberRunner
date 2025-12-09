/**
 * ✅ PHASE 4: PLAYER PROFILE & LEADERBOARDS
 * - Display player stats and achievements
 * - Global and friends leaderboards
 * - Profile customization
 * - Cloud sync status
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Trophy, Target, Clock, Coins, 
  TrendingUp, Award, Share2, Edit, Cloud, Mail, 
  Star, Zap, Shield
} from 'lucide-react';

export default function PlayerProfile({
  visible,
  onBack,
  playerData, // { name, email, stats, achievements }
  leaderboardData, // { global, friends }
  isCloudSynced,
  onNameChange,
  onSignOut
}) {
  const [activeTab, setActiveTab] = useState('stats');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(playerData?.name || '');

  const handleSaveName = () => {
    if (newName.trim() && onNameChange) {
      onNameChange(newName.trim());
    }
    setEditingName(false);
  };

  if (!visible) return null;

  const stats = playerData?.stats || {
    totalDistance: 0,
    totalCoins: 0,
    totalDeaths: 0,
    totalGrapples: 0,
    bestScore: 0,
    totalPlayTime: 0,
    gamesPlayed: 0,
    achievementsUnlocked: 0
  };

  return (
    <div
      className="neon-panel"
      style={{
        minWidth: Math.min(480, window.innerWidth - 40),
        maxWidth: 600,
        width: '90%',
        maxHeight: '85vh',
        fontFamily: "'Orbitron', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'relative',
          padding: '20px',
          borderBottom: '2px solid rgba(91, 143, 199, 0.2)',
          flexShrink: 0
        }}
      >
        <button
          className="icon-btn"
          onClick={onBack}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="neon-title" style={{ fontSize: 24, textAlign: 'center' }}>
          PLAYER PROFILE
        </div>
      </div>

      {/* Profile Card */}
      <div
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(91, 143, 199, 0.1), rgba(155, 127, 199, 0.1))',
          borderBottom: '1px solid rgba(91, 143, 199, 0.2)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(91, 143, 199, 0.3), transparent)',
              border: '3px solid #5b8fc7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <User size={40} color="#5b8fc7" />
          </div>

          {/* Name & Email */}
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  maxLength={20}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '2px solid #5b8fc7',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                />
                <button
                  className="glow-btn btn-primary"
                  onClick={handleSaveName}
                  style={{ padding: '8px 16px', fontSize: 14 }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={() => setEditingName(true)}
              >
                <span>{playerData?.name || 'Player'}</span>
                <Edit size={16} opacity={0.6} />
              </div>
            )}

            {playerData?.email && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#5b8fc7',
                  marginTop: 4,
                  opacity: 0.8
                }}
              >
                <Mail size={12} />
                <span>{playerData.email}</span>
              </div>
            )}

            {/* Cloud Status */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                marginTop: 8,
                background: isCloudSynced
                  ? 'rgba(0, 255, 100, 0.2)'
                  : 'rgba(255, 100, 0, 0.2)',
                border: `1px solid ${isCloudSynced ? '#00ff88' : '#ffaa00'}`,
                borderRadius: 12,
                fontSize: 11,
                color: isCloudSynced ? '#00ff88' : '#ffaa00'
              }}
            >
              <Cloud size={12} />
              <span>{isCloudSynced ? 'Cloud Synced' : 'Offline Mode'}</span>
            </div>
          </div>

          {/* Share Button */}
          <button
            className="icon-btn"
            title="Share Profile"
            style={{
              padding: 12,
              background: 'rgba(91, 143, 199, 0.1)',
              border: '2px solid rgba(91, 143, 199, 0.3)'
            }}
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(91, 143, 199, 0.1)',
          flexShrink: 0
        }}
      >
        <TabButton
          label="Stats"
          icon={<TrendingUp size={16} />}
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
        />
        <TabButton
          label="Leaderboard"
          icon={<Trophy size={16} />}
          active={activeTab === 'leaderboard'}
          onClick={() => setActiveTab('leaderboard')}
        />
        <TabButton
          label="Achievements"
          icon={<Award size={16} />}
          active={activeTab === 'achievements'}
          onClick={() => setActiveTab('achievements')}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'stats' && <StatsTab stats={stats} />}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab 
            leaderboardData={leaderboardData} 
            currentPlayerName={playerData?.name}
          />
        )}
        {activeTab === 'achievements' && (
          <AchievementsTab achievements={playerData?.achievements || []} />
        )}
      </div>

      {/* Sign Out Button */}
      {isCloudSynced && onSignOut && (
        <div style={{ padding: '16px', borderTop: '1px solid rgba(91, 143, 199, 0.2)' }}>
          <button
            className="glow-btn"
            onClick={onSignOut}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 50, 50, 0.2)',
              border: '2px solid rgba(255, 50, 50, 0.5)',
              color: '#ff5555',
              fontSize: 14
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ============= STATS TAB =============
function StatsTab({ stats }) {
  const statCards = [
    { 
      label: 'Best Score', 
      value: stats.bestScore.toLocaleString(), 
      icon: <Trophy size={20} />,
      color: '#ffd700'
    },
    { 
      label: 'Total Distance', 
      value: `${Math.floor(stats.totalDistance).toLocaleString()}m`, 
      icon: <Target size={20} />,
      color: '#5b8fc7'
    },
    { 
      label: 'Total Coins', 
      value: stats.totalCoins.toLocaleString(), 
      icon: <Coins size={20} />,
      color: '#ffaa00'
    },
    { 
      label: 'Games Played', 
      value: stats.gamesPlayed.toLocaleString(), 
      icon: <Zap size={20} />,
      color: '#9b7fc7'
    },
    { 
      label: 'Play Time', 
      value: formatTime(stats.totalPlayTime), 
      icon: <Clock size={20} />,
      color: '#00ff88'
    },
    { 
      label: 'Deaths', 
      value: stats.totalDeaths.toLocaleString(), 
      icon: <Shield size={20} />,
      color: '#ff5555'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      {statCards.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: `2px solid ${color}33`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 15px ${color}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>{value}</div>
    </div>
  );
}

// ============= LEADERBOARD TAB =============
function LeaderboardTab({ leaderboardData, currentPlayerName }) {
  const [activeBoard, setActiveBoard] = useState('global');

  const globalData = leaderboardData?.global || [];
  const friendsData = leaderboardData?.friends || [];

  return (
    <div>
      {/* Board Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className="touch-target-sm"
          onClick={() => setActiveBoard('global')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeBoard === 'global' ? 'rgba(91, 143, 199, 0.2)' : 'rgba(0, 0, 0, 0.3)',
            border: activeBoard === 'global' ? '2px solid #5b8fc7' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            color: activeBoard === 'global' ? '#5b8fc7' : '#888',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Global Top 100
        </button>
        <button
          className="touch-target-sm"
          onClick={() => setActiveBoard('friends')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeBoard === 'friends' ? 'rgba(91, 143, 199, 0.2)' : 'rgba(0, 0, 0, 0.3)',
            border: activeBoard === 'friends' ? '2px solid #5b8fc7' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            color: activeBoard === 'friends' ? '#5b8fc7' : '#888',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Friends
        </button>
      </div>

      {/* Leaderboard List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(activeBoard === 'global' ? globalData : friendsData).length === 0 ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              color: '#888',
              fontSize: 14
            }}
          >
            {activeBoard === 'global' 
              ? 'Loading leaderboard...' 
              : 'Add friends to see their scores!'}
          </div>
        ) : (
          (activeBoard === 'global' ? globalData : friendsData).map((entry, idx) => (
            <LeaderboardEntry
              key={idx}
              rank={idx + 1}
              name={entry.name}
              score={entry.score}
              isCurrentPlayer={entry.name === currentPlayerName}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LeaderboardEntry({ rank, name, score, isCurrentPlayer }) {
  const getRankColor = () => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return '#5b8fc7';
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        background: isCurrentPlayer ? 'rgba(91, 143, 199, 0.1)' : 'rgba(0, 0, 0, 0.3)',
        border: isCurrentPlayer ? '2px solid #5b8fc7' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `${getRankColor()}22`,
          border: `2px solid ${getRankColor()}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 'bold',
          color: getRankColor(),
          flexShrink: 0
        }}
      >
        {rank <= 3 ? <Trophy size={16} /> : rank}
      </div>

      {/* Name */}
      <div style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: isCurrentPlayer ? 'bold' : 'normal' }}>
        {name}
        {isCurrentPlayer && <span style={{ color: '#5b8fc7', marginLeft: 8 }}>(You)</span>}
      </div>

      {/* Score */}
      <div style={{ fontSize: 16, fontWeight: 'bold', color: getRankColor() }}>
        {score.toLocaleString()}
      </div>
    </div>
  );
}

// ============= ACHIEVEMENTS TAB =============
function AchievementsTab({ achievements }) {
  if (achievements.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#888', padding: '30px', fontSize: 14 }}>
        Complete challenges to unlock achievements!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {achievements.map((achievement, idx) => (
        <AchievementCard key={idx} achievement={achievement} />
      ))}
    </div>
  );
}

function AchievementCard({ achievement }) {
  return (
    <div
      style={{
        padding: '16px',
        background: achievement.unlocked ? 'rgba(0, 255, 100, 0.1)' : 'rgba(0, 0, 0, 0.3)',
        border: achievement.unlocked ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: achievement.unlocked ? 1 : 0.6
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: achievement.unlocked ? 'rgba(0, 255, 100, 0.2)' : 'rgba(100, 100, 100, 0.2)',
          border: `2px solid ${achievement.unlocked ? '#00ff88' : '#555'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: achievement.unlocked ? '#00ff88' : '#555',
          flexShrink: 0
        }}
      >
        <Star size={24} fill={achievement.unlocked ? '#00ff88' : 'none'} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
          {achievement.name}
        </div>
        <div style={{ fontSize: 12, color: '#aaa' }}>
          {achievement.description}
        </div>
        {achievement.unlocked && (
          <div style={{ fontSize: 11, color: '#00ff88', marginTop: 4 }}>
            ✓ Unlocked
          </div>
        )}
      </div>
    </div>
  );
}

// ============= TAB BUTTON =============
function TabButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="touch-target-sm"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px',
        background: active ? 'rgba(91, 143, 199, 0.2)' : 'rgba(0, 0, 0, 0.3)',
        border: active ? '2px solid #5b8fc7' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        color: active ? '#5b8fc7' : '#888',
        fontSize: 13,
        fontWeight: active ? 'bold' : 'normal',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ============= HELPERS =============
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
