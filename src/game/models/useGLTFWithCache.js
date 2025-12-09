import { useGLTF as useGLTFOriginal } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { characterModelCache } from './CharacterModelCache.js';

/**
 * Enhanced useGLTF hook with caching
 * First checks cache, then loads from server, then caches the result
 */
export function useGLTFWithCache(path) {
  const cacheRef = useRef(characterModelCache);
  const originalGltf = useGLTFOriginal(path);

  // Cache the loaded model
  useEffect(() => {
    if (originalGltf && originalGltf.scene && !cacheRef.current.has(path)) {
      cacheRef.current.set(path, originalGltf);
    }
  }, [originalGltf, path]);

  return originalGltf;
}

export default useGLTFWithCache;
