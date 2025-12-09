/**
 * ✅ PHASE 3.1: Login Rewards System
 * 7-day calendar that rewards daily logins
 * Resets if a day is missed
 */

export class LoginRewardsManager {
  constructor() {
    this.currentDay = 0;
    this.lastLoginDate = null;
    this.rewardsClaimed = new Set();
    this.streak = 0;
    this.loadProgress();
    this.checkLoginStreak();
  }

  // 7-day reward calendar
  getRewardCalendar() {
    return [
      { day: 1, coins: 500, gems: 0, description: '500 Coins' },
      { day: 2, coins: 0, gems: 0, tokens: 1, description: '1 Revive Token' },
      { day: 3, coins: 1000, gems: 0, description: '1,000 Coins' },
      { day: 4, coins: 0, gems: 50, description: '50 Gems' },
      { day: 5, coins: 0, gems: 0, trail: 'rainbow', description: 'Rainbow Trail' },
      { day: 6, coins: 2000, gems: 0, description: '2,000 Coins' },
      { day: 7, coins: 0, gems: 100, character: 'speed_demon', description: 'Speed Demon Character + 100 Gems!' }
    ];
  }

  getTodayDateString() {
    const now = new Date();
    // ✅ FIXED: Pad month and day with leading zeros for consistent comparison
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
        this.currentDay = data.currentDay || 0;
        this.lastLoginDate = data.lastLoginDate || null;
        this.rewardsClaimed = new Set(data.rewardsClaimed || []);
        this.streak = data.streak || 0;
      }
    } catch (e) {
      console.error('Error loading login rewards:', e);
    }
  }

  saveProgress() {
    try {
      const data = {
        currentDay: this.currentDay,
        lastLoginDate: this.lastLoginDate,
        rewardsClaimed: Array.from(this.rewardsClaimed),
        streak: this.streak
      };
      localStorage.setItem('cyber_runner_login_rewards', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving login rewards:', e);
    }
  }

  checkLoginStreak() {
    const today = this.getTodayDateString();
    
    // First time login
    if (!this.lastLoginDate) {
      this.currentDay = 1;
      this.streak = 1;
      this.lastLoginDate = today;
      this.saveProgress();
      console.log('🎉 Welcome! Starting day 1 of login rewards');
      return;
    }
    
    // Same day - no change
    if (this.lastLoginDate === today) {
      console.log('✅ Already logged in today. Current day:', this.currentDay);
      return;
    }
    
    // ✅ FIXED: Proper date comparison using Date objects
    // Parse dates correctly - format is YYYY-MM-DD
    const [lastYear, lastMonth, lastDay] = this.lastLoginDate.split('-').map(Number);
    const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
    
    const lastDate = new Date(lastYear, lastMonth - 1, lastDay);
    const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
    
    // Calculate difference in days
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('📅 Date check:', {
      lastLoginDate: this.lastLoginDate,
      today,
      diffDays,
      lastDate: lastDate.toDateString(),
      todayDate: todayDate.toDateString()
    });
    
    if (diffDays === 1) {
      // Continue streak - logged in exactly 1 day later
      this.currentDay++;
      this.streak++;
      
      // Reset after day 7
      if (this.currentDay > 7) {
        this.currentDay = 1;
        this.rewardsClaimed.clear();
        console.log('🔄 Login rewards reset! Starting new cycle');
      }
      
      this.lastLoginDate = today;
      this.saveProgress();
      console.log(`✨ Day ${this.currentDay} login! Streak: ${this.streak} days`);
    } else if (diffDays > 1) {
      // Streak broken - missed one or more days
      console.log('💔 Streak broken! Resetting to day 1');
      this.currentDay = 1;
      this.streak = 1;
      this.rewardsClaimed.clear();
      this.lastLoginDate = today;
      this.saveProgress();
    } else if (diffDays < 0) {
      // ⚠️ Clock went backwards - probably timezone or system time change
      console.warn('⚠️ Time travel detected! Resetting to prevent exploits');
      this.currentDay = 1;
      this.streak = 1;
      this.rewardsClaimed.clear();
      this.lastLoginDate = today;
      this.saveProgress();
    }
  }

  canClaimToday() {
    const today = this.getTodayDateString();
    return this.lastLoginDate === today && !this.rewardsClaimed.has(this.currentDay);
  }

  claimTodayReward() {
    if (!this.canClaimToday()) {
      return null;
    }
    
    const calendar = this.getRewardCalendar();
    const todayReward = calendar.find(r => r.day === this.currentDay);
    
    if (todayReward) {
      this.rewardsClaimed.add(this.currentDay);
      this.saveProgress();
      console.log(`🎁 Claimed day ${this.currentDay} reward:`, todayReward);
      return todayReward;
    }
    
    return null;
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

  getCurrentDay() {
    return this.currentDay;
  }

  getStreak() {
    return this.streak;
  }

  reset() {
    this.currentDay = 0;
    this.lastLoginDate = null;
    this.rewardsClaimed.clear();
    this.streak = 0;
    this.saveProgress();
  }
}
