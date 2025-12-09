/**
 * Background Music Loader
 * ✅ Fetches soothing background music from CDN
 * ✅ Caches locally in IndexedDB
 * ✅ Fallback to offline silence if fetch fails
 */

class BackgroundMusicLoader {
  constructor() {
    this.musicCache = null;
    this.currentTrack = null;
    this.initialized = false;
    this.CACHE_KEY = 'bgm_main_track_v2';
    this.MUSIC_SOURCES = [
      '/assets/sounds/Circuit.mp3',
      '/assets/sounds/City Run.mp3',
      '/assets/sounds/Shenzhen Nightlife.mp3'
    ];
    this.currentMusicIndex = 0;
  }

  /**
   * Initialize the music loader
   */
  async init(audioCache) {
    this.musicCache = audioCache;
    this.initialized = true;
    console.log('✅ Background Music Loader initialized');
    return true;
  }

  /**
   * Load or fetch background music
   */
  async loadMusic() {
    if (!this.initialized || !this.musicCache) {
      console.warn('⚠️ Music loader not initialized');
      return null;
    }

    try {
      // Try to get from cache first
      const cachedBlob = await this.musicCache.get(this.CACHE_KEY);
      if (cachedBlob) {
        console.log('✅ Background music loaded from cache');
        return URL.createObjectURL(cachedBlob);
      }
    } catch (e) {
      console.warn('⚠️ Cache miss, fetching fresh...');
    }

    // Fetch from CDN if not cached
    const musicUrl = this.MUSIC_SOURCES[this.currentMusicIndex];
    try {
      console.log(`🎵 Fetching background music from: ${musicUrl}`);
      const response = await fetch(musicUrl, {
        method: 'GET',
        credentials: 'omit',
        timeout: 15000
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();

      // Cache for next time
      await this.musicCache.set(this.CACHE_KEY, blob);
      console.log('✅ Background music cached successfully');

      return URL.createObjectURL(blob);
    } catch (error) {
      console.warn(`⚠️ Failed to load music from ${musicUrl}:`, error.message);

      // Try next source
      this.currentMusicIndex = (this.currentMusicIndex + 1) % this.MUSIC_SOURCES.length;
      if (this.currentMusicIndex === 0) {
        console.error('❌ All music sources failed');
        return null;
      }

      // Retry with next source
      return this.loadMusic();
    }
  }

  /**
   * Clear cache (useful for updating music)
   */
  async clearCache() {
    if (!this.musicCache) return false;
    try {
      await this.musicCache.clear?.(this.CACHE_KEY);
      console.log('✅ Music cache cleared');
      return true;
    } catch (e) {
      console.warn('⚠️ Failed to clear cache:', e);
      return false;
    }
  }
}

export default BackgroundMusicLoader;
