/**
 * Leaderboard UI Component
 * Displays global, weekly, and friends leaderboards
 */

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import './Leaderboard.css';

export default function Leaderboard({
  visible,
  leaderboardManager,
  currentUserId,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('global'); // global, weekly, friends
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerRank, setPlayerRank] = useState(null);
  const [currentWeek, setCurrentWeek] = useState('');
  
  // Load leaderboard data
  useEffect(() => {
    if (!visible || !leaderboardManager?.initialized) return;
    
    loadLeaderboard();
    
    // Subscribe to real-time updates
    const unsubscribe = leaderboardManager.subscribeToLeaderboard(
      activeTab,
      (data) => {
        setLeaderboard(data);
        setLoading(false);
      }
    );
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible, activeTab, leaderboardManager]);
  
  // Load player rank
  useEffect(() => {
    if (!visible || !leaderboardManager?.initialized) return;
    
    leaderboardManager.getPlayerRank().then(rank => {
      setPlayerRank(rank);
    });
  }, [visible, leaderboardManager, leaderboard]);
  
  // Get current week
  useEffect(() => {
    if (leaderboardManager?.initialized) {
      setCurrentWeek(leaderboardManager.getCurrentWeek());
    }
  }, [leaderboardManager]);
  
  const loadLeaderboard = async () => {
    setLoading(true);
    
    try {
      let data;
      if (activeTab === 'global') {
        data = await leaderboardManager.getGlobalLeaderboard();
      } else if (activeTab === 'weekly') {
        data = await leaderboardManager.getWeeklyLeaderboard();
      } else {
        // Friends leaderboard (filter by friends list)
        data = await leaderboardManager.getGlobalLeaderboard();
        // TODO: Filter by friends list
      }
      
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!visible) return null;
  
  // Check if leaderboard is available
  const isAvailable = leaderboardManager?.initialized;
  
  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-panel">
        {/* Header */}
        <div className="leaderboard-header">
          <div className="leaderboard-title">
            <Trophy size={28} />
            <h2>Leaderboards</h2>
          </div>
          <button className="leaderboard-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        {/* Not Available Message */}
        {!isAvailable && (
          <div className="leaderboard-unavailable">
            <AlertCircle size={48} />
            <h3>Leaderboards Unavailable</h3>
            <p>Please sign in to view and compete on leaderboards</p>
          </div>
        )}
        
        {/* Available - Show Content */}
        {isAvailable && (
          <>
            {/* Player Rank Card */}
            {playerRank && (
              <div className="player-rank-card">
                <div className="player-rank-label">Your Rank</div>
                <div className="player-rank-value">
                  #{playerRank.rank}
                  <span className="player-rank-total">
                    of {playerRank.total.toLocaleString()}
                  </span>
                </div>
                <div className="player-rank-score">
                  {playerRank.score.toLocaleString()} points
                </div>
              </div>
            )}
            
            {/* Tabs */}
            <div className="leaderboard-tabs">
              <button
                className={`leaderboard-tab ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => setActiveTab('global')}
              >
                <TrendingUp size={18} />
                <span>Global</span>
              </button>
              
              <button
                className={`leaderboard-tab ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
              >
                <Clock size={18} />
                <span>Weekly</span>
              </button>
              
              <button
                className={`leaderboard-tab ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
                disabled
              >
                <Users size={18} />
                <span>Friends</span>
                <span className="coming-soon">Soon</span>
              </button>
            </div>
            
            {/* Weekly Info */}
            {activeTab === 'weekly' && (
              <div className="leaderboard-info">
                <Clock size={14} />
                <span>Week {currentWeek} • Resets Monday</span>
              </div>
            )}
            
            {/* Leaderboard List */}
            <div className="leaderboard-list">
              {loading ? (
                <div className="leaderboard-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading leaderboard...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                  <Trophy size={48} />
                  <p>No scores yet</p>
                  <p className="leaderboard-empty-sub">
                    Be the first to set a record!
                  </p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <LeaderboardEntry
                    key={entry.id}
                    rank={index + 1}
                    entry={entry}
                    isCurrentPlayer={entry.userId === currentUserId}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Individual leaderboard entry
 */
function LeaderboardEntry({ rank, entry, isCurrentPlayer }) {
  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };
  
  const medal = getMedalIcon(rank);
  
  return (
    <div className={`leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''} ${rank <= 3 ? 'top-three' : ''}`}>
      <div className="entry-rank">
        {medal || `#${rank}`}
      </div>
      
      <div className="entry-avatar">
        {entry.character === 'speed_demon' && '⚡'}
        {entry.character === 'tank' && '🛡️'}
        {entry.character === 'coin_magnet' && '🧲'}
        {entry.character === 'neon_ninja' && '🥷'}
        {entry.character === 'cyber_samurai' && '⚔️'}
        {entry.character === 'holo_ghost' && '👻'}
        {entry.character === 'default' && '🤖'}
      </div>
      
      <div className="entry-info">
        <div className="entry-name">
          {entry.userName || 'Anonymous'}
          {isCurrentPlayer && <span className="you-badge">YOU</span>}
        </div>
        <div className="entry-stats">
          <span>{entry.distance?.toLocaleString() || 0}m</span>
          <span>•</span>
          <span>{entry.coins?.toLocaleString() || 0} coins</span>
        </div>
      </div>
      
      <div className="entry-score">
        {entry.score?.toLocaleString() || 0}
      </div>
    </div>
  );
}
