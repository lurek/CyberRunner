/**
 * 🚀 QUICK SETUP: Cloud Sync for Daily Rewards & Missions
 * 
 * Copy and paste this code into your App.jsx to enable cloud sync
 * for login rewards and daily missions.
 */

// ============================================
// STEP 1: ADD THESE IMPORTS TO YOUR APP.JSX
// ============================================

import { useCloudSave } from './integration/CloudSaveIntegration.js';
import { getCloudSaveManager } from './utils/cloud/CloudSaveManager.js';
import { getLoginRewardsManager } from './game/systems/engagement/LoginRewardsManager.js';
import { getDailyMissionManager } from './game/systems/engagement/DailyMissionManager.js';

// ============================================
// STEP 2: ADD THESE STATE VARIABLES
// ============================================

function App() {
  // Existing states...
  const [totalCoins, setTotalCoins] = useState(0);
  const [gems, setGems] = useState(0);
  
  // 🆕 ADD THESE:
  const { cloudState, initCloud, saveToCloud, loadFromCloud } = useCloudSave();
  const [loginRewardsManager, setLoginRewardsManager] = useState(null);
  const [dailyMissionManager, setDailyMissionManager] = useState(null);
  const [cloudSyncReady, setCloudSyncReady] = useState(false);

  // ============================================
  // STEP 3: ADD THIS INITIALIZATION useEffect
  // ============================================

  useEffect(() => {
    const setupCloudSync = async () => {
      try {
        console.log('🔄 Initializing cloud sync...');
        
        // Initialize cloud save system
        const cloudManager = getCloudSaveManager();
        const cloudReady = await initCloud();
        
        if (cloudReady && cloudManager.initialized) {
          console.log('✅ Cloud save initialized');
          
          // Initialize managers with cloud support
          const rewardsManager = getLoginRewardsManager(cloudManager);
          const missionsManager = getDailyMissionManager(cloudManager);
          
          // Sync from cloud (this will merge with local data)
          console.log('📥 Syncing from cloud...');
          await rewardsManager.syncFromCloud();
          await missionsManager.syncFromCloud();
          
          setLoginRewardsManager(rewardsManager);
          setDailyMissionManager(missionsManager);
          setCloudSyncReady(true);
          
          console.log('✅ All managers connected to cloud sync');
        } else {
          // Fallback to local-only mode
          console.warn('⚠️ Cloud save not available, using local storage only');
          setLoginRewardsManager(getLoginRewardsManager());
          setDailyMissionManager(getDailyMissionManager());
          setCloudSyncReady(true);
        }
      } catch (error) {
        console.error('❌ Cloud sync setup failed:', error);
        // Fallback to local-only mode
        setLoginRewardsManager(getLoginRewardsManager());
        setDailyMissionManager(getDailyMissionManager());
        setCloudSyncReady(true);
      }
    };
    
    setupCloudSync();
  }, []); // Run once on mount

  // ============================================
  // STEP 4: UPDATE YOUR GAME OVER HANDLER
  // ============================================

  const handleGameOver = async () => {
    // Your existing game over logic...
    const finalScore = score;
    const finalDistance = distance;
    const finalCoins = coinsCollected;
    
    // 🆕 UPDATE DAILY MISSIONS
    if (dailyMissionManager) {
      dailyMissionManager.updateFromRunStats({
        distance: finalDistance,
        coins: finalCoins,
        score: finalScore,
        maxCombo: maxCombo || 0,
        grappleUses: grappleCount || 0,
        wallRunUses: wallRunCount || 0,
        powerUpsCollected: powerUpsCollected || 0,
        nearMisses: nearMisses || 0,
        jumps: jumps || 0,
        slides: slides || 0,
        runsCompleted: 1,
        obstaclesHit: deaths || 0
      });
      
      console.log('📊 Daily missions updated');
    }

    // 🆕 SAVE TO CLOUD
    if (cloudState.initialized) {
      await saveToCloud({
        totalCoins: totalCoins,
        gems: gems,
        bestScore: Math.max(bestScore, finalScore),
        totalDistance: totalDistance + finalDistance,
        gamesPlayed: gamesPlayed + 1,
        // Add any other player data you want to sync
      });
      
      console.log('☁️ Progress saved to cloud');
    }

    // Continue with your existing game over logic...
    setGameState('gameOver');
  };

  // ============================================
  // STEP 5: ADD REWARD CLAIM HANDLERS
  // ============================================

  const handleClaimLoginReward = async () => {
    if (!loginRewardsManager) {
      console.warn('Login rewards manager not ready');
      return;
    }
    
    const reward = await loginRewardsManager.claimTodayReward();
    
    if (reward) {
      // Apply rewards
      if (reward.coins) {
        setTotalCoins(prev => prev + reward.coins);
      }
      if (reward.gems) {
        setGems(prev => prev + reward.gems);
      }
      if (reward.tokens) {
        setReviveTokens(prev => prev + reward.tokens);
      }
      if (reward.trail) {
        // Unlock trail in your system
        unlockTrail(reward.trail);
      }
      if (reward.character) {
        // Unlock character in your system
        unlockCharacter(reward.character);
      }
      
      // Show notification
      showNotification(`🎁 Day ${loginRewardsManager.getCurrentDay()} Reward Claimed!`, 'success');
      
      // Save to cloud (happens automatically in claimTodayReward)
      console.log('✅ Login reward claimed and synced');
    } else {
      showNotification('Already claimed or not available', 'warning');
    }
  };

  const handleClaimMissionReward = async (missionId) => {
    if (!dailyMissionManager) {
      console.warn('Daily mission manager not ready');
      return;
    }
    
    const reward = await dailyMissionManager.collectReward(missionId);
    
    if (reward) {
      setTotalCoins(prev => prev + reward);
      showNotification(`💰 Mission Completed! +${reward} coins`, 'success');
      
      // Save to cloud (happens automatically in collectReward)
      console.log('✅ Mission reward claimed and synced');
    } else {
      showNotification('Reward already collected', 'warning');
    }
  };

  // ============================================
  // STEP 6: RENDER WITH SYNC STATUS
  // ============================================

  return (
    <div className="App">
      {/* Your existing UI */}
      
      {/* 🆕 Cloud Sync Status Indicator (Optional) */}
      {cloudState.initialized && (
        <div className="cloud-sync-indicator" style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 15px',
          background: 'rgba(0, 0, 0, 0.7)',
          border: `1px solid ${cloudState.syncing ? '#ffaa00' : '#00ff00'}`,
          borderRadius: '20px',
          fontSize: '0.85em',
          color: cloudState.syncing ? '#ffaa00' : '#00ff00',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: cloudState.syncing ? '#ffaa00' : '#00ff00',
            animation: cloudState.syncing ? 'pulse 1s infinite' : 'none'
          }} />
          {cloudState.syncing ? 'Syncing...' : 'Synced'}
        </div>
      )}

      {/* 🆕 Login Rewards Panel */}
      {cloudSyncReady && loginRewardsManager && (
        <LoginRewardsPanel 
          manager={loginRewardsManager}
          onClaimReward={handleClaimLoginReward}
        />
      )}

      {/* 🆕 Daily Missions Panel */}
      {cloudSyncReady && dailyMissionManager && (
        <DailyMissionsPanel
          manager={dailyMissionManager}
          onClaimReward={handleClaimMissionReward}
        />
      )}

      {/* Rest of your app */}
    </div>
  );
}

// ============================================
// STEP 7: ADD THIS CSS FOR SYNC INDICATOR
// ============================================

/*
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
*/

// ============================================
// 🎉 DONE! Your app now has cloud sync!
// ============================================

/**
 * TESTING CHECKLIST:
 * 
 * ✅ Open browser console - you should see:
 *    "🔄 Initializing cloud sync..."
 *    "🔥 Firebase initialized successfully"
 *    "✅ Cloud save initialized"
 *    "📥 Syncing from cloud..."
 *    "✅ All managers connected to cloud sync"
 * 
 * ✅ Open Firebase Console → Firestore
 *    Navigate to: players/{your-user-id}
 *    You should see: loginRewards and dailyMissions fields
 * 
 * ✅ Test cross-device sync:
 *    1. Claim reward on Device A
 *    2. Open app on Device B (same account)
 *    3. Reward should already be claimed
 * 
 * ✅ Test offline mode:
 *    1. Disable internet
 *    2. Claim rewards (should work with localStorage)
 *    3. Enable internet
 *    4. Data should sync automatically
 */

export { handleClaimLoginReward, handleClaimMissionReward };
