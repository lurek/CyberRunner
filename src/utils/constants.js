// Enhanced game constants - OPTIMIZED & BALANCED
export const CONSTANTS = {
  LANE_POSITIONS: [-3, 0, 3],
  PLAYER: {
    BASE_HEIGHT: 0.0, // ✅ FIX: Set to 0.0 - Y offset now calculated from model bounding box in GLBPlayerSystem
    SLIDE_HEIGHT: 0.4,
    SLIDE_DURATION: 30,
    WIDTH: 0.8,
    HEIGHT: 1.2,
    DEPTH: 0.6,
    // Deprecated legacy values, see PHYSICS below
    JUMP_VELOCITY: 15.0,
    GRAVITY: 60.0,
    JUMP_CLEARANCE_THRESHOLD: 0.3,
    MAGNET_RADIUS: 8,
  },
  PHYSICS: {
    // ✅ FIXED JUMP: Lower force + High gravity = Snappy, low arc.
    // Cannot jump over tall obstacles now.
    JUMP_FORCE: 15.0,      // Was 20.0/22.0
    GRAVITY: 60.0,         // Was 45.0
    SLIDE_DURATION: 0.8,

    // ✅ FIXED SNAPPING: Lower speed = Smoother Lerp
    LANE_CHANGE_SPEED: 6.0, // Was 10.0
  },
  LANE_WIDTH: 3,
  GAME: {
    // ✨ Electronic music - energetic tracks for runner gameplay
    // Using local files from public/assets/sounds
    MUSIC_URL: '/assets/sounds/Circuit.mp3',
    // 🎵 Alternative tracks for variety
    MUSIC_TRACKS: [
      '/assets/sounds/Circuit.mp3',
      '/assets/sounds/City Run.mp3',
      '/assets/sounds/Shenzhen Nightlife.mp3',
    ],
    SPAWN_DISTANCE: 120,
    BASE_SPEED: 0.25,
    MAX_SPEED: 0.6,
    DIFFICULTY_RAMP_DISTANCE: 5000,
    MAX_POOL_SIZE: 50,
    STATE_UPDATE_INTERVAL: 0.1,
    SWIPE_MIN_DISTANCE: 30,
    SWIPE_MAX_TIME: 500,
    GROUND_SEGMENTS: 10,
    GROUND_SEGMENT_LENGTH: 30,
    GROUND_RECYCLE_DISTANCE: 50,
    GROUND_VISIBLE_DISTANCE: 120,
    DIFFICULTY_SPEED_FACTOR: 0.2,
    DIFFICULTY_SPAWN_FACTOR: 0.3,
    NEAR_MISS_DISTANCE: 2.5,
    NEAR_MISS_POINTS: 5,
    COLLISION_CHECK_DISTANCE: 30,
    BILLBOARD_UPDATE_DISTANCE: 80,
    BUILDING_COUNT_PER_SIDE: 15,
    ENTITY_UPDATE_DISTANCE: 150,
  },
  COLLISION: {
    HORIZONTAL_THRESHOLD: 0.8,
    VERTICAL_THRESHOLD: 1.5
  },
  CAMERA: {
    SMOOTHING: 0.1,
    LANE_SMOOTHING: 0.05,
    BASE_HEIGHT: 5,
    OFFSET_Z: 8,
    VERTICAL_FOLLOW: 0.12,  // ✨ INCREASED: More responsive height tracking for jetpack
    HORIZONTAL_FOLLOW: 0.15,
    LOOK_HEIGHT: 2,
    LOOK_AHEAD_DISTANCE: 5,
    SHAKE_MULTIPLIER: 0.8,
    FLIGHT_HEIGHT_SMOOTHING: 0.2
  },
  ANIMATION: {
    BASE_SPEED: 0.12,
    SPEED_SCALING: 0.3
  },
  COMBO: {
    TIMEOUT: 2.0,
    BASE_MULTIPLIER: 1.0,
    MULTIPLIER_PER_COIN: 0.05,
    MAX_MULTIPLIER: 3.0,
    NEAR_MISS_THRESHOLD: 2.0,
    NEAR_MISS_POINTS: 10,
    HOT_STREAK_THRESHOLD: 10,
    PERFECT_RUN_BONUS: 500
  },
  PARTICLE: {
    LIFETIME: 1.0,
    COUNT: 5,
    SPEED: 0.3,
    GRAVITY: 0.01
  },
  RAIN: {
    COUNT: 300,
    FALL_SPEED: 20,
    BOX_WIDTH: 30,
    BOX_HEIGHT: 40,
    BOX_DEPTH: 30,
    UPDATE_INTERVAL: 0.05
  },
  POWERUP: {
    SHIELD_DURATION: 8000,
    MULTIPLIER_DURATION: 10000,
    MAGNET_DURATION: 8000,
    TIME_SLOW_DURATION: 3000,
    TIME_SLOW_FACTOR: 0.5,
    SYNERGY_BONUS: {
      SHIELD_MAGNET: 2.0,
      SHIELD_MULTIPLIER_POINTS: 15,
      MAGNET_MULTIPLIER: 1.5
    }
  },
  DIFFICULTY: {
    WAVE_DURATION: 30,
    PHASE_DURATIONS: {
      NORMAL: 15,
      INTENSE: 10,
      SAFE: 5
    },
    SPAWN_RATE_MULTIPLIERS: {
      NORMAL: 1.0,
      INTENSE: 1.8,
      SAFE: 0.3
    },
    BOSS_SECTION_INTERVAL: 2000,
    BOSS_SECTION_LENGTH: 50
  },
  RISK_REWARD: {
    RISKY_PATTERN_CHANCE: 0.15,
    HIGH_VALUE_COIN_MULTIPLIER: 3,
    PATTERN_COOLDOWN: 20
  },
  PERFORMANCE: {
    MAX_ACTIVE_PARTICLES: 5,
    LIGHT_UPDATE_INTERVAL: 0.1,
    POOL_SIZES: {
      OBSTACLES: 20,
      COINS: 30,
      POWERUPS: 8,
      INSTANCED_BOXES: 30,
      INSTANCED_SPIKES: 30,
      INSTANCED_BARRIERS: 20,
      PARTICLES: 10,
      NEON_LIGHTS: 10,
      POWERUP_LIGHTS: 10,
    }
  },
  MISSIONS: {
    DAILY_COUNT: 3,
    RESET_HOUR: 0,
  },
  LOGIN_REWARDS: {
    CYCLE_DAYS: 7,
    STREAK_BREAK_DAYS: 2,
  },
  CURRENCY: {
    COINS_PER_METER: 0.1,
    WORD_HUNT_REWARD_COINS: 5000,
    WORD_HUNT_REWARD_GEMS: 100,
  },

  // ✨ PHASE 1.7 - UNIQUE ABILITIES SYSTEM
  ABILITIES: {
    LIGHTNING_DASH: {
      BASE_COOLDOWN: 20000,     // 20 seconds
      DISTANCE: 50,             // Teleport 50 meters
      INVINCIBILITY_DURATION: 1000, // 1 second immune
      VISUAL_DURATION: 300,     // 0.3 seconds effect
    }
  }
};

// Shop/Character configs
export const SHOP_CONFIG = {
  shield: { baseCost: 100, costIncrease: 50 },
  multiplier: { baseCost: 150, costIncrease: 75 },
  magnet: { baseCost: 120, costIncrease: 60 },
  health: { baseCost: 200, costIncrease: 100 },
  time: { baseCost: 250, costIncrease: 125 }
};

// ✨ NEW CHARACTER MODELS WITH ANIMATIONS
// Available Animations: Idle, Running, Jump, Flying, Falling Idle, Surf
export const CHARACTERS = {
  default: {
    id: 'default',
    name: 'Main Runner',
    description: 'The original cyber runner - Balanced stats with smooth animations',
    cost: 0,
    currency: 'coins',
    modelPath: '/Main_Character.glb',
    color: '#00ccff',
    scale: 1.0,
    gameplayScale: 1.0,   // For gameplay - consistent with obstacles
    previewHeight: 2.0,
    previewScale: 0.75,   // For preview - reduced to fit on screen
    previewYOffset: 0,    // Y position adjustment for preview
    stats: { speed: 1.0, jumpHeight: 1.0, magnetRadius: 1.0 },
    animations: {
      idle: 'Idle',
      running: 'Running',
      jump: 'Jump',
      flying: 'Flying',
      falling: 'Falling Idle',
      surf: 'Surf'
    }
  },
  eve: {
    id: 'eve',
    name: 'Eve',
    description: 'Agile and swift - Enhanced speed with graceful movements',
    cost: 3500,
    currency: 'coins',
    modelPath: '/Eve By J.Gonzales.glb',
    color: '#ff66cc',
    scale: 1.0,
    gameplayScale: 1.0,   // For gameplay - consistent with obstacles
    previewHeight: 2.0,
    previewScale: 0.75,   // For preview - reduced to fit on screen
    previewYOffset: 0,    // Y position adjustment for preview
    stats: { speed: 1.05, jumpHeight: 1.0, magnetRadius: 1.0 },
    animations: {
      idle: 'Idle',
      running: 'Running',
      jump: 'Jump',
      flying: 'Flying',
      falling: 'Falling Idle',
      surf: 'Surf'
    }
  },
  kachujin: {
    id: 'kachujin',
    name: 'Kachujin',
    description: 'Professional fighter - Increased jump height with powerful animations',
    cost: 5000,
    currency: 'coins',
    modelPath: '/Kachujin G Rosales.glb',
    color: '#ffaa00',
    scale: 1.0,
    gameplayScale: 0.75,  // For gameplay - native model is larger, reduce to match others
    previewHeight: 2.1,
    previewScale: 0.55,   // For preview - reduced more to prevent platform glitching
    previewYOffset: 0.8,  // Raise up more to prevent platform glitching
    stats: { speed: 1.0, jumpHeight: 1.08, magnetRadius: 1.0 },
    animations: {
      idle: 'Idle',
      running: 'Running',
      jump: 'Jump',
      flying: 'Flying',
      falling: 'Falling Idle',
      surf: 'Surf'
    }
  },
  swat: {
    id: 'swat',
    name: 'SWAT Officer',
    description: 'Tactical expert - Enhanced coin magnet with military precision',
    cost: 6500,
    currency: 'coins',
    modelPath: '/SWAT.glb',
    color: '#0088ff',
    scale: 1.0,
    gameplayScale: 1.0,   // For gameplay - consistent with obstacles
    previewHeight: 2.0,
    previewScale: 0.30,   // For preview - smaller to show full character
    previewXOffset: -0.3, // Move left
    previewYOffset: 1.5,  // Lift feet above platform
    previewZOffset: 1.0,  // Center on platform
    stats: { speed: 1.0, jumpHeight: 1.0, magnetRadius: 1.1 },
    animations: {
      idle: 'Idle',
      running: 'Running',
      jump: 'Jump',
      flying: 'Flying',
      falling: 'Falling Idle',
      surf: 'Surf'
    }
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    description: 'Elite soldier - Balanced powerhouse with dynamic combat moves',
    cost: 8000,
    currency: 'coins',
    modelPath: '/Vanguard By T. Choonyung.glb',
    color: '#ff3366',
    scale: 1.0,
    gameplayScale: 1.2,   // For gameplay - native model is smaller, scale up to match others
    previewHeight: 2.1,
    previewScale: 0.85,   // For preview - slightly smaller to fit platform
    previewYOffset: 0.2,  // Slight raise to prevent platform glitching
    previewZOffset: 0,
    stats: { speed: 1.03, jumpHeight: 1.03, magnetRadius: 1.02 },
    animations: {
      idle: 'Idle',
      running: 'Running',
      jump: 'Jump',
      flying: 'Flying',
      falling: 'Falling Idle',
      surf: 'Surf'
    }
  }
};

export const UPGRADES = {
  speed_duration: { name: 'Speed Boost Duration', description: 'Increase how long speed boosts last', maxLevel: 10, baseCost: 500, costMultiplier: 1.5, baseValue: 3, valueIncrement: 1, unit: 's' },
  grapple_range: { name: 'Grapple Range', description: 'Increase grappling hook range', maxLevel: 10, baseCost: 600, costMultiplier: 1.5, baseValue: 10, valueIncrement: 1.5, unit: 'm' },
  coin_value: { name: 'Coin Value', description: 'Increase coin collection value', maxLevel: 10, baseCost: 800, costMultiplier: 1.6, baseValue: 1, valueIncrement: 0.1, unit: '%', isPercentage: true },
  shield_duration: { name: 'Shield Duration', description: 'Shields last longer', maxLevel: 10, baseCost: 700, costMultiplier: 1.5, baseValue: 8, valueIncrement: 1, unit: 's' },
  starting_coins: { name: 'Starting Coins', description: 'Start each run with bonus coins', maxLevel: 10, baseCost: 1000, costMultiplier: 1.7, baseValue: 0, valueIncrement: 10, unit: ' coins' },
  ability_cooldown: { name: 'Ability Cooldown Reduction', description: 'Reduce all ability cooldowns', maxLevel: 10, baseCost: 800, costMultiplier: 1.6, baseValue: 0, valueIncrement: 5, unit: '%', isPercentage: true }
};
