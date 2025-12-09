/**
 * ✅ PHASE 3.2: Weekly Missions System
 * 
 * Features:
 * - Harder challenges that reset every Sunday
 * - Bigger rewards (coins + gems + exclusive items)
 * - Track weekly progress across multiple runs
 */

import { CONSTANTS } from '../../utils/constants.js';

const WEEKLY_MISSIONS = [
  {
    id: 'weekly_distance',
    name: 'Marathon Runner',
    description: 'Run 50,000m total this week',
    type: 'cumulative',
    target: 50000,
    targetKey: 'totalDistance',
    rewards: { coins: 2000, gems: 50 },
    difficulty: 'medium'
  },
  {
    id: 'weekly_highscore',
    name: 'Record Breaker',
    description: 'Beat your high score 3 times',
    type: 'count',
    target: 3,
    targetKey: 'highScoreBeats',
    rewards: { coins: 1500, gems: 30, specialReward: 'exclusive_skin' },
    difficulty: 'medium'
  },
  {
    id: 'weekly_daily_missions',
    name: 'Dedicated Runner',
    description: 'Complete 15 daily missions',
    type: 'count',
    target: 15,
    targetKey: 'dailyMissionsCompleted',
    rewards: { coins: 3000, gems: 100 },
    difficulty: 'hard'
  },
  {
    id: 'weekly_coins',
    name: 'Treasure Hunter',
    description: 'Collect 10,000 coins this week',
    type: 'cumulative',
    target: 10000,
    targetKey: 'coinsCollected',
    rewards: { coins: 1000, gems: 40 },
    difficulty: 'medium'
  },
  {
    id: 'weekly_powerups',
    name: 'Power Player',
    description: 'Collect 50 power-ups',
    type: 'cumulative',
    target: 50,
    targetKey: 'powerupsCollected',
    rewards: { coins: 1500, gems: 35 },
    difficulty: 'medium'
  },
  {
    id: 'weekly_near_misses',
    name: 'Risk Taker',
    description: 'Get 100 near-miss bonuses',
    type: 'cumulative',
    target: 100,
    targetKey: 'nearMisses',
    rewards: { coins: 2500, gems: 60 },
    difficulty: 'hard'
  },
  {
    id: 'weekly_perfect_runs',
    name: 'Untouchable',
    description: 'Complete 5 runs without taking damage',
    type: 'count',
    target: 5,
    targetKey: 'perfectRuns',
    rewards: { coins: 3500, gems: 80, specialReward: 'legendary_trail' },
    difficulty: 'hard'
  },
  {
    id: 'weekly_grapple',
    name: 'Hook Master',
    description: 'Use grappling hook 200 times',
    type: 'cumulative',
    target: 200,
    targetKey: 'grapplesUsed',
    rewards: { coins: 1800, gems: 45 },
    difficulty: 'medium'
  }
];

export class WeeklyMissionsManager {
  constructor() {
    this.activeMissions = [];
    this.weekStartDate = null;
    this.progress = new Map(); // missionId -> current progress
    this.completedMissions = new Set();
    this.lastHighScore = 0;
    
    this.loadProgress();
    this.checkWeeklyReset();
    this.generateWeeklyMissions();
  }

  /**
   * Check if it's a new week (Sunday) and reset if needed
   */
  checkWeeklyReset() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toDateString();
    
    if (this.weekStartDate !== weekStartStr) {
      console.log('📅 New week detected - resetting Weekly Missions');
      this.weekStartDate = weekStartStr;
      this.progress.clear();
      this.completedMissions.clear();
      this.lastHighScore = 0;
      this.generateWeeklyMissions();
      this.saveProgress();
    }
  }

  /**
   * Generate 3 random weekly missions from the pool
   */
  generateWeeklyMissions() {
    const shuffled = [...WEEKLY_MISSIONS].sort(() => Math.random() - 0.5);
    this.activeMissions = shuffled.slice(0, 3);
    
    // Initialize progress for each mission
    this.activeMissions.forEach(mission => {
      if (!this.progress.has(mission.id)) {
        this.progress.set(mission.id, 0);
      }
    });
    
    console.log('📋 Generated weekly missions:', this.activeMissions.map(m => m.name));
  }

  /**
   * Update progress for a mission
   * @param {string} key - e.g., 'totalDistance', 'coinsCollected'
   * @param {number} value - amount to add
   */
  updateProgress(key, value) {
    this.activeMissions.forEach(mission => {
      if (mission.targetKey === key && !this.completedMissions.has(mission.id)) {
        const currentProgress = this.progress.get(mission.id) || 0;
        const newProgress = mission.type === 'cumulative' 
          ? currentProgress + value 
          : currentProgress + 1;
        
        this.progress.set(mission.id, newProgress);
        
        // Check if completed
        if (newProgress >= mission.target) {
          this.completeMission(mission.id);
        }
        
        this.saveProgress();
      }
    });
  }

  /**
   * Track game end stats for weekly missions
   * @param {Object} stats - { distance, score, coins, powerups, etc. }
   */
  trackGameEnd(stats) {
    // Distance
    if (stats.distance) {
      this.updateProgress('totalDistance', stats.distance);
    }
    
    // Coins
    if (stats.coins) {
      this.updateProgress('coinsCollected', stats.coins);
    }
    
    // High score beats
    if (stats.score > this.lastHighScore) {
      this.lastHighScore = stats.score;
      this.updateProgress('highScoreBeats', 1);
    }
    
    // Perfect run (no damage)
    if (stats.health >= 100) {
      this.updateProgress('perfectRuns', 1);
    }
  }

  /**
   * Track individual actions
   */
  trackAction(action, count = 1) {
    const actionMap = {
      'powerup_collected': 'powerupsCollected',
      'near_miss': 'nearMisses',
      'grapple_used': 'grapplesUsed',
      'daily_mission_completed': 'dailyMissionsCompleted'
    };
    
    const key = actionMap[action];
    if (key) {
      this.updateProgress(key, count);
    }
  }

  /**
   * Mark mission as complete
   */
  completeMission(missionId) {
    if (this.completedMissions.has(missionId)) return;
    
    this.completedMissions.add(missionId);
    const mission = this.activeMissions.find(m => m.id === missionId);
    
    if (mission) {
      console.log(`✅ Weekly Mission Complete: ${mission.name}`);
      console.log(`💰 Rewards: ${mission.rewards.coins} coins, ${mission.rewards.gems} gems`);
      
      // Dispatch event for UI notification
      window.dispatchEvent(new CustomEvent('weeklyMissionComplete', {
        detail: { mission }
      }));
    }
    
    this.saveProgress();
  }

  /**
   * Get all active weekly missions with progress
   */
  getMissions() {
    return this.activeMissions.map(mission => ({
      ...mission,
      progress: this.progress.get(mission.id) || 0,
      completed: this.completedMissions.has(mission.id),
      percentage: Math.min(100, ((this.progress.get(mission.id) || 0) / mission.target) * 100)
    }));
  }

  /**
   * Claim rewards for a completed mission
   */
  claimRewards(missionId) {
    const mission = this.activeMissions.find(m => m.id === missionId);
    if (!mission) return null;
    
    if (!this.completedMissions.has(missionId)) return null;
    
    // Check if already claimed
    const claimedKey = `${missionId}_claimed`;
    if (this.progress.has(claimedKey)) return null;
    
    // Mark as claimed
    this.progress.set(claimedKey, true);
    this.saveProgress();
    
    return mission.rewards;
  }

  /**
   * Check if mission rewards are claimable
   */
  canClaimRewards(missionId) {
    const claimedKey = `${missionId}_claimed`;
    return this.completedMissions.has(missionId) && !this.progress.has(claimedKey);
  }

  /**
   * Get count of completed missions this week
   */
  getCompletedCount() {
    return this.completedMissions.size;
  }

  /**
   * Get total possible rewards this week
   */
  getTotalPossibleRewards() {
    return this.activeMissions.reduce((acc, mission) => {
      acc.coins += mission.rewards.coins || 0;
      acc.gems += mission.rewards.gems || 0;
      return acc;
    }, { coins: 0, gems: 0 });
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      const data = {
        weekStartDate: this.weekStartDate,
        activeMissions: this.activeMissions.map(m => m.id),
        progress: Array.from(this.progress.entries()),
        completedMissions: Array.from(this.completedMissions),
        lastHighScore: this.lastHighScore
      };
      localStorage.setItem('cyberrunner_weekly_missions', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save weekly missions:', e);
    }
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('cyberrunner_weekly_missions');
      if (saved) {
        const data = JSON.parse(saved);
        this.weekStartDate = data.weekStartDate;
        this.progress = new Map(data.progress || []);
        this.completedMissions = new Set(data.completedMissions || []);
        this.lastHighScore = data.lastHighScore || 0;
        
        // Reconstruct active missions
        if (data.activeMissions) {
          this.activeMissions = data.activeMissions
            .map(id => WEEKLY_MISSIONS.find(m => m.id === id))
            .filter(Boolean);
        }
      }
    } catch (e) {
      console.error('Failed to load weekly missions:', e);
    }
  }

  /**
   * Reset (for testing)
   */
  forceReset() {
    this.weekStartDate = null;
    this.progress.clear();
    this.completedMissions.clear();
    this.lastHighScore = 0;
    this.checkWeeklyReset();
    this.saveProgress();
  }
}
