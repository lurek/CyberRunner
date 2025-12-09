/**
 * ✅ PHASE 4: CLOUD SAVE INTEGRATION MODULE
 * 
 * This module provides easy integration of cloud save functionality into App.jsx
 * 
 * Features:
 * - Anonymous authentication (auto sign-in)
 * - Cloud save with conflict resolution
 * - Real-time sync
 * - Leaderboard integration
 * - Profile management
 * 
 * Usage in App.jsx:
 * 
 * 1. Import at top:
 *    import { useCloudSave } from './integration/CloudSaveIntegration.js';
 * 
 * 2. In your App component:
 *    const { cloudState, initCloud, saveToCloud, loadFromCloud, submitScore } = useCloudSave();
 * 
 * 3. Initialize on mount:
 *    useEffect(() => {
 *      initCloud();
 *    }, []);
 * 
 * 4. Save after game over:
 *    await saveToCloud({ totalCoins, upgrades, bestScore });
 * 
 * 5. Submit to leaderboard:
 *    await submitScore(score, distance, coins);
 */

import { useState, useCallback, useRef } from 'react';
import { getCloudSaveManager } from '../utils/cloud/CloudSaveManager.js';
import { getLeaderboardManager } from '../utils/cloud/LeaderboardManager.js';
import { 
  auth, 
  signInAnonymously, 
  onAuthStateChanged 
} from '../utils/cloud/firebase-config.js';

export function useCloudSave() {
  const [cloudState, setCloudState] = useState({
    initialized: false,
    authenticating: true,
    syncing: false,
    user: null,
    lastSync: null,
    error: null,
    leaderboardRank: null
  });

  const cloudManager = useRef(null);
  const leaderboardManager = useRef(null);

  /**
   * Initialize cloud save system
   */
  const initCloud = useCallback(async () => {
    try {
      console.log('🔥 Initializing cloud save system...');

      // Check if Firebase is configured
      if (!auth) {
        console.warn('⚠️ Firebase not configured. Cloud features disabled.');
        setCloudState(prev => ({
          ...prev,
          initialized: false,
          authenticating: false,
          error: 'Firebase not configured'
        }));
        return false;
      }

      // Listen for auth state changes
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log('✅ User authenticated:', user.uid);
          
          // Initialize managers
          if (!cloudManager.current) {
            cloudManager.current = getCloudSaveManager();
            await cloudManager.current.init();
          }

          if (!leaderboardManager.current) {
            leaderboardManager.current = getLeaderboardManager();
            await leaderboardManager.current.init(
              user.uid, 
              user.displayName || 'Player'
            );
          }

          setCloudState(prev => ({
            ...prev,
            initialized: true,
            authenticating: false,
            user: {
              uid: user.uid,
              displayName: user.displayName || 'Player',
              isAnonymous: user.isAnonymous,
              email: user.email
            },
            error: null
          }));

          // Try to load cloud save
          await loadFromCloud();
        }
      });

      // Sign in anonymously if not signed in
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('🔐 Signing in anonymously...');
        await signInAnonymously(auth);
      }

      return true;
    } catch (error) {
      console.error('❌ Cloud initialization failed:', error);
      setCloudState(prev => ({
        ...prev,
        initialized: false,
        authenticating: false,
        error: error.message
      }));
      return false;
    }
  }, []);

  /**
   * Save data to cloud
   */
  const saveToCloud = useCallback(async (data) => {
    if (!cloudManager.current || !cloudState.initialized) {
      console.warn('Cloud save not initialized');
      return false;
    }

    try {
      setCloudState(prev => ({ ...prev, syncing: true }));
      
      const saveData = {
        ...data,
        lastSaved: Date.now(),
        deviceType: 'web',
        version: '1.0.0'
      };

      const success = await cloudManager.current.saveProgress(saveData);
      
      if (success) {
        console.log('✅ Saved to cloud successfully');
        setCloudState(prev => ({
          ...prev,
          syncing: false,
          lastSync: Date.now(),
          error: null
        }));
      }

      return success;
    } catch (error) {
      console.error('❌ Save to cloud failed:', error);
      setCloudState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return false;
    }
  }, [cloudState.initialized]);

  /**
   * Load data from cloud
   */
  const loadFromCloud = useCallback(async () => {
    if (!cloudManager.current || !cloudState.initialized) {
      console.warn('Cloud save not initialized');
      return null;
    }

    try {
      setCloudState(prev => ({ ...prev, syncing: true }));
      
      const cloudData = await cloudManager.current.loadProgress();
      
      setCloudState(prev => ({
        ...prev,
        syncing: false,
        lastSync: Date.now(),
        error: null
      }));

      if (cloudData) {
        console.log('✅ Loaded from cloud successfully');
        return cloudData;
      } else {
        console.log('ℹ️ No cloud save found (new player)');
        return null;
      }
    } catch (error) {
      console.error('❌ Load from cloud failed:', error);
      setCloudState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return null;
    }
  }, [cloudState.initialized]);

  /**
   * Submit score to leaderboard
   */
  const submitScore = useCallback(async (score, distance, coins, character = 'default') => {
    if (!leaderboardManager.current || !cloudState.initialized) {
      console.warn('Leaderboard not initialized');
      return false;
    }

    try {
      const success = await leaderboardManager.current.submitScore(
        score,
        distance,
        coins,
        character
      );

      if (success) {
        console.log('✅ Score submitted to leaderboard');
        
        // Update rank
        const rank = await leaderboardManager.current.getPlayerRank();
        if (rank) {
          setCloudState(prev => ({
            ...prev,
            leaderboardRank: rank
          }));
        }
      }

      return success;
    } catch (error) {
      console.error('❌ Score submission failed:', error);
      return false;
    }
  }, [cloudState.initialized]);

  /**
   * Get global leaderboard
   */
  const getLeaderboard = useCallback(async (type = 'global', limit = 100) => {
    if (!leaderboardManager.current || !cloudState.initialized) {
      return [];
    }

    try {
      if (type === 'global') {
        return await leaderboardManager.current.getGlobalLeaderboard(limit);
      } else if (type === 'weekly') {
        return await leaderboardManager.current.getWeeklyLeaderboard(limit);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }, [cloudState.initialized]);

  /**
   * Get player's current rank
   */
  const getPlayerRank = useCallback(async () => {
    if (!leaderboardManager.current || !cloudState.initialized) {
      return null;
    }

    try {
      return await leaderboardManager.current.getPlayerRank();
    } catch (error) {
      console.error('Failed to get player rank:', error);
      return null;
    }
  }, [cloudState.initialized]);

  /**
   * Merge local and cloud data
   */
  const mergeData = useCallback((localData, cloudData) => {
    if (!cloudManager.current) return localData;
    return cloudManager.current.mergeData(localData, cloudData);
  }, []);

  return {
    cloudState,
    initCloud,
    saveToCloud,
    loadFromCloud,
    submitScore,
    getLeaderboard,
    getPlayerRank,
    mergeData
  };
}

/**
 * Helper function to show cloud save status in UI
 */
export function CloudSaveIndicator({ cloudState }) {
  if (!cloudState.initialized) return null;

  const getStatusColor = () => {
    if (cloudState.error) return '#ff0000';
    if (cloudState.syncing) return '#ffaa00';
    return '#00ff00';
  };

  const getStatusText = () => {
    if (cloudState.error) return 'Sync Error';
    if (cloudState.syncing) return 'Syncing...';
    if (cloudState.lastSync) {
      const secondsAgo = Math.floor((Date.now() - cloudState.lastSync) / 1000);
      return `Synced ${secondsAgo}s ago`;
    }
    return 'Connected';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '8px 15px',
      background: 'rgba(0, 0, 0, 0.7)',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '20px',
      fontSize: '0.85em',
      color: getStatusColor(),
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
        background: getStatusColor(),
        animation: cloudState.syncing ? 'pulse 1s infinite' : 'none'
      }} />
      {getStatusText()}
    </div>
  );
}

// Export status styles
export const cloudSaveStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
