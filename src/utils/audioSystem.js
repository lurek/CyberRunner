/**
 * Enhanced Audio System with HTML5 Audio
 * Replaces oscillator-based sounds with proper audio files
 * Falls back to oscillators if audio files are unavailable
 */

// Audio context for oscillator fallback
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    } catch(e) {
      console.warn("AudioContext not supported");
    }
  }
  return audioCtx;
}

// Sound registry with paths and fallback configs
const SOUNDS = {
  jump: {
    path: '/assets/sounds/jump.mp3',
    fallback: { type: 'sine', freq: 520, duration: 0.1, volume: 0.25 }
  },
  coin: {
    path: '/assets/sounds/coin.mp3',
    fallback: { type: 'sine', freq: 900, duration: 0.1, volume: 0.3 }
  },
  crash: {
    path: '/assets/sounds/crash.mp3',
    fallback: { type: 'sawtooth', freq: 120, duration: 0.3, volume: 0.25 }
  },
  slide: {
    path: '/assets/sounds/slide.mp3',
    fallback: { type: 'sine', freq: 320, duration: 0.1, volume: 0.2 }
  },
  powerup: {
    path: '/assets/sounds/powerup.mp3',
    fallback: { type: 'square', freq: 1100, duration: 0.18, volume: 0.25 }
  },
  shield_hit: {
    path: '/assets/sounds/shield_hit.mp3',
    fallback: { type: 'sine', freq: 800, duration: 0.15, volume: 0.2 }
  },
  heal: {
    path: '/assets/sounds/heal.mp3',
    fallback: { type: 'sine', freq: [600, 1200], duration: 0.2, volume: 0.2, ramp: true }
  },
  laser_zap: {
    path: '/assets/sounds/laser.mp3',
    fallback: { type: 'sawtooth', freq: [1500, 300], duration: 0.1, volume: 0.15, ramp: true }
  },
  barrier_whoosh: {
    path: '/assets/sounds/whoosh.mp3',
    fallback: { type: 'square', freq: [200, 100], duration: 0.15, volume: 0.1, ramp: true }
  }
};

// Audio pool for efficient playback
class AudioPool {
  constructor(src, poolSize = 5) {
    this.pool = [];
    this.currentIndex = 0;
    this.poolSize = poolSize;
    this.src = src;
    this.loaded = false;
    
    // Preload audio
    this.preload();
  }
  
  preload() {
    try {
      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio(this.src);
        audio.volume = 0.5;
        audio.preload = 'auto';
        
        audio.addEventListener('canplaythrough', () => {
          this.loaded = true;
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load audio: ${this.src}`, e);
        });
        
        this.pool.push(audio);
      }
    } catch (e) {
      console.warn(`Error creating audio pool for ${this.src}:`, e);
    }
  }
  
  play(volume = 0.5) {
    if (!this.loaded || this.pool.length === 0) return false;
    
    try {
      const audio = this.pool[this.currentIndex];
      
      // ✅ FIX #27: Check if audio is already playing to prevent overlap
      if (!audio.paused && audio.currentTime > 0.05) {
        // This audio is still playing, try next one in pool
        this.currentIndex = (this.currentIndex + 1) % this.poolSize;
        if (this.currentIndex === 0) {
          // Wrapped around, all audios are playing - force current
          audio.pause();
        } else {
          return this.play(volume);  // Try next audio in pool
        }
      }
      
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Ignore autoplay policy errors
        });
      }
      
      this.currentIndex = (this.currentIndex + 1) % this.poolSize;
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Manager class
class AudioManager {
  constructor() {
    this.pools = {};
    this.enabled = true;
    this.volume = 1.0;
    this.useAudioFiles = true; // Try audio files first
    
    this.init();
  }
  
  init() {
    // Create audio pools for each sound
    Object.entries(SOUNDS).forEach(([key, config]) => {
      try {
        this.pools[key] = new AudioPool(config.path, 3);
      } catch (e) {
        console.warn(`Failed to create pool for ${key}, will use fallback`);
      }
    });
  }
  
  playSfx(type, enabled = true, volume = 1.0) {
    if (!enabled || !this.enabled) return;
    
    const effectiveVolume = volume * this.volume;
    
    // Try HTML5 audio first
    if (this.useAudioFiles && this.pools[type]) {
      const played = this.pools[type].play(effectiveVolume);
      if (played) return;
    }
    
    // Fallback to oscillator
    this.playOscillator(type, effectiveVolume);
  }
  
  playOscillator(type, volume) {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const sound = SOUNDS[type];
    if (!sound || !sound.fallback) return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const fb = sound.fallback;
      osc.type = fb.type;
      
      if (Array.isArray(fb.freq) && fb.ramp) {
        // Frequency ramp
        osc.frequency.setValueAtTime(fb.freq[0], ctx.currentTime);
        if (fb.type === 'sine' || fb.type === 'square') {
          osc.frequency.linearRampToValueAtTime(fb.freq[1], ctx.currentTime + fb.duration);
        } else {
          osc.frequency.exponentialRampToValueAtTime(fb.freq[1], ctx.currentTime + fb.duration);
        }
      } else {
        osc.frequency.value = Array.isArray(fb.freq) ? fb.freq[0] : fb.freq;
      }
      
      gain.gain.setValueAtTime(fb.volume * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fb.duration);
      
      osc.start();
      osc.stop(ctx.currentTime + fb.duration);
    } catch (e) {
      // Silent fail
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  
  setUseAudioFiles(use) {
    this.useAudioFiles = use;
  }
}

// Singleton instance
let audioManager = null;

export function getAudioManager() {
  if (!audioManager) {
    audioManager = new AudioManager();
  }
  return audioManager;
}

// Backward compatible API
export function playSfx(type, enabled = true, volume = 1.0) {
  getAudioManager().playSfx(type, enabled, volume);
}

// New API for more control
export function setAudioEnabled(enabled) {
  getAudioManager().setEnabled(enabled);
}

export function setAudioVolume(volume) {
  getAudioManager().setVolume(volume);
}

export function setUseAudioFiles(use) {
  getAudioManager().setUseAudioFiles(use);
}
