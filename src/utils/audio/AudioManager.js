// AudioManager.js
// Simple audio manager for SFX and background music

// IndexedDB utility for caching audio blobs
class AudioCache {
  constructor(dbName = 'AudioCacheDB') {
    this.dbName = dbName;
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('audios');
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      request.onerror = (event) => {
        reject(event);
      };
    });
  }

  async get(name) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('audios', 'readonly');
      const store = tx.objectStore('audios');
      const req = store.get(name);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async set(name, blob) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('audios', 'readwrite');
      const store = tx.objectStore('audios');
      const req = store.put(blob, name);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async listKeys() {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('audios', 'readonly');
      const store = tx.objectStore('audios');
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
}

const audioCache = new AudioCache();

class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.8;
    this.musicEnabled = true; // ✅ NEW: Explicit enable flag
    this.sfxEnabled = true;   // ✅ NEW: Explicit enable flag
    this.muted = false;
    this._fadeIntervals = {};
  }

  loadSound(name, src, isMusic = false) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = isMusic ? this.musicVolume : this.sfxVolume;
    this.sounds[name] = audio;
    if (isMusic) this.music = audio;
  }

  async loadSoundFromWeb(name, url, isMusic = false) {
    try {
      // Try to get from cache first
      let blob = await audioCache.get(name);
      if (!blob) {
        // Fetch from web with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          blob = await response.blob();

          // Cache the blob
          await audioCache.set(name, blob).catch(e => {
            console.warn(`Failed to cache ${name}:`, e);
          });
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            console.warn(`⏱️ Audio fetch timeout for ${name} - using fallback`);
          } else {
            console.warn(`📡 Failed to fetch audio ${name}:`, fetchErr.message);
          }
          throw fetchErr;
        }
      }

      const src = URL.createObjectURL(blob);
      this.loadSound(name, src, isMusic);
      console.log(`✅ Loaded audio: ${name}`);
    } catch (error) {
      console.warn(`⚠️ Audio load failed for ${name}: ${error.message} - system will continue without this audio`);
      // Don't throw - allow game to continue
    }
  }

  // Fade a specific sound's volume to target (0.0-1.0) over duration (ms)
  fadeVolume(name, targetVolume = 0, duration = 400) {
    const audio = this.sounds[name];
    if (!audio) return Promise.resolve();
    if (this._fadeIntervals[name]) {
      clearInterval(this._fadeIntervals[name]);
      delete this._fadeIntervals[name];
    }
    const start = audio.volume;
    const delta = targetVolume - start;
    if (duration <= 0) {
      audio.volume = targetVolume;
      return Promise.resolve();
    }
    const startTime = performance.now();
    return new Promise((resolve) => {
      this._fadeIntervals[name] = setInterval(() => {
        const now = performance.now();
        const t = Math.min(1, (now - startTime) / duration);
        audio.volume = Math.max(0, Math.min(1, start + delta * t));
        if (t >= 1) {
          clearInterval(this._fadeIntervals[name]);
          delete this._fadeIntervals[name];
          resolve();
        }
      }, 16);
    });
  }

  play(name, options = {}) {
    if (this.muted) return Promise.resolve();

    // ✅ NEW: Check specific enable flags
    if (name === 'music' && !this.musicEnabled) return Promise.resolve();
    if (name !== 'music' && !this.sfxEnabled) return Promise.resolve();

    const sound = this.sounds[name];
    if (!sound) return Promise.resolve();
    try {
      sound.currentTime = 0;
      sound.volume = options.volume !== undefined ? options.volume : (name === 'music' ? this.musicVolume : this.sfxVolume);
      sound.loop = !!options.loop;
      const p = sound.play();
      // Return the play() promise if present so callers can handle autoplay rejection
      if (p && typeof p.then === 'function') {
        return p.catch(err => {
          console.warn('AudioManager.play: play() rejected for', name, err?.message || err);
          // Re-throw so callers can handle retry logic
          throw err;
        });
      }
      return Promise.resolve();
    } catch (e) {
      console.warn('AudioManager.play failed synchronously for', name, e);
      return Promise.reject(e);
    }
  }

  stop(name) {
    const sound = this.sounds[name];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  setMusicVolume(vol) {
    // Accept either 0..1 or 0..100
    const v = vol > 1 ? Math.max(0, Math.min(100, vol)) / 100 : Math.max(0, Math.min(1, vol));
    this.musicVolume = v;
    if (this.music) this.music.volume = v;
  }

  setSfxVolume(vol) {
    const v = vol > 1 ? Math.max(0, Math.min(100, vol)) / 100 : Math.max(0, Math.min(1, vol));
    this.sfxVolume = v;
    Object.entries(this.sounds).forEach(([key, audio]) => {
      if (audio !== this.music) {
        audio.volume = v;
      }
    });
  }

  // ✅ NEW: Toggle methods
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (this.music) {
      if (enabled) {
        if (this.music.paused) this.music.play().catch(e => console.warn('Music resume failed', e));
      } else {
        this.music.pause();
      }
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
  }

  muteAll() {
    this.muted = true;
    Object.values(this.sounds).forEach(audio => audio.pause());
  }

  unmuteAll() {
    this.muted = false;
  }

  // Developer helpers for cached audio (IndexedDB)
  async listCached() {
    try {
      return await audioCache.listKeys();
    } catch (e) {
      console.warn('AudioCache.listKeys failed', e);
      return [];
    }
  }

  async playCached(name) {
    try {
      const blob = await audioCache.get(name);
      if (!blob) return false;
      const src = URL.createObjectURL(blob);
      const audio = new Audio(src);
      audio.volume = name === 'music' ? this.musicVolume : this.sfxVolume;
      audio.play();
      return true;
    } catch (e) {
      console.warn('playCached failed', e);
      return false;
    }
  }
}

const audioManager = new AudioManager();
// expose globally for dev console convenience
try { window.audioManager = audioManager; } catch (e) { }
export default audioManager;
