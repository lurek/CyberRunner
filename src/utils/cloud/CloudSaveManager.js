/**
 * Cloud Save Manager - FIXED
 * Now correctly syncs between devices for authenticated users
 */

import {
  auth,
  db,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from './firebase-config.js';

export class CloudSaveManager {
  constructor() {
    this.userId = null;
    this.initialized = false;
    this.saveQueue = [];
    this.isSaving = false;
    this.lastSyncTime = 0;
    this.syncInterval = 30000; // Sync every 30 seconds
    this.listeners = new Set();
    this.firebaseEnabled = false;
    this.unsubscribeSnapshot = null;  // ✅ Track realtime listener
    this.unsubscribeAuth = null;  // ✅ Track auth listener
  }

  /**
   * Initialize Firebase and authenticate
   */
  async init() {
    // Check if Firebase is available
    if (!auth || !db) {
      console.warn('⚠️ Cloud save disabled: Firebase not configured in firebase-config.js');
      return false;
    }

    try {
      // ✅ FIX: Listen for auth state changes to update userId
      this.setupAuthListener();

      // Ensure we have a user
      let user = auth.currentUser;
      if (!user) {
        console.log('☁️ No user logged in, signing in anonymously...');
        const result = await signInAnonymously(auth);
        user = result.user;
      }

      this.userId = user.uid;
      this.initialized = true;
      this.firebaseEnabled = true;

      console.log('✅ Cloud save initialized for user:', this.userId);
      console.log('✅ User email:', user.email || 'Anonymous');

      // Start auto-sync
      this.startAutoSync();

      // Listen for changes
      this.setupRealtimeSync();

      return true;
    } catch (error) {
      console.error('❌ Cloud save initialization failed:', error);
      return false;
    }
  }

  /**
   * ✅ NEW: Setup auth state listener to update userId when user changes
   */
  setupAuthListener() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }

    this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const oldUserId = this.userId;
        this.userId = user.uid;

        if (oldUserId !== user.uid) {
          console.log('🔄 Cloud save user changed:', {
            from: oldUserId,
            to: user.uid,
            email: user.email || 'Anonymous'
          });

          // Re-setup realtime sync for new user
          if (this.initialized) {
            this.setupRealtimeSync();
          }
        }
      } else {
        console.log('⚠️ User signed out, cloud save will pause');
        this.userId = null;
      }
    });
  }

  /**
   * Save player progress to cloud
   */
  async saveProgress(data) {
    if (!this.initialized || !this.userId) {
      console.warn('⚠️ Cloud save not initialized or no user, queuing save');
      this.saveQueue.push(data);
      return false;
    }

    if (this.isSaving) {
      console.log('⏳ Save in progress, queuing...');
      this.saveQueue.push(data);
      return false;
    }

    this.isSaving = true;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const saveData = {
          ...data,
          lastSaved: Date.now(),
          version: 1
        };

        console.log('💾 Saving to cloud for user:', this.userId);
        // ✅ DEBUG: Log character data being saved
        if (saveData.ownedCharacters) {
          console.log('👤 Saving ownedCharacters:', saveData.ownedCharacters);
        }
        if (saveData.selectedCharacter) {
          console.log('👤 Saving selectedCharacter:', saveData.selectedCharacter);
        }
        await setDoc(doc(db, 'players', this.userId), saveData, { merge: true });

        console.log('✅ Progress saved to cloud');
        this.lastSyncTime = saveData.lastSaved || Date.now();
        this.isSaving = false;

        // Process queue
        if (this.saveQueue.length > 0) {
          const nextSave = this.saveQueue.pop();
          this.saveQueue = [];
          return this.saveProgress(nextSave);
        }

        return true;
      } catch (error) {
        retryCount++;
        console.error(`❌ Save failed (attempt ${retryCount}/${maxRetries}):`, error);

        if (retryCount >= maxRetries) {
          this.isSaving = false;
          throw error; // Re-throw after max retries
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    this.isSaving = false;
    return false;
  }

  /**
   * Load player progress from cloud
   */
  async loadProgress() {
    if (!this.initialized || !this.userId) {
      console.warn('⚠️ Cannot load: Cloud save not initialized or no user');
      return null;
    }

    try {
      console.log('📥 Loading progress for user:', this.userId);
      const docSnap = await getDoc(doc(db, 'players', this.userId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Progress loaded from cloud:', {
          totalCoins: data.totalCoins,
          totalGems: data.totalGems,
          lastSaved: data.lastSaved ? new Date(data.lastSaved).toISOString() : 'N/A',
          hasDailyMissions: !!data.dailyMissions,
          hasLoginRewards: !!data.loginRewards,
          hasLuckyWheel: !!data.luckyWheel,
          // ✅ DEBUG: Log character data being loaded
          ownedCharacters: data.ownedCharacters || '(not in cloud)',
          selectedCharacter: data.selectedCharacter || '(not in cloud)'
        });
        return data;
      }

      console.log('📄 No cloud save found for user:', this.userId);
      return null;
    } catch (error) {
      console.error('❌ Failed to load progress:', error);
      return null;
    }
  }

  setupRealtimeSync() {
    if (!this.initialized || !this.userId) return;

    // ✅ FIX: Unsubscribe from previous listener before creating new one
    if (this.unsubscribeSnapshot) {
      console.log('🔄 Unsubscribing from previous realtime listener');
      this.unsubscribeSnapshot();
    }

    try {
      console.log('🔔 Setting up real-time sync listener for user:', this.userId);

      this.unsubscribeSnapshot = onSnapshot(doc(db, 'players', this.userId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const cloudLastSaved = data.lastSaved || 0;

          // Ignore snapshots that are older or equal to our last processed sync time
          if (cloudLastSaved && cloudLastSaved <= (this.lastSyncTime || 0) + 500) {
            return;
          }

          // Update our lastSyncTime to the cloud timestamp to avoid immediate echo
          if (cloudLastSaved) this.lastSyncTime = cloudLastSaved;

          console.log('📡 Real-time cloud update received:', {
            hasLoginRewards: !!data.loginRewards,
            hasDailyMissions: !!data.dailyMissions,
            hasLuckyWheel: !!data.luckyWheel,
            totalCoins: data.totalCoins,
            totalGems: data.totalGems,
            lastSaved: new Date(data.lastSaved || 0).toISOString()
          });

          // Notify listeners (App.jsx can subscribe to this if needed)
          this.listeners.forEach(listener => {
            try {
              listener(data);
            } catch (e) {
              console.error('❌ Error in cloud listener callback:', e);
            }
          });
        } else {
          console.log('📄 No cloud document found for user:', this.userId);
        }
      }, (error) => {
        console.error('❌ Real-time sync error:', error);
      });
    } catch (error) {
      console.error('❌ Failed to setup realtime sync:', error);
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  startAutoSync() {
    setInterval(() => {
      if (this.saveQueue.length > 0) {
        const latestSave = this.saveQueue.pop();
        this.saveQueue = [];
        this.saveProgress(latestSave);
      }
    }, this.syncInterval);
  }

  async processOfflineQueue() {
    if (!this.initialized || !this.userId || this.saveQueue.length === 0) return;

    console.log(`📤 Processing ${this.saveQueue.length} queued saves...`);

    while (this.saveQueue.length > 0) {
      const data = this.saveQueue.shift();
      await this.saveProgress(data);
    }

    console.log('✅ Offline queue processed');
  }

  mergeData(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    const localTime = localData.lastSaved || 0;
    const cloudTime = cloudData.lastSaved || 0;

    if (cloudTime > localTime) {
      console.log('☁️ Using Cloud Save (Newer)');
      return cloudData;
    } else {
      console.log('💾 Using Local Save (Newer)');
      return localData;
    }
  }

  /**
   * ✅ NEW: Force sync all data to cloud (call after login)
   */
  async forceSyncToCloud(data) {
    if (!this.initialized || !this.userId) {
      console.warn('⚠️ Cannot force sync: not initialized');
      return false;
    }

    console.log('🔄 Force syncing all data to cloud for user:', this.userId);
    return await this.saveProgress(data);
  }

  /**
   * ✅ NEW: Get current user ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * ✅ NEW: Check if sync is active
   */
  isActive() {
    return this.initialized && this.userId && this.firebaseEnabled;
  }
}

// Singleton
let cloudSaveManager = null;
export function getCloudSaveManager() {
  if (!cloudSaveManager) {
    cloudSaveManager = new CloudSaveManager();
  }
  return cloudSaveManager;
}