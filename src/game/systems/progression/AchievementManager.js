export class AchievementManager {
  constructor() {
    this.achievements = [];
    this.unlockedIds = new Set();
    this.progress = {};
    this.loadProgress();
    this.initializeAchievements();
  }

  initializeAchievements() {
    this.achievements = [
      // Distance Milestones
      {
        id: 'distance_10k',
        category: 'distance',
        name: 'First Marathon',
        description: 'Run 10,000m total',
        icon: '🏃',
        target: 10000,
        reward: { coins: 1000 },
        tier: 'bronze'
      },
      {
        id: 'distance_50k',
        category: 'distance',
        name: 'Chrome Runner',
        description: 'Run 50,000m total',
        icon: '⚡',
        target: 50000,
        reward: { coins: 3000, skin: 'chrome' },
        tier: 'silver'
      },
      {
        id: 'distance_100k',
        category: 'distance',
        name: 'Cyber Legend',
        description: 'Run 100,000m total',
        icon: '👑',
        target: 100000,
        reward: { coins: 5000, gems: 500, character: 'legendary' },
        tier: 'gold'
      },
      {
        id: 'distance_500k',
        category: 'distance',
        name: 'Infinite Runner',
        description: 'Run 500,000m total',
        icon: '🌟',
        target: 500000,
        reward: { coins: 10000, gems: 1000, trail: 'golden' },
        tier: 'platinum'
      },

      // Coin Collector
      {
        id: 'coins_1k',
        category: 'coins',
        name: 'Coin Collector',
        description: 'Collect 1,000 coins total',
        icon: '🪙',
        target: 1000,
        reward: { coins: 500 },
        tier: 'bronze'
      },
      {
        id: 'coins_10k',
        category: 'coins',
        name: 'Treasure Hunter',
        description: 'Collect 10,000 coins total',
        icon: '💰',
        target: 10000,
        reward: { coins: 2000, trail: 'rainbow' },
        tier: 'silver'
      },
      {
        id: 'coins_100k',
        category: 'coins',
        name: 'Money Magnet',
        description: 'Collect 100,000 coins total',
        icon: '💎',
        target: 100000,
        reward: { coins: 5000, gems: 500, character: 'coin_magnet_pro' },
        tier: 'gold'
      },

      // Survival
      {
        id: 'revive_10',
        category: 'survival',
        name: 'Never Give Up',
        description: 'Use 10 revives',
        icon: '♥️',
        target: 10,
        reward: { coins: 1000, tokens: 3 },
        tier: 'bronze'
      },
      {
        id: 'revive_50',
        category: 'survival',
        name: 'Resilient',
        description: 'Use 50 revives',
        icon: '💪',
        target: 50,
        reward: { coins: 3000, gems: 200 },
        tier: 'silver'
      },
      {
        id: 'revive_100',
        category: 'survival',
        name: 'Phoenix',
        description: 'Use 100 revives',
        icon: '🔥',
        target: 100,
        reward: { coins: 5000, gems: 500, character: 'phoenix' },
        tier: 'gold'
      },

      // Skills
      {
        id: 'grapple_100',
        category: 'skills',
        name: 'Grapple Novice',
        description: 'Use grappling hook 100 times',
        icon: '🎯',
        target: 100,
        reward: { coins: 1500 },
        tier: 'bronze'
      },
      {
        id: 'grapple_1000',
        category: 'skills',
        name: 'Grapple Master',
        description: 'Use grappling hook 1,000 times',
        icon: '🪝',
        target: 1000,
        reward: { coins: 5000, gems: 300 },
        tier: 'gold'
      },

      // Perfect Play
      {
        id: 'nodamage_5k',
        category: 'perfect',
        name: 'Untouchable',
        description: 'Run 5,000m without taking damage',
        icon: '🛡️',
        target: 5000,
        reward: { coins: 3000, gems: 200 },
        tier: 'silver'
      },
      {
        id: 'nodamage_10k',
        category: 'perfect',
        name: 'Flawless Victory',
        description: 'Run 10,000m without taking damage',
        icon: '💫',
        target: 10000,
        reward: { coins: 10000, gems: 1000, character: 'untouchable' },
        tier: 'platinum'
      },
      {
        id: 'combo_50',
        category: 'perfect',
        name: 'Combo King',
        description: 'Reach a 50x combo',
        icon: '🔥',
        target: 50,
        reward: { coins: 5000, gems: 500 },
        tier: 'gold'
      },
      {
        id: 'nearmiss_100',
        category: 'perfect',
        name: 'Close Shave',
        description: 'Get 100 near-miss bonuses',
        icon: '⚡',
        target: 100,
        reward: { coins: 3000, gems: 200 },
        tier: 'silver'
      },

      // Score
      {
        id: 'score_100k',
        category: 'score',
        name: 'High Roller',
        description: 'Score 100,000 points in one run',
        icon: '🎯',
        target: 100000,
        reward: { coins: 2000 },
        tier: 'silver'
      },
      {
        id: 'score_500k',
        category: 'score',
        name: 'Score Master',
        description: 'Score 500,000 points in one run',
        icon: '🏆',
        target: 500000,
        reward: { coins: 5000, gems: 500 },
        tier: 'gold'
      },
      {
        id: 'score_1m',
        category: 'score',
        name: 'Cyber Champion',
        description: 'Score 1,000,000 points in one run',
        icon: '👑',
        target: 1000000,
        reward: { coins: 10000, gems: 1000, character: 'champion' },
        tier: 'platinum'
      },

      // Special
      {
        id: 'energy_mode_10',
        category: 'special',
        name: 'Energy Addict',
        description: 'Activate Energy Mode 10 times',
        icon: '⚡',
        target: 10,
        reward: { coins: 2000, gems: 100 },
        tier: 'silver'
      },
      {
        id: 'powerup_100',
        category: 'special',
        name: 'Power User',
        description: 'Collect 100 power-ups',
        icon: '💊',
        target: 100,
        reward: { coins: 2000 },
        tier: 'silver'
      },
      {
        id: 'daily_streak_7',
        category: 'special',
        name: 'Dedicated',
        description: 'Login 7 days in a row',
        icon: '🔥',
        target: 7,
        reward: { coins: 3000, gems: 300 },
        tier: 'gold'
      },
      {
        id: 'daily_streak_30',
        category: 'special',
        name: 'Legendary Streak',
        description: 'Login 30 days in a row',
        icon: '🌟',
        target: 30,
        reward: { coins: 10000, gems: 1000, character: 'dedicated' },
        tier: 'platinum'
      }
    ];
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('cyber_runner_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedIds = new Set(data.unlocked || []);
        this.progress = data.progress || {};
      }
    } catch (e) {
      console.error('Error loading achievements:', e);
    }
  }

  saveProgress() {
    try {
      const data = {
        unlocked: Array.from(this.unlockedIds),
        progress: this.progress
      };
      localStorage.setItem('cyber_runner_achievements', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving achievements:', e);
    }
  }

  updateProgress(category, value) {
    const newlyUnlocked = [];
    
    this.achievements.forEach(achievement => {
      if (achievement.category === category && !this.unlockedIds.has(achievement.id)) {
        // Update progress
        if (!this.progress[achievement.id]) {
          this.progress[achievement.id] = 0;
        }
        
        this.progress[achievement.id] = Math.max(this.progress[achievement.id], value);
        
        // Check if unlocked
        if (this.progress[achievement.id] >= achievement.target) {
          this.unlockedIds.add(achievement.id);
          newlyUnlocked.push(achievement);
          console.log(`🏆 Achievement unlocked: ${achievement.name}`);
        }
      }
    });
    
    if (newlyUnlocked.length > 0) {
      this.saveProgress();
    }
    
    return newlyUnlocked;
  }

  getAchievements() {
    return this.achievements.map(achievement => ({
      ...achievement,
      unlocked: this.unlockedIds.has(achievement.id),
      progress: this.progress[achievement.id] || 0,
      progressPercent: Math.min(100, ((this.progress[achievement.id] || 0) / achievement.target) * 100)
    }));
  }

  getAchievementsByCategory(category) {
    return this.getAchievements().filter(a => a.category === category);
  }

  getRecentUnlocked(count = 5) {
    return this.achievements
      .filter(a => this.unlockedIds.has(a.id))
      .slice(-count)
      .reverse();
  }

  getTotalUnlocked() {
    return this.unlockedIds.size;
  }

  getTotalRewards() {
    const rewards = { coins: 0, gems: 0 };
    this.achievements.forEach(achievement => {
      if (this.unlockedIds.has(achievement.id)) {
        rewards.coins += achievement.reward.coins || 0;
        rewards.gems += achievement.reward.gems || 0;
      }
    });
    return rewards;
  }

  getCompletionPercent() {
    return Math.round((this.unlockedIds.size / this.achievements.length) * 100);
  }

  reset() {
    this.unlockedIds.clear();
    this.progress = {};
    this.saveProgress();
  }
}