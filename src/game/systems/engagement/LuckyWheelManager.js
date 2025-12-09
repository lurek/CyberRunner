/**
 * ✅ PHASE 3.1: Lucky Wheel System with Cloud Sync
 * * Features:
 * - Daily free spin
 * - Watch ad for extra spins
 * - Weighted rewards (70% coins, 20% tokens, 8% gems, 2% skins)
 * - Satisfying spin animation
 * - ✅ NOW WITH CLOUD SYNC SUPPORT
 */

export class LuckyWheelManager {
  constructor(cloudSaveManager = null) {
    this.cloudSaveManager = cloudSaveManager;
    this.segments = this.createWheelSegments();
    this.freeSpinsRemaining = 0;
    this.adSpinsRemaining = 0;
    this.lastResetDate = null;
    this.totalSpins = 0;
    this.totalRewardsEarned = {
      coins: 0,
      gems: 0,
      tokens: 0,
      skins: 0
    };
    this.hasLoadedFromCloud = false;  // ✅ Track if we've synced from cloud
    this.isSyncing = false;  // ✅ Lock to prevent concurrent syncs

    this.loadProgress();
    // ✅ FIX: Don't call checkDailyReset here - wait for cloud sync
    console.log('🎰 [LuckyWheel] Constructor - freeSpins:', this.freeSpinsRemaining, 'adSpins:', this.adSpinsRemaining);
  }

  // ✅ NEW: Set cloud save manager
  setCloudSaveManager(cloudSaveManager) {
    this.cloudSaveManager = cloudSaveManager;
    console.log('☁️ Lucky Wheel Manager connected to cloud save');
  }

  // ===== WHEEL CONFIGURATION =====
  createWheelSegments() {
    // 12 segments with weighted probabilities (total = 100%)
    return [
      // High probability - Coins (65% total, 6 segments)
      { id: 1, type: 'coins', amount: 100, color: '#ffd700', probability: 12 },
      { id: 2, type: 'coins', amount: 200, color: '#ffed4e', probability: 15 },
      { id: 3, type: 'coins', amount: 300, color: '#ffd700', probability: 12 },
      { id: 4, type: 'coins', amount: 500, color: '#ffed4e', probability: 10 },
      { id: 5, type: 'coins', amount: 750, color: '#ffd700', probability: 8 },
      { id: 6, type: 'coins', amount: 1000, color: '#ffed4e', probability: 8 },

      // Medium probability - Revive Tokens (20% total, 3 segments)
      { id: 7, type: 'token', amount: 1, color: '#ff69b4', probability: 10 },
      { id: 8, type: 'token', amount: 2, color: '#ff1493', probability: 7 },
      { id: 9, type: 'token', amount: 3, color: '#ff69b4', probability: 3 },

      // Low probability - Diamonds/Gems (15% total, 3 segments)
      { id: 10, type: 'gems', amount: 10, color: '#5b8fc7', probability: 8 },
      { id: 11, type: 'gems', amount: 25, color: '#4a7fb8', probability: 5 },
      { id: 12, type: 'gems', amount: 50, color: '#3970a9', probability: 2 }
    ];
  }

  // ===== SPIN LOGIC =====
  // ✅ MODIFIED: Now async
  async spin(type = 'free') {
    // Check if spins available
    if (type === 'free' && this.freeSpinsRemaining <= 0) {
      return { success: false, error: 'No free spins remaining' };
    }

    if (type === 'ad' && this.adSpinsRemaining <= 0) {
      return { success: false, error: 'No ad spins remaining' };
    }

    // Calculate weighted random segment
    const segment = this.getRandomSegment();

    // Deduct spin
    if (type === 'free') {
      this.freeSpinsRemaining--;
    } else if (type === 'ad') {
      this.adSpinsRemaining--;
    }

    this.totalSpins++;

    // Track rewards
    if (segment.type === 'coins') {
      this.totalRewardsEarned.coins += segment.amount;
    } else if (segment.type === 'gems') {
      this.totalRewardsEarned.gems += segment.amount;
    } else if (segment.type === 'token') {
      this.totalRewardsEarned.tokens += segment.amount;
    }

    // ✅ MODIFIED: Now awaits cloud sync
    await this.saveProgress();

    console.log(`🎰 Lucky wheel spin! Reward: ${segment.amount} ${segment.type}`);

    return {
      success: true,
      segment,
      remainingFreeSpins: this.freeSpinsRemaining,
      remainingAdSpins: this.adSpinsRemaining
    };
  }

  getRandomSegment() {
    // Calculate total probability
    const totalProbability = this.segments.reduce((sum, seg) => sum + seg.probability, 0);

    // Random number between 0 and total probability
    let random = Math.random() * totalProbability;

    // Find the segment
    for (const segment of this.segments) {
      random -= segment.probability;
      if (random <= 0) {
        return segment;
      }
    }

    // Fallback (should never happen)
    return this.segments[0];
  }

  // ===== AD SPIN =====
  // ✅ MODIFIED: Now async
  async watchAdForSpin() {
    // In production, this would trigger an ad
    // For now, just add a spin
    this.adSpinsRemaining++;
    await this.saveProgress();

    console.log('📺 Watched ad! Extra spin granted.');
    return { success: true, spinsAdded: 1 };
  }

  // ===== DAILY RESET =====
  checkDailyReset() {
    const today = new Date().toDateString();

    if (this.lastResetDate !== today) {
      console.log('🔄 New day! Resetting lucky wheel spins...');
      this.freeSpinsRemaining = 1; // 1 free spin per day
      this.adSpinsRemaining = 3; // Can watch 3 ads per day
      this.lastResetDate = today;
      this.saveProgress();
    }
  }

  // ===== GETTERS =====
  getSegments() {
    return this.segments;
  }

  getFreeSpinsRemaining() {
    return this.freeSpinsRemaining;
  }

  getAdSpinsRemaining() {
    return this.adSpinsRemaining;
  }

  getTotalSpins() {
    return this.totalSpins;
  }

  getTotalRewards() {
    return this.totalRewardsEarned;
  }

  canSpin() {
    return this.freeSpinsRemaining > 0 || this.adSpinsRemaining > 0;
  }

  // ===== SAVE/LOAD =====
  // ✅ MODIFIED: Now async and saves to cloud
  async saveProgress() {
    const data = {
      freeSpinsRemaining: this.freeSpinsRemaining,
      adSpinsRemaining: this.adSpinsRemaining,
      lastResetDate: this.lastResetDate,
      totalSpins: this.totalSpins,
      totalRewardsEarned: this.totalRewardsEarned,
      lastUpdated: Date.now()
    };

    // 1. Always save to localStorage first
    try {
      localStorage.setItem('cyberrunner_lucky_wheel', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save lucky wheel locally:', e);
    }

    // 2. ✅ NEW: Also save to cloud if available
    if (this.cloudSaveManager && this.cloudSaveManager.initialized) {
      try {
        await this.cloudSaveManager.saveProgress({
          luckyWheel: data
        });
        console.log('☁️ Lucky wheel synced to cloud');
      } catch (e) {
        console.error('Failed to sync lucky wheel to cloud:', e);
      }
    }
  }

  // ✅ NEW: Save to localStorage ONLY (for when applying cloud data)
  saveToLocalOnly() {
    const data = {
      freeSpinsRemaining: this.freeSpinsRemaining,
      adSpinsRemaining: this.adSpinsRemaining,
      lastResetDate: this.lastResetDate,
      totalSpins: this.totalSpins,
      totalRewardsEarned: this.totalRewardsEarned,
      lastUpdated: Date.now()
    };
    try {
      localStorage.setItem('cyberrunner_lucky_wheel', JSON.stringify(data));
      console.log('💾 [LuckyWheel] Saved to localStorage only');
    } catch (e) {
      console.error('Failed to save lucky wheel locally:', e);
    }
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('cyberrunner_lucky_wheel');
      if (saved) {
        const data = JSON.parse(saved);
        this.freeSpinsRemaining = data.freeSpinsRemaining || 0;
        this.adSpinsRemaining = data.adSpinsRemaining || 0;
        this.lastResetDate = data.lastResetDate;
        this.totalSpins = data.totalSpins || 0;
        this.totalRewardsEarned = data.totalRewardsEarned || {
          coins: 0,
          gems: 0,
          tokens: 0,
          skins: 0
        };
      }
    } catch (e) {
      console.error('Failed to load lucky wheel:', e);
    }
  }

  // ✅ NEW: Sync from cloud
  async syncFromCloud() {
    // ✅ Sync lock to prevent concurrent syncs
    if (this.isSyncing) {
      console.log('⏳ [LuckyWheel] Sync already in progress, skipping');
      return;
    }

    if (!this.cloudSaveManager || !this.cloudSaveManager.initialized) {
      console.log('⚠️ Cloud save not available for lucky wheel sync');
      // Still need to check daily reset
      this.checkDailyReset();
      return;
    }

    this.isSyncing = true;

    try {
      console.log('☁️ Syncing lucky wheel from cloud...');
      const cloudData = await this.cloudSaveManager.loadProgress();

      if (cloudData && cloudData.luckyWheel) {
        const cloudWheel = cloudData.luckyWheel;
        const cloudTime = cloudWheel.lastUpdated || 0;
        const localTime = this.getLocalTimestamp();

        // ✅ FIX: On first load, ALWAYS prefer cloud data if it exists
        const isFirstSync = !this.hasLoadedFromCloud;

        console.log('📊 Lucky Wheel Sync comparison:', {
          isFirstSync,
          cloudTime: new Date(cloudTime).toISOString(),
          localTime: new Date(localTime).toISOString(),
          cloudFreeSpins: cloudWheel.freeSpinsRemaining,
          localFreeSpins: this.freeSpinsRemaining,
          cloudAdSpins: cloudWheel.adSpinsRemaining,
          localAdSpins: this.adSpinsRemaining
        });

        // ✅ FIX: Use cloud data if:
        // 1. This is first sync (always trust cloud on fresh load)
        // 2. OR cloud data is newer
        if (isFirstSync || cloudTime > localTime) {
          console.log('☁️ Using cloud lucky wheel data:', isFirstSync ? '(first sync)' : '(cloud is newer)');
          this.freeSpinsRemaining = cloudWheel.freeSpinsRemaining || 0;
          this.adSpinsRemaining = cloudWheel.adSpinsRemaining || 0;
          this.lastResetDate = cloudWheel.lastResetDate || null;
          this.totalSpins = cloudWheel.totalSpins || 0;
          this.totalRewardsEarned = cloudWheel.totalRewardsEarned || {
            coins: 0, gems: 0, tokens: 0, skins: 0
          };

          this.hasLoadedFromCloud = true;
          console.log('✅ [LuckyWheel] Cloud data applied - freeSpins:', this.freeSpinsRemaining);

          // ✅ FIX: Save to localStorage ONLY - don't save back to cloud!
          this.saveToLocalOnly();
        } else {
          console.log('🔕 [LuckyWheel] Local data is current, no sync needed');
          this.hasLoadedFromCloud = true;
        }
      } else {
        console.log('📤 No cloud lucky wheel data found');
        this.hasLoadedFromCloud = true;
      }

      // ✅ Now check daily reset after cloud sync
      this.checkDailyReset();

    } catch (e) {
      console.error('❌ Failed to sync lucky wheel from cloud:', e);
      // Still check daily reset on error
      this.checkDailyReset();
    } finally {
      this.isSyncing = false;
    }
  }

  // ✅ NEW: Get local timestamp
  getLocalTimestamp() {
    try {
      const saved = localStorage.getItem('cyberrunner_lucky_wheel');
      if (saved) {
        const data = JSON.parse(saved);
        return data.lastUpdated || 0;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  }

  reset() {
    this.freeSpinsRemaining = 0;
    this.adSpinsRemaining = 0;
    this.lastResetDate = null;
    this.totalSpins = 0;
    this.totalRewardsEarned = {
      coins: 0,
      gems: 0,
      tokens: 0,
      skins: 0
    };
    try {
      localStorage.removeItem('cyberrunner_lucky_wheel');
    } catch (e) {
      console.error('Failed to reset lucky wheel:', e);
    }
  }
}

// ✅ MODIFIED: Export singleton with cloud support
let luckyWheelManagerInstance = null;

export function getLuckyWheelManager(cloudSaveManager = null) {
  if (!luckyWheelManagerInstance) {
    luckyWheelManagerInstance = new LuckyWheelManager(cloudSaveManager);
  } else if (cloudSaveManager && !luckyWheelManagerInstance.cloudSaveManager) {
    // Inject cloud save manager if not already set
    luckyWheelManagerInstance.setCloudSaveManager(cloudSaveManager);
  }
  return luckyWheelManagerInstance;
}
