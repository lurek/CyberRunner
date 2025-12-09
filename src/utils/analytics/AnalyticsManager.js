/**
 * ✅ PHASE 0.4: Analytics Foundation
 * Tracks critical metrics for data-driven optimization
 * 
 * Key Metrics:
 * - Death locations/causes (heatmap data)
 * - Session length & retention
 * - Upgrade purchase rates
 * - User progression
 */

export class AnalyticsManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.events = [];
    this.deathHeatmap = [];
    this.maxStoredEvents = 1000;
    this.enabled = true;
    
    // Load persistent data
    this.loadPersistentData();
    
    console.log('📊 Analytics Manager initialized');
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  loadPersistentData() {
    try {
      const stored = localStorage.getItem('cyberRunnerAnalytics');
      if (stored) {
        const data = JSON.parse(stored);
        this.totalSessions = data.totalSessions || 0;
        this.totalPlaytime = data.totalPlaytime || 0;
        this.totalDeaths = data.totalDeaths || 0;
        this.totalDistance = data.totalDistance || 0;
        this.totalCoins = data.totalCoins || 0;
        this.highScore = data.highScore || 0;
        this.firstSession = data.firstSession || Date.now();
        this.lastSession = data.lastSession || Date.now();
      } else {
        this.totalSessions = 0;
        this.totalPlaytime = 0;
        this.totalDeaths = 0;
        this.totalDistance = 0;
        this.totalCoins = 0;
        this.highScore = 0;
        this.firstSession = Date.now();
        this.lastSession = Date.now();
      }
      
      this.totalSessions++;
      this.lastSession = Date.now();
      this.savePersistentData();
      
    } catch (error) {
      console.warn('⚠️ Could not load analytics data:', error);
    }
  }

  savePersistentData() {
    try {
      const data = {
        totalSessions: this.totalSessions,
        totalPlaytime: this.totalPlaytime,
        totalDeaths: this.totalDeaths,
        totalDistance: this.totalDistance,
        totalCoins: this.totalCoins,
        highScore: this.highScore,
        firstSession: this.firstSession,
        lastSession: this.lastSession
      };
      localStorage.setItem('cyberRunnerAnalytics', JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Could not save analytics data:', error);
    }
  }

  // Track custom events
  trackEvent(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...properties
    };

    this.events.push(event);

    // Limit stored events
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }

    console.log(`📊 Event: ${eventName}`, properties);
  }

  // === GAMEPLAY TRACKING ===

  trackGameStart(difficulty = 'normal') {
    this.trackEvent('game_start', {
      difficulty,
      sessionNumber: this.totalSessions
    });
  }

  trackGameEnd(stats) {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000; // seconds
    
    this.trackEvent('game_end', {
      distance: stats.distance || 0,
      score: stats.score || 0,
      coins: stats.coins || 0,
      sessionDuration,
      deaths: 1
    });

    // Update persistent stats
    this.totalPlaytime += sessionDuration;
    this.totalDeaths++;
    this.totalDistance += (stats.distance || 0);
    this.totalCoins += (stats.coins || 0);
    
    if (stats.score > this.highScore) {
      this.highScore = stats.score;
      this.trackEvent('new_high_score', { score: stats.score });
    }

    this.savePersistentData();
  }

  trackDeath(cause, position, stats) {
    // Track death for heatmap
    const deathData = {
      cause,
      x: position.x,
      y: position.y,
      z: position.z,
      distance: stats.distance || 0,
      speed: stats.speed || 0,
      timestamp: Date.now()
    };

    this.deathHeatmap.push(deathData);

    // Limit heatmap size
    if (this.deathHeatmap.length > 500) {
      this.deathHeatmap = this.deathHeatmap.slice(-500);
    }

    this.trackEvent('player_death', {
      cause,
      distance: stats.distance || 0,
      score: stats.score || 0,
      speed: stats.speed || 0
    });

    console.log(`💀 Death tracked: ${cause} at ${Math.round(stats.distance)}m`);
  }

  // === PROGRESSION TRACKING ===

  trackPowerUpCollected(type, distance) {
    this.trackEvent('power_up_collected', {
      type,
      distance
    });
  }

  trackUpgradePurchase(upgradeType, level, cost) {
    this.trackEvent('upgrade_purchase', {
      upgradeType,
      level,
      cost
    });
  }

  trackAbilityUsed(abilityName, distance) {
    this.trackEvent('ability_used', {
      ability: abilityName,
      distance
    });
  }

  // === MILESTONE TRACKING ===

  trackMilestone(milestone, value) {
    this.trackEvent('milestone_reached', {
      milestone,
      value
    });
  }

  // === UI TRACKING ===

  trackMenuNavigation(from, to) {
    this.trackEvent('menu_navigation', {
      from,
      to
    });
  }

  trackSettingChange(setting, oldValue, newValue) {
    this.trackEvent('setting_change', {
      setting,
      oldValue,
      newValue
    });
  }

  // === REPORTING ===

  getDeathHeatmap() {
    // Group deaths by cause
    const heatmap = {};
    
    this.deathHeatmap.forEach(death => {
      if (!heatmap[death.cause]) {
        heatmap[death.cause] = 0;
      }
      heatmap[death.cause]++;
    });

    return heatmap;
  }

  getSessionReport() {
    const now = Date.now();
    const currentSessionDuration = (now - this.sessionStartTime) / 1000;
    const daysSinceFirstSession = (now - this.firstSession) / (1000 * 60 * 60 * 24);

    return {
      // Current Session
      sessionId: this.sessionId,
      sessionDuration: Math.round(currentSessionDuration),
      
      // Lifetime Stats
      totalSessions: this.totalSessions,
      totalPlaytime: Math.round(this.totalPlaytime),
      totalDeaths: this.totalDeaths,
      totalDistance: Math.round(this.totalDistance),
      totalCoins: this.totalCoins,
      highScore: this.highScore,
      
      // Retention Metrics
      daysSinceFirstSession: Math.round(daysSinceFirstSession * 10) / 10,
      averageSessionLength: this.totalSessions > 0 ? 
        Math.round((this.totalPlaytime / this.totalSessions) * 10) / 10 : 0,
      
      // Death Analysis
      deathHeatmap: this.getDeathHeatmap(),
      averageDistancePerRun: this.totalDeaths > 0 ?
        Math.round((this.totalDistance / this.totalDeaths) * 10) / 10 : 0
    };
  }

  // Export data for external analysis
  exportData() {
    return {
      session: this.getSessionReport(),
      events: this.events,
      deathHeatmap: this.deathHeatmap
    };
  }

  // Print summary to console
  printSummary() {
    const report = this.getSessionReport();
    
    console.group('📊 Analytics Summary');
    console.log('🎮 Sessions:', report.totalSessions);
    console.log('⏱️ Total Playtime:', `${Math.floor(report.totalPlaytime / 60)}m ${report.totalPlaytime % 60}s`);
    console.log('💀 Total Deaths:', report.totalDeaths);
    console.log('🏃 Total Distance:', `${report.totalDistance}m`);
    console.log('🪙 Total Coins:', report.totalCoins);
    console.log('🏆 High Score:', report.highScore);
    console.log('📊 Avg Session Length:', `${report.averageSessionLength}s`);
    console.log('📈 Avg Distance/Run:', `${report.averageDistancePerRun}m`);
    console.groupEnd();
    
    if (Object.keys(report.deathHeatmap).length > 0) {
      console.group('💀 Death Causes');
      Object.entries(report.deathHeatmap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cause, count]) => {
          console.log(`${cause}: ${count} (${Math.round(count / report.totalDeaths * 100)}%)`);
        });
      console.groupEnd();
    }
  }

  // Reset all data
  reset() {
    if (confirm('⚠️ This will delete all analytics data. Continue?')) {
      localStorage.removeItem('cyberRunnerAnalytics');
      this.events = [];
      this.deathHeatmap = [];
      this.loadPersistentData();
      console.log('🔄 Analytics data reset');
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();
