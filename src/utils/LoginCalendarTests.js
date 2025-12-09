/**
 * 🧪 LOGIN CALENDAR TEST SUITE
 * Run this in browser console to verify fixes
 */

// Test utilities
window.LoginCalendarTests = {
  
  // Get the manager instance
  getManager: () => {
    // Try to import from global scope if available
    if (window.getLoginRewardsManager) {
      return window.getLoginRewardsManager();
    }
    console.error('❌ getLoginRewardsManager not found. Import it first.');
    return null;
  },

  // Test 1: Check current state
  test1_CheckState: () => {
    console.log('\n🧪 TEST 1: Check Current State');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    const info = manager.getDebugInfo();
    console.table(info);
    
    const passed = 
      info.currentDay >= 1 && info.currentDay <= 7 &&
      info.todayDate.match(/\d{4}-\d{2}-\d{2}/);
    
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    return info;
  },

  // Test 2: Date format check
  test2_DateFormat: () => {
    console.log('\n🧪 TEST 2: Date Format Validation');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    const today = manager.getTodayDateString();
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    const passed = regex.test(today);
    
    console.log('Today:', today);
    console.log('Format:', passed ? 'YYYY-MM-DD ✅' : 'INVALID ❌');
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    return passed;
  },

  // Test 3: Simulate next day
  test3_SimulateNextDay: async () => {
    console.log('\n🧪 TEST 3: Simulate Next Day');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    const before = manager.getCurrentDay();
    console.log('Current day:', before);
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    console.log('Setting lastLoginDate to:', yesterdayStr);
    manager.lastLoginDate = yesterdayStr;
    manager.rewardsClaimed.clear();
    await manager.saveProgress();
    
    console.log('Checking streak...');
    manager.checkLoginStreak();
    
    const after = manager.getCurrentDay();
    const passed = after === (before + 1) || (before === 7 && after === 1);
    
    console.log('New day:', after);
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    return passed;
  },

  // Test 4: Cloud sync
  test4_CloudSync: async () => {
    console.log('\n🧪 TEST 4: Cloud Sync');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    const before = manager.getDebugInfo();
    console.log('Before sync:', before);
    
    if (!before.cloudConnected) {
      console.log('⚠️ Cloud not connected - SKIPPED');
      return null;
    }
    
    console.log('Forcing sync...');
    const result = await manager.forceSyncNow();
    console.log('After sync:', result);
    
    const passed = result.cloudInitialized;
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    return result;
  },

  // Test 5: Claim reward
  test5_ClaimReward: async () => {
    console.log('\n🧪 TEST 5: Claim Reward');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    const canClaim = manager.canClaimToday();
    console.log('Can claim today:', canClaim);
    
    if (!canClaim) {
      console.log('⚠️ No reward available - SKIPPED');
      return null;
    }
    
    const reward = await manager.claimTodayReward();
    console.log('Claimed reward:', reward);
    
    const hasClaimed = manager.hasClaimedToday();
    const passed = hasClaimed && reward !== null;
    
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    return reward;
  },

  // Test 6: Streak break
  test6_StreakBreak: async () => {
    console.log('\n🧪 TEST 6: Streak Break Detection');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    const before = manager.getStreak();
    console.log('Current streak:', before);
    
    // Set date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateStr = `${threeDaysAgo.getFullYear()}-${String(threeDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgo.getDate()).padStart(2, '0')}`;
    
    console.log('Setting lastLoginDate to:', dateStr);
    manager.lastLoginDate = dateStr;
    manager.currentDay = 5; // Was on day 5
    await manager.saveProgress();
    
    console.log('Checking streak...');
    manager.checkLoginStreak();
    
    const after = manager.getCurrentDay();
    const newStreak = manager.getStreak();
    const passed = after === 1 && newStreak === 1;
    
    console.log('After break - Day:', after, 'Streak:', newStreak);
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    return passed;
  },

  // Run all tests
  runAll: async () => {
    console.log('🚀 RUNNING ALL LOGIN CALENDAR TESTS\n');
    console.log('═'.repeat(50));
    
    const results = {
      test1: LoginCalendarTests.test1_CheckState(),
      test2: LoginCalendarTests.test2_DateFormat(),
    };
    
    // Tests that modify state
    console.log('\n⚠️ The following tests will modify your login calendar state:');
    console.log('Do you want to continue? Type: LoginCalendarTests.continueTests()');
    
    return results;
  },

  // Continue with destructive tests
  continueTests: async () => {
    console.log('\n📝 Running state-changing tests...\n');
    
    const results = {
      test3: await LoginCalendarTests.test3_SimulateNextDay(),
      test4: await LoginCalendarTests.test4_CloudSync(),
      test5: await LoginCalendarTests.test5_ClaimReward(),
      test6: await LoginCalendarTests.test6_StreakBreak(),
    };
    
    console.log('\n═'.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY:');
    console.table(results);
    
    const passed = Object.values(results).filter(r => r === true || r !== null).length;
    const total = Object.keys(results).length;
    console.log(`\n✅ ${passed}/${total} tests passed`);
    
    console.log('\n⚠️ Your calendar state has been modified!');
    console.log('To restore, reload the page or call: await manager.reset()');
    
    return results;
  },

  // Quick reset
  reset: async () => {
    console.log('🔄 Resetting login calendar...');
    const manager = LoginCalendarTests.getManager();
    if (!manager) return;
    
    await manager.reset();
    console.log('✅ Reset complete! Reload page to start fresh.');
  },

  // Show help
  help: () => {
    console.log(`
🧪 LOGIN CALENDAR TEST SUITE

Available commands:
├─ LoginCalendarTests.runAll()           - Run all safe tests
├─ LoginCalendarTests.continueTests()    - Run state-changing tests
├─ LoginCalendarTests.test1_CheckState() - Check current state
├─ LoginCalendarTests.test2_DateFormat() - Validate date format
├─ LoginCalendarTests.test3_SimulateNextDay() - Test day progression
├─ LoginCalendarTests.test4_CloudSync()  - Test cloud sync
├─ LoginCalendarTests.test5_ClaimReward() - Test reward claiming
├─ LoginCalendarTests.test6_StreakBreak() - Test streak breaking
├─ LoginCalendarTests.reset()            - Reset calendar
└─ LoginCalendarTests.help()             - Show this help

Quick start:
  LoginCalendarTests.runAll()
    `);
  }
};

// Auto-show help
console.log('✅ Login Calendar Test Suite Loaded!');
console.log('Type: LoginCalendarTests.help()');
