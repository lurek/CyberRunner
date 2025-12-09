/**
 * Character Model Cache Manager
 * Caches loaded GLTF models globally to improve performance
 * Models loaded in preview page are cached and reused in game
 */

class CharacterModelCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  /**
   * Get a cached model or return null
   */
  get(modelPath) {
    return this.cache.get(modelPath);
  }

  /**
   * Store a loaded model in cache
   */
  set(modelPath, gltf) {
    if (gltf && gltf.scene) {
      this.cache.set(modelPath, {
        scene: gltf.scene,
        animations: gltf.animations || [],
        loadTime: Date.now()
      });
      console.log(`💾 Cached model: ${modelPath} (Total cached: ${this.cache.size})`);
    }
  }

  /**
   * Check if model is cached
   */
  has(modelPath) {
    return this.cache.has(modelPath);
  }

  /**
   * Clear all cached models
   */
  clear() {
    this.cache.clear();
    this.loading.clear();
    console.log(`🗑️ Character model cache cleared`);
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      cachedModels: this.cache.size,
      models: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const characterModelCache = new CharacterModelCache();

export default characterModelCache;
