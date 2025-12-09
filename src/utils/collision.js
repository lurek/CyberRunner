import * as THREE from "three";

/**
 * Checks if two Box3 objects intersect using Three.js native logic.
 * This is more robust than manual coordinate comparison.
 */
export function checkCollisionAABB(boxA, boxB) {
  if (!boxA || !boxB) return false;
  // Use native Three.js intersection for 100% accuracy
  return boxA.intersectsBox(boxB);
}

/**
 * Checks collision with a vertical clearance (for jumping over things).
 * Returns true if they collide, false if enough vertical gap exists.
 */
export function checkCollisionWithClearance(boxA, boxB, clearanceThreshold = 0) {
  if (!boxA || !boxB) return false;
  
  // 1. Check basic intersection first
  if (!boxA.intersectsBox(boxB)) return false;

  // 2. If intersecting, checking if it's just a "grazing" hit on top
  // Overlap amount in Y axis
  const yOverlap = Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y);
  
  // If the overlap is tiny (just touching feet to top of box), ignore it
  return yOverlap > clearanceThreshold;
}