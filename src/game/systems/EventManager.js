/**
 * Event Manager - Phase 4
 * Handles special events and environmental hazards
 */

import * as THREE from "three";

export class EventManager {
  constructor(constants, scene) {
    this.constants = constants;
    this.scene = scene;
    this.activeEvents = [];
    this.eventTimer = 0;
    this.nextEventTime = 30; // First event after 30 seconds
    
    // Event types and their weights
    this.eventTypes = [
      { type: 'meteor_shower', weight: 1.0, duration: 15 },
      { type: 'lightning_storm', weight: 1.0, duration: 12 },
      { type: 'speed_boost_zone', weight: 0.8, duration: 10 },
      { type: 'coin_rain', weight: 1.2, duration: 8 }
    ];
  }

  /**
   * Update event system
   */
  update(deltaTime, playerPosition, distance) {
    this.eventTimer += deltaTime;

    // Check if it's time for a new event
    if (this.eventTimer >= this.nextEventTime && this.activeEvents.length === 0) {
      this.spawnEvent(playerPosition, distance);
      this.eventTimer = 0;
      this.nextEventTime = 20 + Math.random() * 30; // 20-50 seconds between events
    }

    // Update active events
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const event = this.activeEvents[i];
      event.timer += deltaTime;

      this.updateEvent(event, deltaTime, playerPosition);

      // Remove expired events
      if (event.timer >= event.duration) {
        this.endEvent(event);
        this.activeEvents.splice(i, 1);
      }
    }
  }

  /**
   * Spawn a random event
   */
  spawnEvent(playerPosition, distance) {
    // Select event type based on weights
    const totalWeight = this.eventTypes.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedType = this.eventTypes[0];
    for (const eventType of this.eventTypes) {
      random -= eventType.weight;
      if (random <= 0) {
        selectedType = eventType;
        break;
      }
    }

    const event = {
      type: selectedType.type,
      duration: selectedType.duration,
      timer: 0,
      position: playerPosition.clone(),
      data: {}
    };

    this.initializeEvent(event, playerPosition);
    this.activeEvents.push(event);

    console.log(`🌟 Event started: ${event.type} (${event.duration}s)`);
  }

  /**
   * Initialize event-specific data
   */
  initializeEvent(event, playerPosition) {
    switch(event.type) {
      case 'meteor_shower':
        event.data.meteorInterval = 0;
        event.data.meteors = [];
        break;

      case 'lightning_storm':
        event.data.lightningInterval = 0;
        event.data.strikes = [];
        break;

      case 'speed_boost_zone':
        event.data.zoneStart = playerPosition.z;
        event.data.zoneLength = 200;
        break;

      case 'coin_rain':
        event.data.coinInterval = 0;
        break;
    }
  }

  /**
   * Update specific event
   */
  updateEvent(event, deltaTime, playerPosition) {
    switch(event.type) {
      case 'meteor_shower':
        this.updateMeteorShower(event, deltaTime, playerPosition);
        break;

      case 'lightning_storm':
        this.updateLightningStorm(event, deltaTime, playerPosition);
        break;

      case 'speed_boost_zone':
        this.updateSpeedBoostZone(event, deltaTime, playerPosition);
        break;

      case 'coin_rain':
        this.updateCoinRain(event, deltaTime, playerPosition);
        break;
    }
  }

  updateMeteorShower(event, deltaTime, playerPosition) {
    event.data.meteorInterval += deltaTime;

    // Spawn meteors every 2 seconds
    if (event.data.meteorInterval >= 2.0) {
      event.data.meteorInterval = 0;
      
      // Return meteor spawn data
      event.data.nextMeteor = {
        type: 'spike', // Meteors are spike obstacles
        lane: Math.floor(Math.random() * 3),
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE,
        data: { isMeteor: true }
      };
    }

    // Update existing meteor visuals (if any)
    event.data.meteors.forEach(meteor => {
      if (meteor.mesh) {
        meteor.mesh.rotation.x += deltaTime * 3;
        meteor.mesh.rotation.y += deltaTime * 2;
      }
    });
  }

  updateLightningStorm(event, deltaTime, playerPosition) {
    event.data.lightningInterval += deltaTime;

    // Spawn lightning every 1.5 seconds
    if (event.data.lightningInterval >= 1.5) {
      event.data.lightningInterval = 0;
      
      event.data.nextStrike = {
        type: 'rotating_laser', // Lightning is like a rotating laser
        lane: Math.floor(Math.random() * 3),
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE,
        data: { isLightning: true }
      };
    }
  }

  updateSpeedBoostZone(event, deltaTime, playerPosition) {
    // Check if player is in the zone
    const relativeZ = playerPosition.z - event.data.zoneStart;
    const wasInZone = event.data.playerInZone || false;
    event.data.playerInZone = relativeZ >= 0 && relativeZ <= event.data.zoneLength;
    
    // Log zone transitions for debugging
    if (!wasInZone && event.data.playerInZone) {
      console.log('⚡ Entered speed boost zone');
    } else if (wasInZone && !event.data.playerInZone) {
      console.log('⚡ Exited speed boost zone');
    }
  }

  updateCoinRain(event, deltaTime, playerPosition) {
    event.data.coinInterval += deltaTime;

    // Spawn coins more frequently
    if (event.data.coinInterval >= 0.8) {
      event.data.coinInterval = 0;
      
      // Spawn a cluster of coins
      event.data.nextCoins = [];
      for (let i = 0; i < 5; i++) {
        event.data.nextCoins.push({
          lane: Math.floor(Math.random() * 3),
          z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - (i * 2),
          height: 1.0 + Math.random() * 1.5,
          value: 1
        });
      }
    }
  }

  /**
   * End event and cleanup
   */
  endEvent(event) {
    // Cleanup event-specific resources
    console.log(`✅ Event ended: ${event.type}`);
  }

  /**
   * Get active event data for spawners
   */
  getEventSpawnData() {
    const spawnData = {
      obstacles: [],
      coins: []
    };

    this.activeEvents.forEach(event => {
      if (event.type === 'meteor_shower' && event.data.nextMeteor) {
        spawnData.obstacles.push(event.data.nextMeteor);
        event.data.nextMeteor = null; // Clear after consuming
      }

      if (event.type === 'lightning_storm' && event.data.nextStrike) {
        spawnData.obstacles.push(event.data.nextStrike);
        event.data.nextStrike = null;
      }

      if (event.type === 'coin_rain' && event.data.nextCoins) {
        spawnData.coins = spawnData.coins.concat(event.data.nextCoins);
        event.data.nextCoins = null;
      }
    });

    return spawnData;
  }

  /**
   * Get current event effects
   */
  getEventEffects() {
    const effects = {
      speedMultiplier: 1.0,
      coinMultiplier: 1.0,
      warning: null
    };

    this.activeEvents.forEach(event => {
      switch(event.type) {
        case 'speed_boost_zone':
          if (event.data.playerInZone) {
            effects.speedMultiplier = 1.3;
            effects.warning = '⚡ SPEED BOOST ZONE';
          }
          break;

        case 'coin_rain':
          effects.coinMultiplier = 1.5;
          effects.warning = '💰 COIN RAIN';
          break;

        case 'meteor_shower':
          effects.warning = '☄️ METEOR SHOWER';
          break;

        case 'lightning_storm':
          effects.warning = '⚡ LIGHTNING STORM';
          break;
      }
    });

    return effects;
  }

  /**
   * Get event state for UI
   */
  getEventState() {
    if (this.activeEvents.length === 0) return null;

    const event = this.activeEvents[0];
    return {
      type: event.type,
      timeRemaining: event.duration - event.timer,
      effects: this.getEventEffects()
    };
  }

  reset() {
    this.activeEvents = [];
    this.eventTimer = 0;
    this.nextEventTime = 30;
  }
}
