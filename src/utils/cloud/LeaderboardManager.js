/**
 * Leaderboard Manager - FIXED
 * Adapted for Firestore (matching firebase-config.js)
 */

import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  onSnapshot
} from './firebase-config.js';

export class LeaderboardManager {
  constructor() {
    this.initialized = false;
    this.currentUserId = null;
    this.currentUserName = null;
  }
  
  async init(userId, userName = 'Player') {
    if (!db) {
      console.warn('⚠️ Leaderboards disabled: Firestore not configured');
      return false;
    }
    
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.initialized = true;
    
    console.log('✅ Leaderboard initialized for:', userName);
    return true;
  }
  
  async submitScore(score, distance, coins, character = 'default') {
    if (!this.initialized) return false;
    
    try {
      // Check current high score to avoid unnecessary writes
      // We store leaderboards in a separate collection 'leaderboard_global'
      const scoreRef = doc(db, 'leaderboard_global', this.currentUserId);
      const snapshot = await getDoc(scoreRef);
      
      const currentBest = snapshot.exists() ? snapshot.data().score : 0;
      
      if (score > currentBest) {
        const scoreData = {
          userId: this.currentUserId,
          userName: this.currentUserName,
          score: score,
          distance: distance,
          coins: coins,
          character: character,
          timestamp: Date.now()
        };
        
        await setDoc(scoreRef, scoreData);
        console.log('✅ New high score submitted to leaderboard:', score);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to submit score:', error);
      return false;
    }
  }
  
  async getGlobalLeaderboard(limitCount = 100) {
    if (!this.initialized) return [];
    
    try {
      const q = query(
        collection(db, 'leaderboard_global'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const scores = [];
      
      snapshot.forEach(doc => {
        scores.push({ id: doc.id, ...doc.data() });
      });
      
      return scores;
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  // Stub for weekly to prevent crashes, can be implemented with 'leaderboard_weekly' collection
  async getWeeklyLeaderboard(limitCount = 100) {
    return this.getGlobalLeaderboard(limitCount);
  }

  async getPlayerRank() {
    // Firestore doesn't support easy ranking without reading all docs
    // For now, we just return null or estimate from top 100
    const top100 = await this.getGlobalLeaderboard(100);
    const index = top100.findIndex(e => e.userId === this.currentUserId);
    
    if (index !== -1) {
      return { rank: index + 1, score: top100[index].score, total: '100+' };
    }
    return null;
  }
  
  getCurrentWeek() {
    // Helper for future weekly implementation
    return 'Week 1';
  }
}

// Singleton
let leaderboardManager = null;
export function getLeaderboardManager() {
  if (!leaderboardManager) {
    leaderboardManager = new LeaderboardManager();
  }
  return leaderboardManager;
}