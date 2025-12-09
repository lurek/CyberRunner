/**
 * ✅ PHASE 4: Enhanced Save System with Cloud Sync Support
 */

const SAVE_VERSION = '1.0.0';
const SAVE_KEY_PREFIX = 'cyberrunner_v1_';

class SaveManager {
  constructor() {
    this.saveKeys = {
      game: `${SAVE_KEY_PREFIX}game`,
      settings: `${SAVE_KEY_PREFIX}settings`,
      progress: `${SAVE_KEY_PREFIX}progress`,
      inventory: `${SAVE_KEY_PREFIX}inventory`,
      lastSync: `${SAVE_KEY_PREFIX}lastSync`
    };
    
    this.autoSaveTimer = null;
    this.cloudSyncEnabled = false;
  }

  saveGameData(data) {
    try {
      const saveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        data: {
          totalCoins: data.totalCoins || 0,
          totalGems: data.totalGems || 0,
          bestScore: data.bestScore || 0,
          totalDistance: data.totalDistance || 0,
          gamesPlayed: data.gamesPlayed || 0,
          // ✅ NEW: Character data
          ownedCharacters: data.ownedCharacters || ['default'],
          selectedCharacter: data.selectedCharacter || 'default',
          // ✅ NEW: Upgrades
          upgradeLevels: data.upgradeLevels || {}
        }
      };
      
      localStorage.setItem(this.saveKeys.game, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to save:', error);
      return false;
    }
  }

  loadGameData() {
    try {
      const saved = localStorage.getItem(this.saveKeys.game);
      if (!saved) return this.getDefaultGameData();
      
      const saveData = JSON.parse(saved);
      return saveData.data;
    } catch (error) {
      return this.getDefaultGameData();
    }
  }

  getDefaultGameData() {
    return {
      totalCoins: 0,
      totalGems: 0,
      bestScore: 0,
      totalDistance: 0,
      gamesPlayed: 0,
      ownedCharacters: ['default'],
      selectedCharacter: 'default',
      upgradeLevels: {}
    };
  }

  exportAllData() {
    return {
      version: SAVE_VERSION,
      exportDate: new Date().toISOString(),
      game: this.loadGameData()
    };
  }
}

const saveManager = new SaveManager();
export { saveManager, SaveManager };
