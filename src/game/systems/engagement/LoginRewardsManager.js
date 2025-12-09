/**
 * ✅ PHASE 3.1: Login Rewards System with Cloud Sync
 * 7-day weekly calendar + Monthly calendar that rewards daily logins
 * Resets if a day is missed (weekly) or at month end (monthly)
 * 🆕 NOW WITH CLOUD SYNC SUPPORT + AUTO-ROTATING REWARDS
 */

export class LoginRewardsManager {
  constructor(cloudSaveManager = null) {
    this.cloudSaveManager = cloudSaveManager;

    // Weekly calendar state
    this.currentDay = 0;
    this.lastLoginDate = null;
    this.rewardsClaimed = new Set();
    this.streak = 0;
    this.currentWeekNumber = 0;

    // 🆕 Monthly calendar state
    this.monthlyCurrentDay = 0;
    this.monthlyRewardsClaimed = new Set();
    this.currentMonthKey = '';

    this.hasLoadedFromCloud = false;
    this.isSyncing = false;
    this.loadProgress();
    console.log('🎁 [LoginRewards] Constructor - weekly day:', this.currentDay, 'monthly day:', this.monthlyCurrentDay, 'streak:', this.streak);
  }

  // 🆕 Set cloud save manager (can be injected after construction)
  setCloudSaveManager(cloudSaveManager) {
    this.cloudSaveManager = cloudSaveManager;
    console.log('☁️ Login Rewards Manager connected to cloud save');
  }

  // ============= WEEK/MONTH TRACKING FOR AUTO-ROTATION =============

  // Get current week number of the year (1-52)
  getWeekNumber() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  // Get unique month key (e.g., "2025-12")
  getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Get number of days in current month
  getDaysInCurrentMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  // Get current day of month (1-31)
  getCurrentDayOfMonth() {
    return new Date().getDate();
  }

  // Seeded random number generator for deterministic rewards
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // ============= WEEKLY CALENDAR (7-DAY) =============

  // 🆕 Auto-rotating 7-day reward calendar based on week number
  getRewardCalendar() {
    const weekNum = this.getWeekNumber();
    const year = new Date().getFullYear();
    const seed = year * 100 + weekNum; // Unique seed per week

    // Base reward pools
    const coinRewards = [300, 500, 750, 1000, 1500, 2000, 2500];
    const gemRewards = [25, 50, 75, 100, 150];
    const specialRewards = [
      { tokens: 1, description: '1 Revive Token' },
      { tokens: 2, description: '2 Revive Tokens' },
      { trail: 'rainbow', description: 'Rainbow Trail' },
      { trail: 'fire', description: 'Fire Trail' },
      { trail: 'ice', description: 'Ice Trail' }
    ];

    // Generate weekly rewards deterministically
    const calendar = [];
    for (let day = 1; day <= 7; day++) {
      const daySeed = seed * 10 + day;
      const rand = this.seededRandom(daySeed);

      if (day === 7) {
        // Day 7 is always a big reward
        const gemAmount = gemRewards[Math.floor(this.seededRandom(daySeed + 100) * gemRewards.length)];
        const coinAmount = coinRewards[Math.floor(this.seededRandom(daySeed + 200) * 3) + 4]; // Higher coins
        calendar.push({
          day,
          coins: coinAmount,
          gems: gemAmount,
          description: `${coinAmount.toLocaleString()} Coins + ${gemAmount} Gems!`
        });
      } else if (day === 5) {
        // Day 5 is special reward
        const special = specialRewards[Math.floor(this.seededRandom(daySeed + 50) * specialRewards.length)];
        calendar.push({ day, coins: 0, gems: 0, ...special });
      } else if (rand < 0.4) {
        // 40% chance: coins only
        const coinIdx = Math.floor(this.seededRandom(daySeed + 1) * 4); // Lower tier coins
        const coins = coinRewards[coinIdx];
        calendar.push({ day, coins, gems: 0, description: `${coins.toLocaleString()} Coins` });
      } else if (rand < 0.7) {
        // 30% chance: gems
        const gemIdx = Math.floor(this.seededRandom(daySeed + 2) * 3); // Lower tier gems
        const gems = gemRewards[gemIdx];
        calendar.push({ day, coins: 0, gems, description: `${gems} Gems` });
      } else {
        // 30% chance: revive tokens
        const tokens = Math.floor(this.seededRandom(daySeed + 3) * 2) + 1;
        calendar.push({ day, coins: 0, gems: 0, tokens, description: `${tokens} Revive Token${tokens > 1 ? 's' : ''}` });
      }
    }

    console.log(`📅 [Weekly] Generated calendar for week ${weekNum}:`, calendar.map(r => r.description));
    return calendar;
  }

  // ============= MONTHLY CALENDAR (28-31 DAYS) =============

  // 🆕 Auto-rotating monthly reward calendar based on month
  getMonthlyRewardCalendar() {
    const monthKey = this.getMonthKey();
    const daysInMonth = this.getDaysInCurrentMonth();
    const [year, month] = monthKey.split('-').map(Number);
    const seed = year * 100 + month;

    // Enhanced reward pools for monthly
    const coinRewards = [500, 1000, 1500, 2000, 3000, 5000, 7500, 10000];
    const gemRewards = [50, 75, 100, 150, 200, 300];
    const tokenRewards = [1, 2, 3, 5];

    const calendar = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const daySeed = seed * 100 + day;
      const rand = this.seededRandom(daySeed);

      // Special milestone days
      if (day === daysInMonth) {
        // Last day: MEGA reward
        const coins = 15000;
        const gems = 500;
        calendar.push({
          day,
          coins,
          gems,
          description: `🎉 MEGA REWARD: ${coins.toLocaleString()} Coins + ${gems} Gems!`,
          isMega: true
        });
      } else if (day === 15 || day === Math.ceil(daysInMonth / 2)) {
        // Mid-month bonus
        const gems = gemRewards[Math.floor(this.seededRandom(daySeed + 50) * gemRewards.length)];
        const tokens = tokenRewards[Math.floor(this.seededRandom(daySeed + 51) * 2) + 1];
        calendar.push({
          day,
          coins: 0,
          gems,
          tokens,
          description: `Mid-Month Bonus: ${gems} Gems + ${tokens} Tokens`,
          isBonus: true
        });
      } else if (day % 7 === 0) {
        // Every 7th day: weekly milestone
        const coins = coinRewards[Math.floor(this.seededRandom(daySeed + 70) * 4) + 3];
        const gems = gemRewards[Math.floor(this.seededRandom(daySeed + 71) * 2)];
        calendar.push({
          day,
          coins,
          gems,
          description: `Weekly Bonus: ${coins.toLocaleString()} Coins + ${gems} Gems`,
          isWeekly: true
        });
      } else if (rand < 0.5) {
        // 50% coins
        const coinIdx = Math.floor(this.seededRandom(daySeed + 1) * 5);
        const coins = coinRewards[coinIdx];
        calendar.push({ day, coins, gems: 0, description: `${coins.toLocaleString()} Coins` });
      } else if (rand < 0.8) {
        // 30% gems  
        const gemIdx = Math.floor(this.seededRandom(daySeed + 2) * 4);
        const gems = gemRewards[gemIdx];
        calendar.push({ day, coins: 0, gems, description: `${gems} Gems` });
      } else {
        // 20% tokens
        const tokenIdx = Math.floor(this.seededRandom(daySeed + 3) * 3);
        const tokens = tokenRewards[tokenIdx];
        calendar.push({ day, coins: 0, gems: 0, tokens, description: `${tokens} Revive Token${tokens > 1 ? 's' : ''}` });
      }
    }

    console.log(`📅 [Monthly] Generated calendar for ${monthKey} (${daysInMonth} days)`);
    return calendar;
  }

  // ============= CORE METHODS =============

  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('cyber_runner_login_rewards');
      if (saved) {
        const data = JSON.parse(saved);
        // Weekly
        this.currentDay = data.currentDay || 0;
        this.lastLoginDate = data.lastLoginDate || null;
        this.rewardsClaimed = new Set(data.rewardsClaimed || []);
        this.streak = data.streak || 0;
        this.currentWeekNumber = data.currentWeekNumber || 0;
        // Monthly
        this.monthlyCurrentDay = data.monthlyCurrentDay || 0;
        this.monthlyRewardsClaimed = new Set(data.monthlyRewardsClaimed || []);
        this.currentMonthKey = data.currentMonthKey || '';
      }
    } catch (e) {
      console.error('Error loading login rewards:', e);
    }
  }

  async saveProgress() {
    const data = {
      // Weekly
      currentDay: this.currentDay,
      lastLoginDate: this.lastLoginDate,
      rewardsClaimed: Array.from(this.rewardsClaimed),
      streak: this.streak,
      currentWeekNumber: this.currentWeekNumber,
      // Monthly
      monthlyCurrentDay: this.monthlyCurrentDay,
      monthlyRewardsClaimed: Array.from(this.monthlyRewardsClaimed),
      currentMonthKey: this.currentMonthKey,
      lastUpdated: Date.now()
    };

    try {
      localStorage.setItem('cyber_runner_login_rewards', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving login rewards to local:', e);
    }

    if (this.cloudSaveManager && this.cloudSaveManager.initialized) {
      try {
        await this.cloudSaveManager.saveProgress({ loginRewards: data });
        console.log('☁️ Login rewards synced to cloud');
      } catch (e) {
        console.error('Failed to sync login rewards to cloud:', e);
      }
    }
  }

  saveToLocalOnly() {
    const data = {
      currentDay: this.currentDay,
      lastLoginDate: this.lastLoginDate,
      rewardsClaimed: Array.from(this.rewardsClaimed),
      streak: this.streak,
      currentWeekNumber: this.currentWeekNumber,
      monthlyCurrentDay: this.monthlyCurrentDay,
      monthlyRewardsClaimed: Array.from(this.monthlyRewardsClaimed),
      currentMonthKey: this.currentMonthKey,
      lastUpdated: Date.now()
    };
    try {
      localStorage.setItem('cyber_runner_login_rewards', JSON.stringify(data));
      console.log('💾 [LoginRewards] Saved to localStorage only');
    } catch (e) {
      console.error('Error saving login rewards to local:', e);
    }
  }

  async syncFromCloud() {
    if (this.isSyncing) {
      console.log('⏳ [LoginRewards] Sync already in progress, skipping');
      return;
    }

    if (!this.cloudSaveManager || !this.cloudSaveManager.initialized) {
      console.log('⚠️ Cloud save not available for login rewards sync');
      this.checkLoginStreak();
      this.checkMonthlyProgress();
      return;
    }

    this.isSyncing = true;

    try {
      console.log('☁️ [LoginRewards] Starting cloud sync...');
      const cloudData = await this.cloudSaveManager.loadProgress();

      if (cloudData && cloudData.loginRewards) {
        const cloudRewards = cloudData.loginRewards;
        const cloudTime = cloudRewards.lastUpdated || 0;
        const localTime = this.getLocalTimestamp();
        const isFirstSync = !this.hasLoadedFromCloud;

        if (isFirstSync || cloudTime > localTime) {
          console.log('☁️ [LoginRewards] Using cloud data');
          // Weekly
          this.currentDay = cloudRewards.currentDay || 1;
          this.lastLoginDate = cloudRewards.lastLoginDate || null;
          this.rewardsClaimed = new Set(cloudRewards.rewardsClaimed || []);
          this.streak = cloudRewards.streak || 1;
          this.currentWeekNumber = cloudRewards.currentWeekNumber || 0;
          // Monthly
          this.monthlyCurrentDay = cloudRewards.monthlyCurrentDay || 0;
          this.monthlyRewardsClaimed = new Set(cloudRewards.monthlyRewardsClaimed || []);
          this.currentMonthKey = cloudRewards.currentMonthKey || '';

          this.hasLoadedFromCloud = true;
          this.saveToLocalOnly();
        } else {
          this.hasLoadedFromCloud = true;
        }
      } else {
        this.hasLoadedFromCloud = true;
      }

      this.checkLoginStreak();
      this.checkMonthlyProgress();

    } catch (e) {
      console.error('❌ [LoginRewards] Failed to sync from cloud:', e);
      this.checkLoginStreak();
      this.checkMonthlyProgress();
    } finally {
      this.isSyncing = false;
    }
  }

  getLocalTimestamp() {
    try {
      const saved = localStorage.getItem('cyber_runner_login_rewards');
      if (saved) {
        const data = JSON.parse(saved);
        return data.lastUpdated || 0;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  }

  // ============= WEEKLY STREAK CHECK =============

  checkLoginStreak() {
    const today = this.getTodayDateString();
    const currentWeek = this.getWeekNumber();

    // Check if week changed - reset weekly progress
    if (this.currentWeekNumber !== currentWeek) {
      console.log(`🔄 [Weekly] New week detected! Week ${this.currentWeekNumber} -> ${currentWeek}`);
      this.currentWeekNumber = currentWeek;
      this.rewardsClaimed.clear();
      this.currentDay = 0;
    }

    if (!this.lastLoginDate) {
      this.currentDay = 1;
      this.streak = 1;
      this.lastLoginDate = today;
      this.saveProgress();
      console.log('🎉 Welcome! Starting day 1 of login rewards');
      return;
    }

    if (this.lastLoginDate === today) {
      console.log('✅ Already logged in today. Current day:', this.currentDay);
      return;
    }

    const [lastYear, lastMonth, lastDay] = this.lastLoginDate.split('-').map(Number);
    const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
    const lastDate = new Date(lastYear, lastMonth - 1, lastDay);
    const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.currentDay++;
      this.streak++;
      if (this.currentDay > 7) {
        this.currentDay = 1;
        this.rewardsClaimed.clear();
      }
      this.lastLoginDate = today;
      this.saveProgress();
      console.log(`✨ Day ${this.currentDay} login! Streak: ${this.streak} days`);
    } else if (diffDays > 1) {
      console.log('💔 Streak broken! Resetting to day 1');
      this.currentDay = 1;
      this.streak = 1;
      this.rewardsClaimed.clear();
      this.lastLoginDate = today;
      this.saveProgress();
    } else if (diffDays < 0) {
      console.warn('⚠️ Time travel detected! Resetting');
      this.currentDay = 1;
      this.streak = 1;
      this.rewardsClaimed.clear();
      this.lastLoginDate = today;
      this.saveProgress();
    }
  }

  // ============= MONTHLY PROGRESS CHECK =============

  checkMonthlyProgress() {
    const currentMonthKey = this.getMonthKey();
    const todayDay = this.getCurrentDayOfMonth();

    // Check if month changed - reset monthly progress
    if (this.currentMonthKey !== currentMonthKey) {
      console.log(`🔄 [Monthly] New month detected! ${this.currentMonthKey} -> ${currentMonthKey}`);
      this.currentMonthKey = currentMonthKey;
      this.monthlyRewardsClaimed.clear();
    }

    // Update current day of month
    this.monthlyCurrentDay = todayDay;
    this.saveProgress();
  }

  // ============= WEEKLY REWARD METHODS =============

  canClaimToday() {
    const today = this.getTodayDateString();
    return this.lastLoginDate === today && !this.rewardsClaimed.has(this.currentDay);
  }

  hasClaimedToday() {
    const today = this.getTodayDateString();
    return this.lastLoginDate === today && this.rewardsClaimed.has(this.currentDay);
  }

  async claimTodayReward() {
    console.log('🎁 [Weekly] Attempting to claim reward for day', this.currentDay);

    if (!this.canClaimToday()) {
      console.warn('⚠️ [Weekly] Cannot claim today');
      return null;
    }

    const calendar = this.getRewardCalendar();
    const todayReward = calendar.find(r => r.day === this.currentDay);

    if (todayReward) {
      this.rewardsClaimed.add(this.currentDay);
      try {
        await this.saveProgress();
        console.log(`✅ [Weekly] Claimed day ${this.currentDay}:`, todayReward);
        return todayReward;
      } catch (e) {
        this.rewardsClaimed.delete(this.currentDay);
        return null;
      }
    }
    return null;
  }

  getRewards() {
    return this.getRewardStatus();
  }

  getRewardStatus() {
    const calendar = this.getRewardCalendar();
    return calendar.map(reward => ({
      ...reward,
      isClaimed: this.rewardsClaimed.has(reward.day),
      isToday: reward.day === this.currentDay,
      isAvailable: reward.day === this.currentDay && this.canClaimToday()
    }));
  }

  // ============= MONTHLY REWARD METHODS =============

  canClaimMonthly(day) {
    const currentDay = this.getCurrentDayOfMonth();
    // 🆕 Can ONLY claim today's reward - past missed days cannot be claimed
    return day === currentDay && !this.monthlyRewardsClaimed.has(day);
  }

  hasClaimedMonthly(day) {
    return this.monthlyRewardsClaimed.has(day);
  }

  async claimMonthlyReward(day) {
    console.log('🎁 [Monthly] Attempting to claim reward for day', day);

    if (!this.canClaimMonthly(day)) {
      console.warn('⚠️ [Monthly] Cannot claim day', day);
      return null;
    }

    const calendar = this.getMonthlyRewardCalendar();
    const reward = calendar.find(r => r.day === day);

    if (reward) {
      this.monthlyRewardsClaimed.add(day);
      try {
        await this.saveProgress();
        console.log(`✅ [Monthly] Claimed day ${day}:`, reward);
        return reward;
      } catch (e) {
        this.monthlyRewardsClaimed.delete(day);
        return null;
      }
    }
    return null;
  }

  getMonthlyRewardStatus() {
    const calendar = this.getMonthlyRewardCalendar();
    const currentDay = this.getCurrentDayOfMonth();
    return calendar.map(reward => ({
      ...reward,
      isClaimed: this.monthlyRewardsClaimed.has(reward.day),
      isToday: reward.day === currentDay,
      // 🆕 Only today's reward is available - past days are marked as missed
      isAvailable: reward.day === currentDay && !this.monthlyRewardsClaimed.has(reward.day),
      isPast: reward.day < currentDay,
      isFuture: reward.day > currentDay,
      isMissed: reward.day < currentDay && !this.monthlyRewardsClaimed.has(reward.day)  // 🆕 Missed indicator
    }));
  }

  // ============= UTILITY METHODS =============

  getCurrentDay() {
    return this.currentDay;
  }

  getStreak() {
    return this.streak;
  }

  getMonthlyCurrentDay() {
    return this.monthlyCurrentDay;
  }

  getMonthlyClaimedCount() {
    return this.monthlyRewardsClaimed.size;
  }

  async reset() {
    this.currentDay = 0;
    this.lastLoginDate = null;
    this.rewardsClaimed.clear();
    this.streak = 0;
    this.monthlyCurrentDay = 0;
    this.monthlyRewardsClaimed.clear();
    this.currentMonthKey = '';
    await this.saveProgress();
  }

  getDebugInfo() {
    const today = this.getTodayDateString();
    return {
      // Weekly
      currentDay: this.currentDay,
      lastLoginDate: this.lastLoginDate,
      todayDate: today,
      streak: this.streak,
      currentWeek: this.getWeekNumber(),
      savedWeek: this.currentWeekNumber,
      rewardsClaimed: Array.from(this.rewardsClaimed),
      canClaimToday: this.canClaimToday(),
      hasClaimedToday: this.hasClaimedToday(),
      // Monthly
      monthlyCurrentDay: this.monthlyCurrentDay,
      currentMonth: this.getMonthKey(),
      savedMonth: this.currentMonthKey,
      daysInMonth: this.getDaysInCurrentMonth(),
      monthlyRewardsClaimed: Array.from(this.monthlyRewardsClaimed),
      // Cloud
      cloudConnected: !!this.cloudSaveManager,
      cloudInitialized: this.cloudSaveManager?.initialized || false
    };
  }

  async forceSyncNow() {
    console.log('🔄 Force syncing login rewards...');
    await this.syncFromCloud();
    this.checkLoginStreak();
    this.checkMonthlyProgress();
    return this.getDebugInfo();
  }
}

// Export singleton instance
let loginRewardsManagerInstance = null;

export function getLoginRewardsManager(cloudSaveManager = null) {
  if (!loginRewardsManagerInstance) {
    loginRewardsManagerInstance = new LoginRewardsManager(cloudSaveManager);
  } else if (cloudSaveManager && !loginRewardsManagerInstance.cloudSaveManager) {
    loginRewardsManagerInstance.setCloudSaveManager(cloudSaveManager);
  }
  return loginRewardsManagerInstance;
}
