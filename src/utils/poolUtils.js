// OPTIMIZATION: Switched to an O(1) amortized pooling function
// It now takes an indexRef to remember where it last looked.
export function getFromPool(pool, indexRef) {
  const poolSize = pool.length;
  if (poolSize === 0) return null;

  const startIndex = indexRef.current;

  // Start search from the last known free index
  // This is O(1) on average, and O(n) only when the pool is 100% full.
  for (let i = 0; i < poolSize; i++) {
    const index = (startIndex + i) % poolSize;
    const obj = pool[index];

    if (!obj.active) {
      obj.active = true;
      obj.visible = true;
      // Set the *next* index to check, for fast lookups next time
      indexRef.current = (index + 1) % poolSize; 
      return obj;
    }
  }

  // Pool is full
  return null;
}