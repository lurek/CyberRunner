export class DailyMissionsManager {
  constructor() {
    this.missions = [];
    this.completedToday = new Set();
    this.lastResetDate = this.getTodayDateString();
    this.loadProgress();
    this.generateDailyMissions();
  }

  getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('cyber_runner_daily_missions');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Check if we need to reset (new day)
        if (data.lastResetDate !== this.getTodayDateString()) {
          this.resetDailyProgress();
        } else {
          this.completedToday = new Set(data.completedToday || []);
          this.missions = data.missions || [];
        }
      }
    } catch (e) {
      console.error('Error loading daily missions:', e);
      this.resetDailyProgress();
    }
  }

  saveProgress() {
    try {
      const data = {
        lastResetDate: this.lastResetDate,
        completedToday: Array.from(this.completedToday),
        missions: this.missions
      };
      localStorage.setItem('cyber_runner_daily_missions', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving daily missions:', e);
    }
  }

  resetDailyProgress() {
    this.completedToday.clear();
    this.lastResetDate = this.getTodayDateString();
    this.generateDailyMissions();
    this.saveProgress();
  }

  // Mission templates with various goals
  getMissionTemplates() {
    return [
      { id: 'distance_5k', type: 'distance', target: 5000, reward: { coins: 500 }, description: 'Run 5,000m in a single run' },
      { id: 'distance_3k', type: 'distance', target: 3000, reward: { coins: 300 }, description: 'Run 3,000m in a single run' },
      { id: 'collect_100', type: 'coins', target: 100, reward: { coins: 300 }, description: 'Collect 100 coins in a single run' },
      { id: 'collect_50', type: 'coins', target: 50, reward: { coins: 200 }, description: 'Collect 50 coins in a single run' },
      { id: 'grapple_10', type: 'grapple', target: 10, reward: { coins: 250 }, description: 'Use grapple hook 10 times' },
      { id: 'perfect_10', type: 'near_miss', target: 10, reward: { coins: 350 }, description: 'Get 10 near-miss bonuses' },
      { id: 'no_damage_2k', type: 'no_damage', target: 2000, reward: { coins: 400 }, description: 'Run 2,000m without taking damage' },
      { id: 'combo_20', type: 'combo', target: 20, reward: { coins: 300 }, description: 'Reach a 20x combo' },
      { id: 'powerup_5', type: 'powerup', target: 5, reward: { coins: 200 }, description: 'Collect 5 power-ups' },
      { id: 'score_50k', type: 'score', target: 50000, reward: { coins: 600 }, description: 'Score 50,000 points' },
      { id: 'jump_50', type: 'jump', target: 50, reward: { coins: 150 }, description: 'Jump 50 times' },
    ];
  }

  generateDailyMissions() {
    const templates = this.getMissionTemplates();
    
    // Shuffle and pick 3 missions
    const shuffled = templates.sort(() => Math.random() - 0.5);
    this.missions = shuffled.slice(0, 3).map((template, index) => ({
      ...template,
      progress: 0,
      completed: false,
      index
    }));
    
    console.log('📋 Generated daily missions:', this.missions);
  }

  updateProgress(missionType, value) {
    let updated = false;
    
    this.missions.forEach(mission => {
      if (mission.type === missionType && !mission.completed) {
        mission.progress = Math.max(mission.progress, value);
        
        if (mission.progress >= mission.target) {
          mission.completed = true;
          this.completedToday.add(mission.id);
          updated = true;
          console.log(`✅ Mission completed: ${mission.description}`);
        }
      }
    });
    
    if (updated) {
      this.saveProgress();
    }
    
    return updated;
  }

  getMissions() {
    return this.missions.map(m => ({
      ...m,
      progressPercent: Math.min(100, (m.progress / m.target) * 100)
    }));
  }

  getTotalRewards() {
    return this.missions
      .filter(m => m.completed)
      .reduce((sum, m) => sum + (m.reward.coins || 0), 0);
  }

  getCompletionCount() {
    return this.missions.filter(m => m.completed).length;
  }

  isAllCompleted() {
    return this.missions.every(m => m.completed);
  }

  claimRewards() {
    const rewards = {
      coins: 0,
      gems: 0
    };
    
    this.missions.forEach(mission => {
      if (mission.completed && !mission.claimed) {
        rewards.coins += mission.reward.coins || 0;
        rewards.gems += mission.reward.gems || 0;
        mission.claimed = true;
      }
    });
    
    this.saveProgress();
    return rewards;
  }

  reset() {
    this.resetDailyProgress();
  }
}