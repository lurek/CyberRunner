/* FIXED VERSION - Resolves 'handlePauseClick' crash and ensures Daily Rewards visibility */

import React, { useState, useEffect } from "react";
import { CONSTANTS, SHOP_CONFIG, CHARACTERS } from "./utils/constants.js";
import GameEngine from "./game/GameEngine.jsx";

// Replaced old menu import with the new fully responsive component
import CyberRunnerHomeScreen from "./ui/CyberRunnerHomeScreen_ENHANCED_FIXED.jsx"; // ✅ FIXED VERSION - Character size and idle animation
// ✅ REMOVED: CharacterShop - No longer needed, using CharacterPreviewPage directly
import GameHUD from "./ui/GameHUD.jsx";
import PauseMenu from "./ui/PauseMenu.jsx";
import GameOverMenu from "./ui/GameOverMenu.jsx";
import SettingsMenu from "./ui/SettingsMenu.jsx";
import ShopMenu from "./ui/ShopMenu.jsx";
import SpeedMeter from "./ui/SpeedMeter.jsx";
import DamageIndicator from "./ui/DamageIndicator.jsx";
import DangerZoneVisuals from "./ui/DangerZoneVisuals.jsx";
import EnergyModeDisplay from "./ui/EnergyModeDisplay.jsx";
import TutorialHints from "./ui/TutorialHints.jsx";
import LoadingScreen from "./ui/LoadingScreen.jsx";
import AuthPanel from "./ui/AuthPanel.jsx";
import AbilityButtons from "./ui/AbilityButtons.jsx"; // ✅ FIX #1: Add ability buttons
import BoosterSelector from "./ui/BoosterSelector.jsx"; // ✅ NEW: Booster selector UI
import EngagementHubNew from "./ui/EngagementHubNew.jsx";
import CharacterPreviewPage from "./ui/CharacterPreviewPage_FINAL.jsx";
import "./ui/CharacterPreviewPage_FINAL.css";
import AccountProfilePage from "./ui/AccountProfilePage.jsx"; // ✅ NEW: ACCOUNT PROFILE
import { analytics } from "./utils/analytics/AnalyticsManager.js";
import { authManager } from "./utils/cloud/AuthManager.js";
import audioManager from "./utils/audio/AudioManager.js";
import { CloudSyncIndicator } from "./ui/CloudSyncIndicator.jsx";
import CloudSyncDebugPanel from "./ui/CloudSyncDebugPanel.jsx"; // ✅ DEBUG: Cloud sync debug panel

// ✅ NEW: Account Profile Manager
import { getAccountProfileManager } from "./utils/cloud/AccountProfileManager.js";

// ✅ NEW: Cloud Integrations
import { getCloudSaveManager } from "./utils/cloud/CloudSaveManager.js";
import { getLeaderboardManager } from "./utils/cloud/LeaderboardManager.js";

// ✅ NEW: Engagement System Managers
import { getLoginRewardsManager } from "./game/systems/engagement/LoginRewardsManager.js";
import { getDailyMissionManager } from "./game/systems/engagement/DailyMissionManager.js";
import { getLuckyWheelManager } from './game/systems/engagement/LuckyWheelManager.js';

// ✅ NEW: Mobile Status Bar Control
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

function getInitialSetting(key, defaultValue) {
  try {
    return localStorage.getItem(key) !== null
      ? (defaultValue === true || defaultValue === false ? localStorage.getItem(key) === 'true' : parseInt(localStorage.getItem(key), 10) || defaultValue)
      : defaultValue;
  } catch (e) { return defaultValue; }
}

export default function App() {
  const [menu, setMenu] = useState("home");
  const [previousMenu, setPreviousMenu] = useState("home"); // ✅ Track where settings was opened from
  const [isEngineReady, setEngineReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showEngagementHub, setShowEngagementHub] = useState(false);
  const [performanceTier, setPerformanceTier] = useState('medium');
  const [batterySaverMode, setBatterySaverMode] = useState(false);
  const [musicOn, setMusicOn] = useState(() => getInitialSetting('cyberrunner_musicOn', true));
  const [sfxOn, setSfxOn] = useState(() => getInitialSetting('cyberrunner_sfxOn', true));
  const [musicVolume, setMusicVolume] = useState(() => getInitialSetting('cyberrunner_musicVolume', 50));
  const [sfxVolume, setSfxVolume] = useState(() => getInitialSetting('cyberrunner_sfxVolume', 80));
  const [prevSfxVolume, setPrevSfxVolume] = useState(sfxVolume);
  const isHighQuality = performanceTier === 'high';
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [health, setHealth] = useState(100);
  const [bestScore, setBestScore] = useState(0);
  const [fps, setFps] = useState(60);
  const [shield, setShield] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [isMagnetActive, setMagnetActive] = useState(false);
  const [isTimeSlowActive, setTimeSlowActive] = useState(false);
  const [combo, setCombo] = useState(null);
  const [difficultyPhase, setDifficultyPhase] = useState('normal');
  const [speed, setSpeed] = useState(CONSTANTS.GAME.BASE_SPEED);
  const [energyMode, setEnergyMode] = useState(null);
  const [damageDirection, setDamageDirection] = useState(null);
  const [dangerZones, setDangerZones] = useState([]);
  const [slowMotionActive, setSlowMotionActive] = useState(false);
  const [grappleData, setGrappleData] = useState(null);
  const [playerLane, setPlayerLane] = useState(1);
  const [gameKey, setGameKey] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalGems, setTotalGems] = useState(4);
  const [reviveTokens, setReviveTokens] = useState(0); // ✅ NEW: Revive tokens
  const [inventory, setInventory] = useState({}); // ✅ NEW: Inventory for boosters
  const [upgradeLevels, setUpgradeLevels] = useState({ shield: 0, multiplier: 0, magnet: 0, health: 0, time: 0 });
  const [ownedCharacters, setOwnedCharacters] = useState(['default']);
  const [selectedCharacter, setSelectedCharacter] = useState('default');

  // ✅ NEW: Booster selector state
  const [showBoosterSelector, setShowBoosterSelector] = useState(false);
  const [boosterData, setBoosterData] = useState({});
  // Toggle to show/hide ability buttons UI (set to false to remove bottom icons completely)
  const [showAbilityButtons, setShowAbilityButtons] = useState(false);

  // ✅ NEW: Account Profile State
  const [showAccountProfile, setShowAccountProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // ✅ NEW: Cloud sync indicator state
  const [showSyncIndicator, setShowSyncIndicator] = useState(false);

  // ✨ NEW: Ability system state
  const [abilityCallbacks, setAbilityCallbacks] = useState(null);
  const [abilityStates, setAbilityStates] = useState({
    // Jetpack & Hoverboard removed — only lightning remains
    lightning: { active: false, ready: true, cooldownPercent: 0, level: 1 }
  });
  const [lightningActive, setLightningActive] = useState(false);

  // ✅ DEBUG: Cloud Sync Debug Panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // ✅ NEW: Revive trigger state
  const [reviveTrigger, setReviveTrigger] = useState(0);

  // ✅ DEBUG: Keyboard shortcut to open debug panel (Shift+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDebugPanel(prev => !prev);
        console.log('🔧 Cloud Sync Debug Panel toggled');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debug logger for state changes
  useEffect(() => {
    console.log('🔄 App State Changed:', {
      menu,
      showEngagementHub,
      showAuthPanel,
      isEngineReady,
      authInitialized
    });
  }, [menu, showEngagementHub, showAuthPanel, isEngineReady, authInitialized]);

  // ✅ FIX: Sync audio settings to global AudioManager
  useEffect(() => {
    audioManager.setMusicEnabled(musicOn);
    audioManager.setSfxEnabled(sfxOn);
    // Also sync volume just in case
    audioManager.setMusicVolume(musicVolume / 100);
    audioManager.setSfxVolume(sfxVolume / 100);
    console.log(`🔊 Audio settings synced: Music=${musicOn} (${musicVolume}%), SFX=${sfxOn} (${sfxVolume}%)`);
  }, [musicOn, sfxOn, musicVolume, sfxVolume]);

  // ✅ NEW: Sync user profile when login state changes
  useEffect(() => {
    if (currentUser) {
      const accountManager = getAccountProfileManager();
      const profile = accountManager.getUserProfile();
      setUserProfile(profile);
      console.log('👤 Profile loaded:', profile?.displayName);
    } else {
      setUserProfile(null);
    }
  }, [currentUser]);

  // ✅ INITIALIZE CLOUD SYSTEMS - FIXED: Force re-sync when user changes
  const lastUserIdRef = React.useRef(null);
  const cloudSyncCompleteRef = React.useRef(false);  // ✅ Block auto-save until initial sync
  const syncDebounceRef = React.useRef(null);  // ✅ Debounce real-time sync callbacks

  useEffect(() => {
    const initCloudAndSystems = async () => {
      if (!currentUser || !authInitialized) return;

      // ✅ Detect user change
      const userChanged = lastUserIdRef.current && lastUserIdRef.current !== currentUser.uid;
      lastUserIdRef.current = currentUser.uid;

      if (userChanged) {
        console.log('🔄 USER CHANGED! Forcing full cloud re-sync...');
        // ✅ CRITICAL: Reset cloud sync complete flag so auto-save is blocked until new user's data loads
        cloudSyncCompleteRef.current = false;
      }

      try {
        const cloudManager = getCloudSaveManager();
        const lbManager = getLeaderboardManager();
        const rewardsManager = getLoginRewardsManager();
        const missionsManager = getDailyMissionManager();
        const wheelManager = getLuckyWheelManager();

        // ✅ CRITICAL: If user changed, reset the hasLoadedFromCloud flag on ALL managers
        // This forces them to treat the next sync as a "first sync" and load cloud data
        if (userChanged) {
          console.log('🔄 Resetting hasLoadedFromCloud on all managers...');
          rewardsManager.hasLoadedFromCloud = false;
          missionsManager.hasLoadedFromCloud = false;
          wheelManager.hasLoadedFromCloud = false;

          // Also clear the local missions/data since we're switching users
          // The cloud sync will load the correct data for this user
          missionsManager.missions = [];
          missionsManager.completedToday = new Set();
          missionsManager.sessionStats = missionsManager.initSessionStats();
        }

        // 1. Initialize cloud manager FIRST
        const cloudReady = await cloudManager.init();
        console.log('☁️ Cloud manager initialized:', cloudReady, 'for user:', currentUser.uid);

        // 2. Connect engagement managers to cloud
        if (cloudReady) {
          rewardsManager.setCloudSaveManager(cloudManager);
          missionsManager.setCloudSaveManager(cloudManager);
          wheelManager.setCloudSaveManager(cloudManager);
          await lbManager.init(currentUser.uid, currentUser.displayName || 'Runner');
          console.log('✅ All engagement systems connected to cloud');

          // Expose instances for easier in-browser debugging
          try {
            window.__cloudManager = cloudManager;
            window.__rewardsManager = rewardsManager;
            window.__missionsManager = missionsManager;
            window.__wheelManager = wheelManager;
            console.log('🔧 Debug handles exposed: window.__cloudManager, window.__rewardsManager');
          } catch (e) {
            // ignore in non-browser or restricted environments
          }
        }

        // 3. Sync all managers from cloud (gets latest data)
        console.log('📡 Syncing all engagement data from cloud...');
        if (rewardsManager) {
          await rewardsManager.syncFromCloud();
          console.log('✅ Login rewards synced from cloud');
        }
        if (missionsManager) {
          await missionsManager.syncFromCloud();
          console.log('✅ Daily missions synced from cloud');
        }
        if (wheelManager) {
          await wheelManager.syncFromCloud();
          console.log('✅ Lucky wheel synced from cloud');
        }

        // 4. Load player data
        const cloudData = await cloudManager.loadProgress();
        if (cloudData) {
          console.log("☁️ Syncing player data from cloud:", {
            totalCoins: cloudData.totalCoins,
            totalGems: cloudData.totalGems,
            bestScore: cloudData.bestScore,
            lastSaved: cloudData.lastSaved ? new Date(cloudData.lastSaved).toISOString() : 'N/A'
          });

          if (cloudData.totalCoins !== undefined) setTotalCoins(cloudData.totalCoins);
          if (cloudData.totalGems !== undefined) setTotalGems(cloudData.totalGems);
          if (cloudData.reviveTokens !== undefined) setReviveTokens(cloudData.reviveTokens);
          if (cloudData.boosters) {
            setInventory(cloudData.boosters); // ✅ Load boosters into inventory
            localStorage.setItem('cyberrunner_boosters', JSON.stringify(cloudData.boosters)); // ✅ Sync to local storage
          }
          if (cloudData.bestScore > bestScore) setBestScore(cloudData.bestScore);
          if (cloudData.upgrades) setUpgradeLevels(prev => ({ ...prev, ...cloudData.upgrades }));
          if (cloudData.ownedCharacters) setOwnedCharacters(cloudData.ownedCharacters);
          if (cloudData.selectedCharacter) setSelectedCharacter(cloudData.selectedCharacter);

          // ✅ Show sync indicator
          setShowSyncIndicator(true);
          setTimeout(() => setShowSyncIndicator(false), 2000);
        } else {
          console.log('📄 No cloud data found, using local data');
        }

        // ✅ CRITICAL: Mark initial cloud sync as complete - auto-save can now run
        cloudSyncCompleteRef.current = true;
        console.log('✅ Initial cloud sync complete - auto-save enabled');

      } catch (error) {
        console.error('❌ Cloud initialization error:', error);
        // Still enable auto-save on error so game can function
        cloudSyncCompleteRef.current = true;
      }
    };

    initCloudAndSystems();
  }, [currentUser, authInitialized]);

  // ✅ NEW: Initialize Mobile Status Bar (Transparent/Overlay)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Dark });
          // Optional: Hide it completely for immersive mode if desired
          // await StatusBar.hide(); 
          console.log('📱 Status Bar configured for mobile');
        } catch (e) {
          console.warn('Status Bar config failed:', e);
        }
      };
      initStatusBar();
    }
  }, []);

  // ✅ DISABLED: Real-time cloud syncing was causing infinite loops
  // The initial sync on page load is sufficient for cross-device sync
  // Real-time updates are not needed and cause feedback loops
  /*
  useEffect(() => {
    if (!currentUser || !authInitialized) return;

    const cloudManager = getCloudSaveManager();
    const rewardsManager = getLoginRewardsManager();
    const missionsManager = getDailyMissionManager();

    // Register cloud change listeners to pull latest data when Firestore updates
    const unsubscribeRewards = cloudManager.addListener?.((cloudData) => {
      if (cloudData && cloudData.loginRewards) {
        console.log('☁️ Cloud change detected: Login rewards updated', cloudData.loginRewards);
        // Trigger sync to pull latest rewards from cloud
        rewardsManager.syncFromCloud?.();
      }
    });

    const unsubscribeMissions = cloudManager.addListener?.((cloudData) => {
      if (cloudData && cloudData.dailyMissions) {
        console.log('☁️ Cloud change detected: Daily missions updated', cloudData.dailyMissions);
        // Trigger sync to pull latest missions from cloud
        missionsManager.syncFromCloud?.();
      }
    });

    return () => {
      if (unsubscribeRewards) unsubscribeRewards();
      if (unsubscribeMissions) unsubscribeMissions();
    };
  }, [currentUser, authInitialized]);
  */

  useEffect(() => {
    const timeout = setTimeout(() => { if (!authInitialized) setAuthInitialized(true); }, 5000);
    const unsubscribe = authManager.onAuthStateChange((user) => {
      setCurrentUser(user);
      clearTimeout(timeout);
      if (!authInitialized && !user) {
        authManager.autoSignIn().then(() => setAuthInitialized(true)).catch(() => setAuthInitialized(true));
      } else {
        setAuthInitialized(true);
      }
    });
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, [authInitialized]);

  useEffect(() => {
    try {
      const savedGame = localStorage.getItem("cyberrunner_save");
      if (savedGame) {
        const parsedGame = JSON.parse(savedGame);
        if (parsedGame.totalCoins) setTotalCoins(parsedGame.totalCoins);
        if (parsedGame.totalGems) setTotalGems(parsedGame.totalGems);
        if (parsedGame.reviveTokens !== undefined) setReviveTokens(parsedGame.reviveTokens); // ✅ FIX: Load revive tokens from localStorage
        if (parsedGame.boosters) setInventory(parsedGame.boosters); // ✅ FIX: Load boosters from localStorage
        if (parsedGame.upgrades) setUpgradeLevels(prev => ({ ...prev, ...parsedGame.upgrades }));
        if (parsedGame.ownedCharacters) setOwnedCharacters(parsedGame.ownedCharacters);
        if (parsedGame.selectedCharacter) setSelectedCharacter(parsedGame.selectedCharacter);
      }
      const savedScore = localStorage.getItem("cyberrunner_best_score");
      if (savedScore) setBestScore(parseInt(savedScore, 10) || 0);
    } catch (e) { }
  }, []);

  const saveGameData = async (newTotalCoins, newTotalGems, newUpgradeLevels, newOwnedCharacters, newSelectedCharacter, newReviveTokens, newInventory) => {
    const data = {
      totalCoins: newTotalCoins,
      totalGems: newTotalGems,
      reviveTokens: newReviveTokens !== undefined ? newReviveTokens : reviveTokens,
      boosters: newInventory !== undefined ? newInventory : inventory, // ✅ Save as 'boosters'
      upgrades: newUpgradeLevels,
      ownedCharacters: newOwnedCharacters || ownedCharacters,
      selectedCharacter: newSelectedCharacter || selectedCharacter,
      bestScore: bestScore, // Include score in save
      lastPlayed: Date.now()
    };

    // 1. Local Save (immediate)
    try {
      localStorage.setItem("cyberrunner_save", JSON.stringify(data));
    } catch (e) {
      console.error('Local save failed:', e);
    }

    // 2. ✅ Cloud Save (wait briefly for sync)
    if (currentUser) {
      try {
        const cloudManager = getCloudSaveManager();
        // Ensure cloud manager is initialized before attempting save (robust retry)
        if (!cloudManager.initialized) {
          console.log('☁️ Cloud manager not initialized, attempting init before save...');
          try {
            await cloudManager.init();
          } catch (e) {
            console.warn('☁️ Cloud init during save failed:', e);
          }
        }

        if (cloudManager.initialized) {
          await cloudManager.saveProgress(data);
          // Show a brief synced indicator in UI
          try {
            setShowSyncIndicator(true);
            setTimeout(() => setShowSyncIndicator(false), 1800);
          } catch (e) { }
        } else {
          console.warn('⚠️ Cloud save skipped - cloud manager not initialized');
        }
      } catch (error) {
        console.error('Cloud save failed:', error);
      }
    }
  };

  // === Debounced Auto-save on state changes (2s) ===
  useEffect(() => {
    if (!currentUser || !authInitialized) return;

    // ✅ CRITICAL: Block auto-save until initial cloud sync is complete
    if (!cloudSyncCompleteRef.current) {
      console.log('🚫 Auto-save blocked - waiting for initial cloud sync');
      return;
    }

    const autoSaveTimer = setTimeout(async () => {
      const data = {
        totalCoins,
        totalGems,
        reviveTokens,
        boosters: inventory, // ✅ Save inventory as boosters
        upgrades: upgradeLevels,
        ownedCharacters,
        selectedCharacter,
        bestScore,
        lastPlayed: Date.now()
      };

      try {
        const cloudManager = getCloudSaveManager();
        if (cloudManager.initialized) {
          await cloudManager.saveProgress(data);
          setShowSyncIndicator(true);
          setTimeout(() => setShowSyncIndicator(false), 1800);
          console.log('🔄 Auto-saved to cloud (state change)');
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [
    totalCoins,
    totalGems,
    reviveTokens, // ✅ Track changes
    inventory, // ✅ Track changes
    upgradeLevels,
    bestScore,
    ownedCharacters,
    selectedCharacter,
    currentUser,
    authInitialized
  ]);

  // === Periodic auto-save (every 30s) ===
  useEffect(() => {
    if (!currentUser || !authInitialized) return;

    const interval = setInterval(async () => {
      // ✅ CRITICAL: Block auto-save until initial cloud sync is complete
      if (!cloudSyncCompleteRef.current) {
        console.log('🚫 Periodic save blocked - waiting for initial cloud sync');
        return;
      }

      const data = {
        totalCoins,
        totalGems,
        reviveTokens,
        boosters: inventory, // ✅ Save inventory as boosters
        upgrades: upgradeLevels,
        ownedCharacters,
        selectedCharacter,
        bestScore,
        lastPlayed: Date.now()
      };

      try {
        const cloudManager = getCloudSaveManager();
        if (cloudManager.initialized) {
          await cloudManager.saveProgress(data);
          setShowSyncIndicator(true);
          setTimeout(() => setShowSyncIndicator(false), 1800);
          console.log('⏰ Periodic cloud save (30s)');
        }
      } catch (error) {
        console.error('❌ Periodic save failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser, authInitialized]);

  // === Network status listener: process queue when back online ===
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Network restored - syncing...');
      const cloudManager = getCloudSaveManager();
      if (cloudManager.initialized) {
        await cloudManager.processOfflineQueue();
      }
    };

    const handleOffline = () => {
      console.log('📡 Network lost - queuing saves');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, authInitialized]);

  const handleGameOver = () => {
    const newBest = Math.max(bestScore, Number(score) || 0);
    setBestScore(newBest);
    localStorage.setItem("cyberrunner_best_score", newBest.toString());

    // ✅ FIX #2: Track death with analytics if available
    try {
      if (window.gameEngine && window.gameEngine.lastDeathCause) {
        analytics.trackDeath(
          window.gameEngine.lastDeathCause,
          window.gameEngine.lastDeathPosition || { x: 0, y: 0, z: 0 },
          { distance, score, speed: window.gameEngine.lastSpeed || 0 }
        );
      }
    } catch (e) { /* non-fatal */ }

    // ✅ Submit to Cloud Leaderboard
    if (currentUser) {
      getLeaderboardManager().submitScore(Math.floor(score), distance, coins, selectedCharacter);
    }

    // ✅ NEW FIX: Update Daily Missions with run stats
    try {
      const missionManager = getDailyMissionManager();
      if (missionManager) {
        // Collect run stats from game engine if available
        const runStats = {
          distance: Math.floor(distance),
          coins: coins,
          score: Math.floor(score),
          runs: 1,
          jumps: window.gameEngine?.runStats?.jumps || 0,
          slides: window.gameEngine?.runStats?.slides || 0,
          powerUpsCollected: window.gameEngine?.runStats?.powerUpsCollected || 0,
          maxCombo: window.gameEngine?.runStats?.maxCombo || 0,
          grappleUses: window.gameEngine?.runStats?.grappleUses || 0,
          wallRunUses: window.gameEngine?.runStats?.wallRunUses || 0,
          nearMisses: window.gameEngine?.runStats?.nearMisses || 0,
          obstaclesHit: window.gameEngine?.runStats?.obstaclesHit || 0
        };
        console.log('📋 Updating daily missions with run stats:', runStats);
        missionManager.updateFromRunStats(runStats);
      }
    } catch (e) {
      console.error('❌ Failed to update daily missions:', e);
    }

    setShowEngagementHub(false);
    setShowAuthPanel(false);
    setMenu("gameOver");

    setShield(false); setMultiplier(1); setMagnetActive(false); setTimeSlowActive(false);
    const newTotalCoins = totalCoins + coins;
    setTotalCoins(newTotalCoins);
    saveGameData(newTotalCoins, totalGems, upgradeLevels, ownedCharacters, selectedCharacter);
  };

  const handleRevive = () => {
    if (reviveTokens > 0) {
      console.log('❤️ Using revive token...');
      const newReviveTokens = reviveTokens - 1;
      setReviveTokens(newReviveTokens);
      setReviveTrigger(prev => prev + 1);
      setMenu('playing');
      setHealth(100); // Update UI state

      // Save consumption
      saveGameData(totalCoins, totalGems, upgradeLevels, ownedCharacters, selectedCharacter, newReviveTokens, inventory);
    } else {
      console.warn('❌ No revive tokens available');
    }
  };

  const handlePurchaseUpgrade = (type, details = {}) => {
    // ✅ NEW: Handle booster purchase
    if (type === 'booster') {
      const { boosterId, cost } = details;
      const newTotalCoins = totalCoins - cost;

      // Save booster data to localStorage and cloud
      try {
        const boosterData = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
        boosterData[boosterId] = (boosterData[boosterId] || 0) + 1;
        localStorage.setItem('cyberrunner_boosters', JSON.stringify(boosterData));

        // Update total coins
        setTotalCoins(newTotalCoins);

        // Save to cloud
        const data = {
          totalCoins: newTotalCoins,
          totalGems,
          upgrades: upgradeLevels,
          ownedCharacters,
          selectedCharacter,
          bestScore,
          lastPlayed: Date.now(),
          boosters: boosterData
        };

        localStorage.setItem("cyberrunner_save", JSON.stringify(data));
        if (currentUser) {
          const cloudManager = getCloudSaveManager();
          if (cloudManager.initialized) {
            cloudManager.saveProgress(data).catch(e => {
              console.warn('⚠️ Booster cloud sync failed:', e);
            });
          }
        }

        analytics.trackUpgradePurchase(boosterId, 1, cost);
        console.log(`✅ Booster purchased and synced: ${boosterId}`);
      } catch (e) {
        console.error('❌ Failed to purchase booster:', e);
      }
      return;
    }

    // Handle regular upgrade (existing code)
    const config = SHOP_CONFIG[type];
    if (!config) return;
    const currentLevel = upgradeLevels[type] || 0;
    const cost = config.baseCost + (currentLevel * config.costIncrease);
    if (totalCoins >= cost) {
      const newTotalCoins = totalCoins - cost;
      const newUpgradeLevels = { ...upgradeLevels, [type]: currentLevel + 1 };
      analytics.trackUpgradePurchase(type, currentLevel + 1, cost);
      setTotalCoins(newTotalCoins);
      setUpgradeLevels(newUpgradeLevels);
      saveGameData(newTotalCoins, totalGems, newUpgradeLevels, ownedCharacters, selectedCharacter);
    }
  };

  const handleCharacterPurchase = (characterId) => {
    console.log(`💳 Purchase attempt for ${characterId}`);
    const character = CHARACTERS[characterId];
    if (!character) {
      console.error(`❌ Character not found: ${characterId}`);
      return;
    }
    if (ownedCharacters.includes(characterId)) {
      console.log(`Already own ${characterId}`);
      return;
    }
    if (totalCoins >= character.cost) {
      console.log(`✅ Purchase successful! ${character.cost} coins`);
      const newTotalCoins = totalCoins - character.cost;
      const newOwnedCharacters = [...ownedCharacters, characterId];
      setTotalCoins(newTotalCoins);
      setOwnedCharacters(newOwnedCharacters);
      saveGameData(newTotalCoins, totalGems, upgradeLevels, newOwnedCharacters, selectedCharacter);
      analytics.trackUpgradePurchase(`character_${characterId}`, 1, character.cost);
    } else {
      console.log(`❌ Cannot afford: need ${character.cost}, have ${totalCoins}`);
    }
  };

  const handleCharacterSelect = (characterId) => {
    if (!ownedCharacters.includes(characterId)) return;
    setSelectedCharacter(characterId);
    saveGameData(totalCoins, totalGems, upgradeLevels, ownedCharacters, characterId);
  };

  const handleEngagementReward = async (reward) => {
    console.log('🎁 Reward claimed:', reward);
    let newTotalCoins = totalCoins;
    let newTotalGems = totalGems;
    let newReviveTokens = reviveTokens;

    if (reward.coins) {
      newTotalCoins += reward.coins;
      setTotalCoins(newTotalCoins);
    }
    if (reward.gems) {
      newTotalGems += reward.gems;
      setTotalGems(newTotalGems);
    }
    if (reward.tokens) {
      newReviveTokens += reward.tokens;
      setReviveTokens(newReviveTokens);
    }

    await saveGameData(newTotalCoins, newTotalGems, upgradeLevels, ownedCharacters, selectedCharacter, newReviveTokens, inventory);
  };

  // ✅ NEW: Account Profile Handlers
  const handleUpdateUsername = async (newName) => {
    try {
      const accountManager = getAccountProfileManager();
      await accountManager.updateUsername(newName);

      // Refresh profile
      const updated = accountManager.getUserProfile();
      setUserProfile(updated);

      console.log('✅ Username updated:', newName);
    } catch (error) {
      console.error('❌ Username update failed:', error);
      throw error;
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      const accountManager = getAccountProfileManager();
      await accountManager.changePassword(currentPassword, newPassword);
      console.log('✅ Password changed successfully');
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  };

  const handleLogOut = async () => {
    try {
      const accountManager = getAccountProfileManager();
      await accountManager.logout();

      // Clear all state
      setCurrentUser(null);
      setUserProfile(null);
      setMenu('home');
      setShowAccountProfile(false);

      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  const handleStartGame = () => {
    console.log('🎮 Showing booster selector...');
    // Load booster data
    const boosters = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
    setBoosterData(boosters);
    // Show booster selector UI
    setShowBoosterSelector(true);
  };

  // ✅ NEW: Apply selected boosters and start game
  const handleStartGameWithBoosters = (selectedBoosters) => {
    console.log('🎮 Starting game with selected boosters!', selectedBoosters);
    setScore(0); setCoins(0); setDistance(0); setHealth(100 + (upgradeLevels.health * 10));
    setShield(CHARACTERS[selectedCharacter]?.stats?.startWithShield || false);
    setMultiplier(1); setMagnetActive(false); setTimeSlowActive(false);

    // Apply only the selected boosters
    const boosterData = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
    const appliedBoosters = [];

    Object.entries(selectedBoosters).forEach(([boosterId, isSelected]) => {
      if (isSelected && boosterData[boosterId] > 0) {
        appliedBoosters.push(boosterId);

        // Apply booster effects
        switch (boosterId) {
          case 'shield_start':
            setShield(true);
            console.log('🛡️ Shield Start applied!');
            break;
          case 'speed_start':
            setMultiplier(2.0);
            console.log('⚡ Speed Start applied! 2x multiplier');
            break;
          case 'magnet_start':
            setMagnetActive(true);
            console.log('🧲 Magnet Start applied!');
            break;
          case 'score_2x':
            setMultiplier(2.0);
            console.log('⭐ 2x Score applied!');
            break;
          case 'health_pack':
            setHealth(200 + (upgradeLevels.health * 10));
            console.log('❤️ Health Pack applied! +100 health');
            break;
          default:
            break;
        }

        // Decrement booster count
        boosterData[boosterId] = (boosterData[boosterId] || 0) - 1;
      }
    });

    // Save updated booster counts
    localStorage.setItem('cyberrunner_boosters', JSON.stringify(boosterData));
    setInventory(boosterData); // ✅ Sync inventory state
    if (appliedBoosters.length > 0) {
      console.log(`✅ Applied ${appliedBoosters.length} booster(s):`, appliedBoosters);
      // Sync to cloud
      const cloudManager = getCloudSaveManager();
      if (cloudManager && cloudManager.initialized) {
        cloudManager.saveProgress({ boosters: boosterData }).catch(e => {
          console.warn('⚠️ Booster sync failed:', e);
        });
      }
    }

    // Hide booster selector and start game
    setShowBoosterSelector(false);
    setEngineReady(false);
    setGameKey(t => t + 1);
    setMenu("playing");
    setShowEngagementHub(false);
    setShowAuthPanel(false);
  };

  const handleAuthPanelClose = () => {
    console.log('🔐 Closing auth panel');
    setShowAuthPanel(false);
  };

  const handleAuthSuccess = () => {
    console.log('✅ Auth successful');
    setShowAuthPanel(false);
  };

  const handlePerformanceTierChange = (tier) => {
    setPerformanceTier(tier);
    saveSetting('cyberrunner_performanceTier', tier);
  };

  const saveSetting = (key, value) => {
    try { localStorage.setItem(key, value.toString()); } catch (e) { }
  };

  // Audio handlers - connect to audioManager
  useEffect(() => {
    // Apply volumes to audioManager on change
    try {
      // values stored in 0-100, audioManager expects 0.0-1.0
      const mv = Math.max(0, Math.min(100, Number(musicVolume))) / 100;
      const sv = Math.max(0, Math.min(100, Number(sfxVolume))) / 100;
      // lazy-set audioManager if available
      try { window.audioManager && window.audioManager.setMusicVolume && window.audioManager.setMusicVolume(mv); } catch (e) { }
      try { window.audioManager && window.audioManager.setSfxVolume && window.audioManager.setSfxVolume(sv); } catch (e) { }
      // use module-local audioManager
      audioManager.setMusicVolume(mv);
      audioManager.setSfxVolume(sv);
    } catch (e) { }
    saveSetting('cyberrunner_musicVolume', musicVolume);
    saveSetting('cyberrunner_sfxVolume', sfxVolume);
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    // Toggle music playback
    if (musicOn) {
      // Fade in music to current musicVolume
      audioManager.loadSound && audioManager.play && audioManager.play('music', { loop: true });
      audioManager.fadeVolume && audioManager.fadeVolume('music', Math.max(0, Math.min(100, Number(musicVolume))) / 100, 600);
    } else {
      // Fade out then stop
      if (audioManager.fadeVolume) {
        audioManager.fadeVolume('music', 0, 400).then(() => audioManager.stop && audioManager.stop('music'));
      } else {
        audioManager.stop && audioManager.stop('music');
      }
    }
    saveSetting('cyberrunner_musicOn', musicOn);
  }, [musicOn]);

  useEffect(() => {
    // For SFX toggle: if off, set sfx volume to 0; if on, restore to sfxVolume
    if (!sfxOn) {
      // remember previous value and mute
      setPrevSfxVolume(sfxVolume);
      audioManager.setSfxVolume(0);
    } else {
      const sv = Math.max(0, Math.min(100, Number(sfxVolume))) / 100;
      // restore to either the slider value or previous stored
      audioManager.setSfxVolume(sv || (Math.max(0, Math.min(100, Number(prevSfxVolume))) / 100));
    }
    saveSetting('cyberrunner_sfxOn', sfxOn);
  }, [sfxOn]);

  const handleBackToHome = () => {
    console.log('🏠 Going back to home from:', menu);
    setMenu('home');
    setShowEngagementHub(false);
    setShowAuthPanel(false);
    if (menu === 'gameOver' || menu === 'paused') {
      setGameKey(k => k + 1);
    }
  };

  const handlePauseGame = () => {
    console.log('⏸️ Pausing game, current menu:', menu);
    setMenu('paused');
  };

  const handleResumeGame = () => {
    console.log('▶️ Resuming game');
    setMenu('playing');
  };

  const handleOpenSettings = (fromMenu = 'home') => {
    console.log('⚙️ Opening settings from:', fromMenu);
    setPreviousMenu(fromMenu);
    setMenu('settings');
  };

  const handleBackFromSettings = () => {
    console.log('◀️ Going back from settings to:', previousMenu);
    setMenu(previousMenu);
  };

  const handleOpenEngagementHub = () => {
    console.log('🎁 OPENING ENGAGEMENT HUB!');
    setShowEngagementHub(true);
  };

  // ✅ NEW: Handle Diamond Shop Purchases
  const handleShopPurchase = (itemId, cost, reward) => {
    console.log('💎 Processing purchase:', itemId, cost, reward);

    // 1. Deduct gems
    if (totalGems < cost) {
      console.error('❌ Not enough gems for purchase');
      return;
    }
    setTotalGems(prev => prev - cost);

    // 2. Grant reward
    if (reward.type === 'coins') {
      setTotalCoins(prev => prev + reward.amount);
      console.log('💰 Purchased coins:', reward.amount);
    } else if (reward.type === 'revives') {
      // Add revives (assuming we track them, if not, we might need to add state for it)
      // For now, let's assume we store them in upgradeLevels or a separate state
      // If we don't have a specific state for revives, we might need to add one.
      // Let's check if we have 'reviveTokens' state.
      // If not, I'll add it to upgradeLevels for now or create a new state.
      // Checking state... we have 'upgradeLevels'. Let's assume revives are consumable.
      // I'll add a 'consumables' state to App.jsx if it doesn't exist, or just log for now if I can't find it.
      // Wait, the user asked for "purchase options... revives".
      // I should probably add a simple 'reviveTokens' state to App.jsx.
      setReviveTokens(prev => prev + reward.amount);
      console.log('❤️ Purchased revives:', reward.amount);
    } else if (reward.type === 'booster') {
      // Grant booster
      setInventory(prev => ({
        ...prev,
        [reward.boosterType]: (prev[reward.boosterType] || 0) + 1
      }));

      // ✅ SYNC with localStorage for BoosterSelector
      try {
        const boosters = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
        boosters[reward.boosterType] = (boosters[reward.boosterType] || 0) + 1;
        localStorage.setItem('cyberrunner_boosters', JSON.stringify(boosters));
      } catch (e) { console.error('Failed to sync booster to local storage', e); }

      console.log('🚀 Purchased booster:', reward.boosterType);
    } else if (reward.type === 'booster_bundle') {
      setInventory(prev => {
        const newInv = { ...prev };
        reward.boosters.forEach(b => {
          newInv[b] = (newInv[b] || 0) + 1;
        });
        return newInv;
      });

      // ✅ SYNC with localStorage for BoosterSelector
      try {
        const boosters = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
        reward.boosters.forEach(b => {
          boosters[b] = (boosters[b] || 0) + 1;
        });
        localStorage.setItem('cyberrunner_boosters', JSON.stringify(boosters));
      } catch (e) { console.error('Failed to sync bundle to local storage', e); }

      console.log('📦 Purchased booster bundle');
    }

    // 3. Save progress will happen automatically via auto-save
  };

  const handlePowerUp = (type) => {
    // ✅ FIX #2: Track power-up collection
    analytics.trackPowerUpCollected(type, distance);

    if (type === 'shield') {
      setShield(true);
      setTimeout(() => setShield(false), CONSTANTS.POWERUP.SHIELD_DURATION + (upgradeLevels.shield * 1000));

    } else if (type === 'multiplier') {
      setMultiplier(2);
      setTimeout(() => setMultiplier(1), CONSTANTS.POWERUP.MULTIPLIER_DURATION + (upgradeLevels.multiplier * 1500));

    } else if (type === 'magnet') {
      setMagnetActive(true);
      setTimeout(() => setMagnetActive(false), CONSTANTS.POWERUP.MAGNET_DURATION + (upgradeLevels.magnet * 1000));

    } else if (type === 'time') {
      // ✅ FIXED: Activate time slow via ability callback
      console.log('⏱️ App.jsx: Activating time slow power-up...');

      // Use the ability callback from GameEngine
      if (abilityCallbacks && abilityCallbacks.handleTimeSlowActivate) {
        abilityCallbacks.handleTimeSlowActivate();
        setTimeSlowActive(true);
        const duration = CONSTANTS.POWERUP.TIME_SLOW_DURATION + (upgradeLevels.time * 500);
        setTimeout(() => {
          setTimeSlowActive(false);
        }, duration);
        console.log('✅ Time slow activated successfully for', duration, 'ms');
      } else {
        console.warn('⚠️ Time slow callback not available yet - ability callbacks:', abilityCallbacks);
        // Fallback: set visual state anyway
        setTimeSlowActive(true);
        setTimeout(() => setTimeSlowActive(false), CONSTANTS.POWERUP.TIME_SLOW_DURATION);
      }

    } else if (type === 'lightning') {
      // ✅ FIXED: Activate lightning dash via callback
      console.log('⚡ App.jsx: Activating lightning dash power-up...');
      if (abilityCallbacks && abilityCallbacks.handleLightningActivate) {
        abilityCallbacks.handleLightningActivate();
        setLightningActive(true);
        // Lightning dash has a short visual duration
        setTimeout(() => setLightningActive(false), 1500);
        console.log('✅ Lightning dash activated!');
      } else {
        console.warn('⚠️ Lightning callback not available yet - ability callbacks:', abilityCallbacks);
      }
    }
  };

  // ✨ NEW: Handle ability callbacks from GameEngine
  const handleAbilityCallbacks = (callbacks) => {
    console.log('🎮 App.jsx: Received ability callbacks:', callbacks);
    setAbilityCallbacks(callbacks);
  };

  const renderContent = () => {
    if (menu === 'playing') return null;

    if (menu === 'gameOver') {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="neon-panel centered-panel" style={{ width: '90%', maxWidth: '400px', margin: '0 auto' }}>
            <GameOverMenu
              score={score} coins={coins}
              onRestart={handleStartGame}
              onQuit={handleBackToHome}
              reviveTokens={reviveTokens} // ✨ NEW: Pass revive tokens
              onRevive={handleRevive} // ✨ NEW: Pass revive handler
            />
          </div>
        </div>
      );
    }

    if (menu === 'paused') {
      return (
        <PauseMenu
          visible={true}
          onResume={handleResumeGame}
          onRestart={handleStartGame}
          onQuit={handleBackToHome}
          onSettings={() => handleOpenSettings('paused')} // ✅ Track that settings was opened from pause menu
        />
      );
    }

    // ✅ REMOVED: CharacterShop intermediate page - going directly to CharacterPreviewPage
    // Keeping this comment for documentation purposes

    // ✅ CHARACTER PREVIEW PAGE ROUTE (Now accessed directly from RUNNERS button)
    if (menu === 'characters' || menu === 'character-preview') {
      return (
        <CharacterPreviewPage
          selectedCharacter={selectedCharacter}
          totalCoins={totalCoins}
          ownedCharacters={ownedCharacters}
          onCharacterPurchase={handleCharacterPurchase}
          onEquip={(characterId) => {
            console.log(`🎭 Character Preview: Equipping ${characterId}`);

            // 1. Update React state
            setSelectedCharacter(characterId);

            // 2. Save to localStorage
            try {
              const gameData = JSON.parse(localStorage.getItem("cyberrunner_save") || "{}");
              gameData.selectedCharacter = characterId;
              localStorage.setItem("cyberrunner_save", JSON.stringify(gameData));
              console.log("✅ Character saved to localStorage");
            } catch (err) {
              console.error("❌ Failed to save character:", err);
            }

            // 3. Sync to Firebase Cloud (optional)
            try {
              const cloudManager = getCloudSaveManager();
              if (cloudManager && currentUser) {
                cloudManager.updateUserData({
                  selectedCharacter: characterId
                }).catch(err =>
                  console.warn("⚠ Cloud sync skipped:", err.message)
                );
              }
            } catch (err) {
              console.warn("⚠ Cloud manager not ready, skipping sync");
            }

            // 4. Track analytics
            if (analytics) {
              analytics.logEvent('character_equipped', {
                character_id: characterId,
                timestamp: Date.now(),
                source: 'character_preview'
              });
            }

            // 5. Navigate back to home menu
            setTimeout(() => {
              setMenu("home");
            }, 300);
          }}
          onBack={() => {
            console.log("← Closing Character Preview, returning home");
            setMenu("home");
          }}
        />
      );
    }

    if (menu === 'home' || menu === 'shop' || menu === 'settings') {
      return (
        <>
          <div className="menu-wrapper active" style={{ zIndex: 10, pointerEvents: 'auto' }}>
            <CyberRunnerHomeScreen
              onStart={handleStartGame}
              onOpenSettings={() => handleOpenSettings('home')} // ✅ Track that settings was opened from home
              onOpenShop={() => {
                console.log('🛒 Opening shop');
                setMenu("shop");
              }}
              onOpenCharacters={() => {
                console.log('🏃 Opening characters');
                setMenu("characters");
              }}
              onOpenCharacterPreview={(characterId) => {
                console.log('🎭 Opening character preview for:', characterId);
                setMenu("character-preview");
              }}
              onOpenEngagement={handleOpenEngagementHub}
              onOpenAccountProfile={() => setShowAccountProfile(true)} // ✅ NEW: Account Profile
              onOpenAuth={() => {
                console.log('🔐 Opening auth');
                setShowAuthPanel(true);
              }}
              currentUser={currentUser} // ✅ Pass current user for conditional rendering
              bestScore={bestScore}
              totalCoins={totalCoins}
              totalGems={totalGems}
              selectedCharacter={selectedCharacter}
              ownedCharacters={ownedCharacters}
              onCharacterSelect={handleCharacterSelect}
            />
          </div>
          {menu === 'settings' && (
            <SettingsMenu
              visible={true}
              musicOn={musicOn} sfxOn={sfxOn} isHighQuality={isHighQuality}
              musicVolume={musicVolume} sfxVolume={sfxVolume}
              onMusicVolumeChange={(v) => setMusicVolume(v)} onSfxVolumeChange={(v) => setSfxVolume(v)}
              toggleMusic={() => setMusicOn(!musicOn)} toggleSfx={() => setSfxOn(!sfxOn)}
              toggleHighQuality={() => {
                const newQuality = !isHighQuality;
                setPerformanceTier(newQuality ? 'high' : 'medium');
              }}
              performanceTier={performanceTier} onPerformanceTierChange={handlePerformanceTierChange}
              batterySaverMode={batterySaverMode} onBatterySaverToggle={() => setBatterySaverMode(!batterySaverMode)}
              onBack={handleBackFromSettings} // ✅ Use smart back handler instead of always going home
              currentUser={currentUser} onOpenAuth={() => setShowAuthPanel(true)}
            />
          )}
          {menu === 'shop' && (
            <ShopMenu
              visible={true}
              totalCoins={totalCoins}
              totalGems={totalGems}
              upgradeLevels={upgradeLevels}
              onPurchase={handlePurchaseUpgrade}
              onDiamondPurchase={handleShopPurchase}
              onBack={handleBackToHome}
              ownedCharacters={ownedCharacters}
              selectedCharacter={selectedCharacter}
              onCharacterPurchase={handleCharacterPurchase}
              onCharacterSelect={handleCharacterSelect}
            />
          )}
        </>
      );
    }
    return null;
  };

  return (
    <>
      <LoadingScreen visible={!isEngineReady || !authInitialized} isEngineReady={isEngineReady} authInitialized={authInitialized} />

      {/* GAME ENGINE */}
      <div style={{ display: (menu === 'playing' || !isEngineReady) ? 'block' : 'none', width: '100%', height: '100vh', position: 'absolute', inset: 0, zIndex: 0 }}>
        <GameEngine
          key={gameKey}
          menuState={menu}
          musicOn={musicOn}
          sfxOn={sfxOn}
          isHighQuality={isHighQuality}
          startHealth={100 + (upgradeLevels.health * 10)}
          reviveTrigger={reviveTrigger} // ✨ NEW: Revive trigger
          onGameOver={handleGameOver}
          onStatsUpdate={(stats) => {
            setScore(Math.floor(stats.score)); setCoins(Math.floor(stats.coins)); setDistance(Math.floor(stats.distance));
            if (stats.health < health) setDamageDirection({ x: 0, z: -1 });
            setHealth(stats.health); setCombo(stats.combo); setDifficultyPhase(stats.difficultyPhase);
            setFps(stats.fps); setSpeed(stats.speed); setEnergyMode(stats.energyMode); setDangerZones(stats.dangerZones);
            setSlowMotionActive(stats.slowMotionActive); setGrappleData(stats.grapple); setPlayerLane(stats.playerLane);
            // ✨ NEW: Store ability states from game engine
            if (stats.abilityStates) {
              setAbilityStates(stats.abilityStates);
            }
          }}
          onPowerUp={handlePowerUp}
          onAbilityStatesUpdate={handleAbilityCallbacks}
          shieldActive={shield} multiplier={multiplier} isMagnetActive={isMagnetActive} isTimeSlowActive={isTimeSlowActive}
          onReady={() => {
            console.log('🎮 Game engine ready!');
            setEngineReady(true);
          }}
          selectedCharacter={selectedCharacter}
        />
      </div>

      {/* MENUS */}
      <div className="menu-root">
        {renderContent()}
      </div>

      {/* GAME HUD AND OVERLAYS */}
      {isEngineReady && authInitialized && <TutorialHints menuState={menu} distance={distance} />}
      {isEngineReady && authInitialized && menu === 'playing' && (
        <>
          <GameHUD
            score={score}
            distance={distance}
            coins={coins}
            health={health}
            fps={fps}
            onPause={handlePauseGame} /* ✅ FIXED: Passed the correct function */
            shield={shield}
            multiplier={multiplier}
            isMagnetActive={isMagnetActive}
            isTimeSlowActive={isTimeSlowActive}
            combo={combo}
            difficultyPhase={difficultyPhase}
            grappleData={grappleData}
            playerLane={playerLane}
          />

          {/* ✅ FIX #1: Add Ability Buttons (3 main abilities) */}
          {abilityCallbacks && showAbilityButtons && (
            <AbilityButtons
              abilityStates={abilityStates}
              onLightningActivate={abilityCallbacks.handleLightningActivate}
              onShieldActivate={abilityCallbacks.handleShieldActivate}
              onSpeedBoostActivate={abilityCallbacks.handleSpeedBoostActivate}
            />
          )}

          <SpeedMeter speed={speed} maxSpeed={CONSTANTS.GAME.MAX_SPEED} baseSpeed={CONSTANTS.GAME.BASE_SPEED} />
          <DamageIndicator damageDirection={damageDirection} onFade={() => setDamageDirection(null)} />
          <EnergyModeDisplay energyMode={energyMode} />
          <DangerZoneVisuals dangerZones={dangerZones} />
          {slowMotionActive && <div className="slow-motion-overlay" />}
        </>
      )}

      {/* AUTH PANEL */}
      {showAuthPanel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          pointerEvents: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)'
        }}>
          <AuthPanel onClose={handleAuthPanelClose} onAuthSuccess={handleAuthSuccess} />
        </div>
      )}

      {/* ENGAGEMENT HUB - FIXED CONTAINER */}
      {showEngagementHub && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)'
        }}>
          <EngagementHubNew
            visible={true}
            onBack={() => setShowEngagementHub(false)}
            totalCoins={totalCoins}
            totalGems={totalGems}
            onRewardClaimed={handleEngagementReward}
          />
        </div>
      )}

      {/* ✅ NEW: ACCOUNT PROFILE PAGE */}
      {showAccountProfile && (
        <AccountProfilePage
          visible={showAccountProfile}
          onBack={() => setShowAccountProfile(false)}
          userProfile={userProfile}
          onUpdateUsername={handleUpdateUsername}
          onChangePassword={handleChangePassword}
          onLogOut={handleLogOut}
          authManager={authManager}
        />
      )}

      {/* ✅ NEW: BOOSTER SELECTOR */}
      {showBoosterSelector && (
        <BoosterSelector
          boosterData={boosterData}
          onStart={handleStartGameWithBoosters}
          onBack={() => setShowBoosterSelector(false)}
        />
      )}
      {/* Cloud sync indicator */}
      <CloudSyncIndicator visible={showSyncIndicator} />

      {/* ✅ DEBUG: Cloud Sync Debug Panel - Press Shift+D to open */}
      <CloudSyncDebugPanel
        visible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </>
  );
}