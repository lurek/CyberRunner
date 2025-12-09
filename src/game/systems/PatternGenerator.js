/**
 * Advanced Obstacle Patterns
 * Creates challenging but fair obstacle configurations
 */

export class ObstaclePatterns {
  constructor(constants) {
    this.constants = constants;
  }

  /**
   * Get a pattern based on difficulty
   */
  getPattern(difficulty, playerPosition) {
    const patterns = [
      'single',
      'double',
      'alternating',
      'tunnel',
      'wave'
    ];

    // Weight patterns by difficulty
    let pattern;
    if (difficulty < 0.3) {
      pattern = patterns[Math.floor(Math.random() * 2)]; // single or double
    } else if (difficulty < 0.6) {
      pattern = patterns[Math.floor(Math.random() * 4)]; // up to tunnel
    } else {
      pattern = patterns[Math.floor(Math.random() * patterns.length)]; // all
    }

    return this.createPattern(pattern, playerPosition, difficulty);
  }

  /**
   * Create specific pattern
   */
  createPattern(patternType, playerPosition, difficulty) {
    switch(patternType) {
      case 'single':
        return this.createSingleObstacle(playerPosition);
      
      case 'double':
        return this.createDoubleObstacle(playerPosition);
      
      case 'alternating':
        return this.createAlternatingPattern(playerPosition, difficulty);
      
      case 'tunnel':
        return this.createTunnelPattern(playerPosition, difficulty);
      
      case 'wave':
        return this.createWavePattern(playerPosition, difficulty);
      
      default:
        return this.createSingleObstacle(playerPosition);
    }
  }

  createSingleObstacle(playerPosition) {
    return [{
      type: this.randomObstacleType(),
      lane: Math.floor(Math.random() * 3),
      z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE,
      data: {}
    }];
  }

  createDoubleObstacle(playerPosition) {
    const lane1 = Math.floor(Math.random() * 3);
    let lane2 = Math.floor(Math.random() * 3);
    while (lane2 === lane1) {
      lane2 = Math.floor(Math.random() * 3);
    }

    return [
      {
        type: this.randomObstacleType(),
        lane: lane1,
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE,
        data: {}
      },
      {
        type: this.randomObstacleType(),
        lane: lane2,
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - 3,
        data: {}
      }
    ];
  }

  createAlternatingPattern(playerPosition, difficulty) {
    const obstacles = [];
    const startLane = Math.floor(Math.random() * 3);
    const count = Math.floor(3 + difficulty * 3); // 3-6 obstacles

    for (let i = 0; i < count; i++) {
      const lane = (startLane + i) % 3;
      obstacles.push({
        type: 'box',
        lane: lane,
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - (i * 8),
        data: {}
      });
    }

    return obstacles;
  }

  createTunnelPattern(playerPosition, difficulty) {
    // Forces player to stay in one lane
    const safeLane = Math.floor(Math.random() * 3);
    const obstacles = [];

    for (let i = 0; i < 3; i++) {
      const offset = i * 10;
      for (let lane = 0; lane < 3; lane++) {
        if (lane !== safeLane) {
          obstacles.push({
            type: 'wall',
            lane: lane,
            z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - offset,
            data: {}
          });
        }
      }
    }

    return obstacles;
  }

  createWavePattern(playerPosition, difficulty) {
    // Moving barriers that create a wave effect
    const obstacles = [];
    const count = Math.floor(4 + difficulty * 2);

    for (let i = 0; i < count; i++) {
      obstacles.push({
        type: 'moving_barrier',
        lane: 1, // Center lane
        z: playerPosition.z - this.constants.GAME.SPAWN_DISTANCE - (i * 15),
        data: {
          phase: (i * Math.PI / 2) // Offset phases
        }
      });
    }

    return obstacles;
  }

  randomObstacleType() {
    // Updated to include new sliding obstacles and remove 'bar'
    const types = [
      'box',
      'wall',
      'spike',
      'barrier',
      'drone',
      'energy_barrier',  // New sliding obstacle
      'drone_turret',    // New sliding obstacle
      'plasma_gate',     // New sliding obstacle
      'tall_wall',       // ✅ NEW: Cannot jump, must slide or change lane
      'bar_high',        // ✅ NEW: High bar - slidable but not jumpable
      'bar_low'          // ✅ NEW: Low bar - can be jumped or slid
    ];
    return types[Math.floor(Math.random() * types.length)];
  }
}

/**
 * Risk/Reward Coin Patterns
 * Creates challenging coin patterns with high rewards
 */
export class RiskRewardPatterns {
  constructor(constants) {
    this.constants = constants;
  }

  /**
   * Create a risky coin pattern
   */
  createRiskyPattern(playerPosition) {
    const patterns = [
      'gauntlet',
      'squeeze',
      'weave',
      'jump_challenge',
      'slide_challenge'
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return this.createPattern(pattern, playerPosition);
  }

  createPattern(patternType, playerPosition) {
    switch(patternType) {
      case 'gauntlet':
        return this.createGauntlet(playerPosition);
      
      case 'squeeze':
        return this.createSqueezePattern(playerPosition);
      
      case 'weave':
        return this.createWeavePattern(playerPosition);
      
      case 'jump_challenge':
        return this.createJumpChallenge(playerPosition);
      
      case 'slide_challenge':
        return this.createSlideChallenge(playerPosition);
      
      default:
        return { coins: [], obstacles: [] };
    }
  }

  createGauntlet(playerPosition) {
    // Coins between two obstacles
    const lane = Math.floor(Math.random() * 3);
    const z = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;

    return {
      coins: [
        { lane, z: z - 5, value: 3 },
        { lane, z: z - 8, value: 3 },
        { lane, z: z - 11, value: 3 }
      ],
      obstacles: [
        { type: 'spike', lane, z: z - 2 },
        { type: 'spike', lane, z: z - 14 }
      ]
    };
  }

  createSqueezePattern(playerPosition) {
    // Coins in center with obstacles on sides
    const z = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;

    return {
      coins: [
        { lane: 1, z: z - 5, value: 5 },
        { lane: 1, z: z - 8, value: 5 }
      ],
      obstacles: [
        { type: 'wall', lane: 0, z: z - 6 },
        { type: 'wall', lane: 2, z: z - 7 }
      ]
    };
  }

  createWeavePattern(playerPosition) {
    // Must weave between lanes to collect
    const z = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;

    return {
      coins: [
        { lane: 0, z: z - 3, value: 2 },
        { lane: 1, z: z - 6, value: 2 },
        { lane: 2, z: z - 9, value: 2 },
        { lane: 1, z: z - 12, value: 2 },
        { lane: 0, z: z - 15, value: 2 }
      ],
      obstacles: [
        { type: 'box', lane: 1, z: z - 4 },
        { type: 'box', lane: 0, z: z - 7 },
        { type: 'box', lane: 2, z: z - 10 },
        { type: 'box', lane: 1, z: z - 13 }
      ]
    };
  }

  createJumpChallenge(playerPosition) {
    // High coins requiring jump
    const lane = Math.floor(Math.random() * 3);
    const z = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;

    return {
      coins: [
        { lane, z: z - 5, value: 3, height: 2.5 },
        { lane, z: z - 8, value: 3, height: 2.5 },
        { lane, z: z - 11, value: 3, height: 2.5 }
      ],
      obstacles: [
        { type: 'spike', lane, z: z - 3 }
      ]
    };
  }

  createSlideChallenge(playerPosition) {
    // Low coins requiring slide
    const lane = Math.floor(Math.random() * 3);
    const z = playerPosition.z - this.constants.GAME.SPAWN_DISTANCE;

    return {
      coins: [
        { lane, z: z - 5, value: 3, height: 0.3 },
        { lane, z: z - 7, value: 3, height: 0.3 },
        { lane, z: z - 9, value: 3, height: 0.3 }
      ],
      obstacles: [
        { type: 'barrier', lane, z: z - 6 },
        { type: 'barrier', lane, z: z - 10 }
      ]
    };
  }
}
