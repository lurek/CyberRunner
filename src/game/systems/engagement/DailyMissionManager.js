/**
 * ✅ PHASE 3.1: Daily Missions System with Cloud Sync
 * Features:
 * - 3 random daily missions that reset at midnight
 * - 30+ mission variations
 * - Coin rewards for completion
 * - Progress tracking
 * - 🆕 Cloud sync support
 */

export class DailyMissionManager {
  constructor(cloudSaveManager = null) {
    this.cloudSaveManager = cloudSaveManager;
    this.missions = [];
    this.completedToday = new Set();
    this.sessionStats = this.initSessionStats();
    this.lastResetDate = null;
    this.hasLoadedFromCloud = false;  // ✅ Track if we've synced from cloud
    this.isFirstLoad = true;  // ✅ Track if this is first load (no local data)
    this.isSyncing = false;  // ✅ Lock to prevent concurrent syncs

    // Load saved progress from localStorage
    this.loadProgress();

    // ✅ FIX: Don't generate missions in constructor!
    // Wait for cloud sync first, then generate if needed
    // The syncFromCloud() or initAfterCloudSync() will handle generation
    console.log('📋 [DailyMissions] Constructor - missions from local:', this.missions.length);
  }

  // 🆕 Set cloud save manager (can be injected after construction)
  setCloudSaveManager(cloudSaveManager) {
    this.cloudSaveManager = cloudSaveManager;
    console.log('☁️ Daily Mission Manager connected to cloud save');
  }

  // ✅ NEW: Call this after cloud sync to finalize initialization
  initAfterCloudSync() {
    console.log('📋 [DailyMissions] initAfterCloudSync - current missions:', this.missions.length);

    // Check if we need to reset (new day)
    this.checkDailyReset();

    // If still no missions after cloud sync, generate new ones
    if (this.missions.length === 0) {
      console.log('📋 [DailyMissions] No missions found after cloud sync, generating new ones');
      this.generateDailyMissions();
    }
  }

  initSessionStats() {
    return {
      distanceRun: 0,
      coinsCollected: 0,
      obstaclesHit: 0,
      powerUpsCollected: 0,
      grappleUses: 0,
      wallRunUses: 0,
      perfectSections: 0,
      nearMisses: 0,
      jumps: 0,
      slides: 0,
      runsCompleted: 0,
      totalScore: 0,
      maxCombo: 0,
      adsWatched: 0,
    };
  }

  // ===== MISSION TEMPLATES =====
  getMissionTemplates() {
    return [
      // Distance missions
      {
        id: 'distance_1k',
        type: 'distance',
        target: 1000,
        reward: 300,
        title: 'Sprint',
        description: 'Run 1,000m in a single run',
        icon: '🏃'
      },
      {
        id: 'distance_5k',
        type: 'distance',
        target: 5000,
        reward: 500,
        title: 'Marathon',
        description: 'Run 5,000m in total',
        icon: '🏃',
        cumulative: true
      },
      {
        id: 'distance_10k',
        type: 'distance',
        target: 10000,
        reward: 800,
        title: 'Ultra Runner',
        description: 'Run 10,000m in total',
        icon: '🏃',
        cumulative: true
      },

      // Coin missions
      {
        id: 'coins_50',
        type: 'coins',
        target: 50,
        reward: 200,
        title: 'Coin Collector',
        description: 'Collect 50 coins in a single run',
        icon: '🪙'
      },
      {
        id: 'coins_100',
        type: 'coins',
        target: 100,
        reward: 300,
        title: 'Gold Rush',
        description: 'Collect 100 coins in total',
        icon: '🪙',
        cumulative: true
      },
      {
        id: 'coins_200',
        type: 'coins',
        target: 200,
        reward: 500,
        title: 'Treasure Hunter',
        description: 'Collect 200 coins in total',
        icon: '💰',
        cumulative: true
      },

      // Grapple missions
      {
        id: 'grapple_5',
        type: 'grapple',
        target: 5,
        reward: 200,
        title: 'Hook Master',
        description: 'Use grappling hook 5 times',
        icon: '🪝'
      },
      {
        id: 'grapple_10',
        type: 'grapple',
        target: 10,
        reward: 300,
        title: 'Swing King',
        description: 'Use grappling hook 10 times',
        icon: '🪝'
      },
      {
        id: 'grapple_20',
        type: 'grapple',
        target: 20,
        reward: 500,
        title: 'Grapple God',
        description: 'Use grappling hook 20 times',
        icon: '🪝'
      },

      // Survival missions
      {
        id: 'survive_2k',
        type: 'survive',
        target: 2000,
        reward: 400,
        title: 'Survivor',
        description: 'Survive 2,000m without taking damage',
        icon: '🛡️'
      },
      {
        id: 'no_damage_1k',
        type: 'survive',
        target: 1000,
        reward: 300,
        title: 'Perfect Run',
        description: 'Run 1,000m without hitting obstacles',
        icon: '✨'
      },

      // Power-up missions
      {
        id: 'powerups_3',
        type: 'powerups',
        target: 3,
        reward: 200,
        title: 'Power Player',
        description: 'Collect 3 power-ups',
        icon: '⚡'
      },
      {
        id: 'powerups_5',
        type: 'powerups',
        target: 5,
        reward: 300,
        title: 'Boost Master',
        description: 'Collect 5 power-ups',
        icon: '⚡'
      },

      // Score missions
      {
        id: 'score_5k',
        type: 'score',
        target: 5000,
        reward: 300,
        title: 'Point Collector',
        description: 'Score 5,000 points in a single run',
        icon: '🎯'
      },
      {
        id: 'score_10k',
        type: 'score',
        target: 10000,
        reward: 500,
        title: 'High Scorer',
        description: 'Score 10,000 points',
        icon: '🎯'
      },
      {
        id: 'score_20k',
        type: 'score',
        target: 20000,
        reward: 800,
        title: 'Score Legend',
        description: 'Score 20,000 points',
        icon: '🏆'
      },

      // Combo missions
      {
        id: 'combo_10',
        type: 'combo',
        target: 10,
        reward: 300,
        title: 'Combo Starter',
        description: 'Reach a 10x combo',
        icon: '🔥'
      },
      {
        id: 'combo_20',
        type: 'combo',
        target: 20,
        reward: 500,
        title: 'Combo King',
        description: 'Reach a 20x combo',
        icon: '🔥'
      },

      // Near miss missions
      {
        id: 'near_miss_5',
        type: 'nearMiss',
        target: 5,
        reward: 250,
        title: 'Close Call',
        description: 'Get 5 near misses',
        icon: '⚠️'
      },
      {
        id: 'near_miss_10',
        type: 'nearMiss',
        target: 10,
        reward: 400,
        title: 'Daredevil',
        description: 'Get 10 near misses',
        icon: '💀'
      },

      // Jump/Slide missions
      {
        id: 'jumps_20',
        type: 'jumps',
        target: 20,
        reward: 200,
        title: 'Jumper',
        description: 'Jump 20 times',
        icon: '🦘'
      },
      {
        id: 'slides_15',
        type: 'slides',
        target: 15,
        reward: 200,
        title: 'Slider',
        description: 'Slide 15 times',
        icon: '🛝'
      },

      // Wall run missions
      {
        id: 'wallrun_5',
        type: 'wallrun',
        target: 5,
        reward: 300,
        title: 'Wall Walker',
        description: 'Wall run 5 times',
        icon: '🧗'
      },

      // Run completion missions
      {
        id: 'runs_3',
        type: 'runs',
        target: 3,
        reward: 400,
        title: 'Persistent',
        description: 'Complete 3 runs today',
        icon: '🎮'
      },
      {
        id: 'runs_5',
        type: 'runs',
        target: 5,
        reward: 600,
        title: 'Dedicated',
        description: 'Complete 5 runs today',
        icon: '🎮'
      },

      // Ad missions (optional, for monetization)
      {
        id: 'watch_ad',
        type: 'ads',
        target: 1,
        reward: 100,
        title: 'Supporter',
        description: 'Watch 1 ad',
        icon: '📺'
      },
    ];
  }

  // ===== MISSION GENERATION =====
  generateDailyMissions() {
    const templates = this.getMissionTemplates();
    const selectedMissions = [];

    // Ensure variety: pick from different categories
    const categories = ['distance', 'coins', 'grapple', 'powerups', 'score'];
    const usedCategories = new Set();

    // Shuffle templates
    const shuffled = [...templates].sort(() => Math.random() - 0.5);

    // Pick 3 missions from different categories
    for (const template of shuffled) {
      if (selectedMissions.length >= 3) break;

      if (!usedCategories.has(template.type) || usedCategories.size >= categories.length) {
        selectedMissions.push({
          ...template,
          progress: 0,
          completed: false,
          rewardCollected: false  // ✅ FIX: Initialize this field
        });
        usedCategories.add(template.type);
      }
    }

    this.missions = selectedMissions;
    this.saveProgress();

    console.log('📋 Daily missions generated:', this.missions);
  }

  // ===== PROGRESS TRACKING =====
  updateProgress(statType, value) {
    if (!this.missions || this.missions.length === 0) return false;

    let anyChanged = false;

    this.missions.forEach(mission => {
      if (mission.completed) return;

      // Update progress based on mission type
      if (mission.type === statType) {
        const oldProgress = mission.progress;

        if (mission.cumulative) {
          // Cumulative missions (add to progress)
          mission.progress += value;
        } else {
          // Single-run missions (set progress)
          mission.progress = Math.max(mission.progress, value);
        }

        // Track if progress actually changed
        if (mission.progress !== oldProgress) {
          anyChanged = true;
          console.log(`📈 Mission "${mission.title}" progress: ${oldProgress} → ${mission.progress}/${mission.target}`);
        }

        // Check if completed
        if (mission.progress >= mission.target && !mission.completed) {
          mission.completed = true;
          this.completedToday.add(mission.id);
          console.log(`✅ Mission completed: ${mission.title}`);
        }
      }
    });

    return anyChanged;
  }

  // Update from run stats - now saves progress after all updates
  async updateFromRunStats(runStats) {
    console.log('📋 [DailyMissions] Updating from run stats:', runStats);

    let anyChanged = false;

    anyChanged = this.updateProgress('distance', runStats.distance || 0) || anyChanged;
    anyChanged = this.updateProgress('coins', runStats.coins || 0) || anyChanged;
    anyChanged = this.updateProgress('score', runStats.score || 0) || anyChanged;
    anyChanged = this.updateProgress('combo', runStats.maxCombo || 0) || anyChanged;
    anyChanged = this.updateProgress('grapple', runStats.grappleUses || 0) || anyChanged;
    anyChanged = this.updateProgress('wallrun', runStats.wallRunUses || 0) || anyChanged;
    anyChanged = this.updateProgress('powerups', runStats.powerUpsCollected || 0) || anyChanged;
    anyChanged = this.updateProgress('nearMiss', runStats.nearMisses || 0) || anyChanged;
    anyChanged = this.updateProgress('jumps', runStats.jumps || 0) || anyChanged;
    anyChanged = this.updateProgress('slides', runStats.slides || 0) || anyChanged;
    anyChanged = this.updateProgress('runs', 1) || anyChanged;

    // Check for survival missions
    if (runStats.obstaclesHit === 0) {
      anyChanged = this.updateProgress('survive', runStats.distance || 0) || anyChanged;
    }

    // ✅ Always save progress after updating from run stats
    if (anyChanged) {
      console.log('💾 [DailyMissions] Saving updated progress...');
      await this.saveProgress();
    }

    return anyChanged;
  }

  // ===== REWARD COLLECTION =====
  async collectReward(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.rewardCollected) {
      return null;
    }

    mission.rewardCollected = true;
    await this.saveProgress(); // 🆕 Now async

    console.log(`💰 Collected reward: ${mission.reward} coins for ${mission.title}`);
    return mission.reward;
  }

  // ===== DAILY RESET =====
  checkDailyReset() {
    const today = new Date().toDateString();

    if (this.lastResetDate !== today) {
      console.log('🔄 New day detected! Resetting daily missions...');
      this.lastResetDate = today;
      this.missions = [];
      this.completedToday.clear();
      this.sessionStats = this.initSessionStats();
      this.saveProgress();
      this.generateDailyMissions();
    }
  }

  // ===== GETTERS =====
  getMissions() {
    return this.missions;
  }

  getCompletedCount() {
    return this.missions.filter(m => m.completed).length;
  }

  getTotalRewards() {
    return this.missions
      .filter(m => m.completed && !m.rewardCollected)
      .reduce((sum, m) => sum + m.reward, 0);
  }

  // ===== SAVE/LOAD =====
  async saveProgress() {
    const data = {
      missions: this.missions,
      completedToday: Array.from(this.completedToday),
      lastResetDate: this.lastResetDate,
      sessionStats: this.sessionStats,
      lastUpdated: Date.now()
    };

    // Always save to localStorage first
    try {
      localStorage.setItem('cyberrunner_daily_missions', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save daily missions to local:', e);
    }

    // 🆕 Also save to cloud if available
    if (this.cloudSaveManager && this.cloudSaveManager.initialized) {
      try {
        await this.cloudSaveManager.saveProgress({
          dailyMissions: data
        });
        console.log('☁️ Daily missions synced to cloud');
      } catch (e) {
        console.error('Failed to sync daily missions to cloud:', e);
      }
    }
  }

  // ✅ NEW: Save to localStorage ONLY (for when applying cloud data)
  saveToLocalOnly() {
    const data = {
      missions: this.missions,
      completedToday: Array.from(this.completedToday),
      lastResetDate: this.lastResetDate,
      sessionStats: this.sessionStats,
      lastUpdated: Date.now()
    };
    try {
      localStorage.setItem('cyberrunner_daily_missions', JSON.stringify(data));
      console.log('💾 [DailyMissions] Saved to localStorage only');
    } catch (e) {
      console.error('Failed to save daily missions to local:', e);
    }
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('cyberrunner_daily_missions');
      if (saved) {
        const data = JSON.parse(saved);
        this.missions = data.missions || [];
        this.completedToday = new Set(data.completedToday || []);
        this.lastResetDate = data.lastResetDate;
        this.sessionStats = data.sessionStats || this.initSessionStats();
      }
    } catch (e) {
      console.error('Failed to load daily missions:', e);
    }
  }

  // 🆕 Load from cloud and merge with local
  async syncFromCloud() {
    // ✅ Sync lock to prevent concurrent syncs
    if (this.isSyncing) {
      console.log('⏳ [DailyMissions] Sync already in progress, skipping');
      return;
    }

    if (!this.cloudSaveManager || !this.cloudSaveManager.initialized) {
      console.log('⚠️ [DailyMissions] Cloud save not available for sync');
      // Still need to initialize missions if cloud not available
      this.initAfterCloudSync();
      return;
    }

    this.isSyncing = true;

    try {
      console.log('☁️ [DailyMissions] Starting cloud sync...');
      const cloudData = await this.cloudSaveManager.loadProgress();

      if (cloudData && cloudData.dailyMissions) {
        const cloudMissions = cloudData.dailyMissions;
        const cloudTime = cloudMissions.lastUpdated || 0;
        const localTime = this.getLocalTimestamp();

        // ✅ FIX: On first load, ALWAYS prefer cloud data if it exists
        const isFirstSync = !this.hasLoadedFromCloud;

        console.log('📊 [DailyMissions] Sync comparison:', {
          isFirstSync,
          cloudTime: new Date(cloudTime).toISOString(),
          localTime: new Date(localTime).toISOString(),
          cloudMissionCount: cloudMissions.missions?.length || 0,
          localMissionCount: this.missions.length,
          cloudCompleted: cloudMissions.completedToday?.length || 0,
          localCompleted: this.completedToday.size
        });

        // ✅ FIX: Use cloud data if:
        // 1. This is first sync (always trust cloud on fresh load)
        // 2. OR cloud data is newer
        if (isFirstSync || cloudTime > localTime) {
          console.log('☁️ [DailyMissions] Using cloud data:', isFirstSync ? '(first sync)' : '(cloud is newer)');
          this.missions = cloudMissions.missions || [];
          this.completedToday = new Set(cloudMissions.completedToday || []);
          this.lastResetDate = cloudMissions.lastResetDate;
          this.sessionStats = cloudMissions.sessionStats || this.initSessionStats();

          this.hasLoadedFromCloud = true;
          console.log('✅ [DailyMissions] Cloud data applied locally, missions:', this.missions.length);

          // ✅ FIX: Save to localStorage ONLY - don't save back to cloud!
          this.saveToLocalOnly();
        } else {
          console.log('🔕 [DailyMissions] Local data is current, no sync needed');
          this.hasLoadedFromCloud = true;
        }
      } else {
        console.log('📤 [DailyMissions] No cloud data found');
        this.hasLoadedFromCloud = true;
      }

      // ✅ Now finalize initialization (generate missions if still none)
      this.initAfterCloudSync();

    } catch (e) {
      console.error('❌ [DailyMissions] Failed to sync from cloud:', e);
      // Still need to initialize missions on error
      this.initAfterCloudSync();
    } finally {
      this.isSyncing = false;
    }
  }

  getLocalTimestamp() {
    try {
      const saved = localStorage.getItem('cyberrunner_daily_missions');
      if (saved) {
        const data = JSON.parse(saved);
        return data.lastUpdated || 0;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  }

  async reset() {
    this.missions = [];
    this.completedToday.clear();
    this.sessionStats = this.initSessionStats();
    this.lastResetDate = null;
    try {
      localStorage.removeItem('cyberrunner_daily_missions');

      // 🆕 Also clear from cloud
      if (this.cloudSaveManager && this.cloudSaveManager.initialized) {
        await this.cloudSaveManager.saveProgress({
          dailyMissions: null
        });
      }
    } catch (e) {
      console.error('Failed to reset daily missions:', e);
    }
  }
}

// Export singleton instance
let dailyMissionManagerInstance = null;

export function getDailyMissionManager(cloudSaveManager = null) {
  if (!dailyMissionManagerInstance) {
    dailyMissionManagerInstance = new DailyMissionManager(cloudSaveManager);
  } else if (cloudSaveManager && !dailyMissionManagerInstance.cloudSaveManager) {
    // Inject cloud save manager if not already set
    dailyMissionManagerInstance.setCloudSaveManager(cloudSaveManager);
  }
  return dailyMissionManagerInstance;
}
