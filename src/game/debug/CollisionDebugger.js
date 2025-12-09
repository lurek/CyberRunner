// 🔍 DEBUG HELPER - Add to GameEngine.jsx for visual collision box debugging

import * as THREE from 'three';

export class CollisionDebugger {
  constructor(scene) {
    this.scene = scene;
    this.boxHelpers = [];
    this.enabled = false; // Set to true to see collision boxes
  }

  toggleDebug() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.clearHelpers();
    }
    console.log('Collision Debug:', this.enabled ? 'ON' : 'OFF');
  }

  updatePlayerBox(player) {
    if (!this.enabled) return;
    
    // Remove old helper
    if (this.boxHelpers[0]) {
      this.scene.remove(this.boxHelpers[0]);
      this.boxHelpers[0].dispose();
    }
    
    // Create new helper for player
    const helper = new THREE.Box3Helper(player.userData.worldBox, 0x00ff00);
    this.scene.add(helper);
    this.boxHelpers[0] = helper;
  }

  updateObstacleBoxes(obstacles, instancedObstacles) {
    if (!this.enabled) return;
    
    // Clear old obstacle helpers
    for (let i = 1; i < this.boxHelpers.length; i++) {
      this.scene.remove(this.boxHelpers[i]);
      this.boxHelpers[i].dispose();
    }
    this.boxHelpers = [this.boxHelpers[0]]; // Keep player helper
    
    // Complex obstacles
    for (let obst of obstacles) {
      if (!obst.visible || !obst.active) continue;
      const helper = new THREE.Box3Helper(obst.userData.worldBox, 0xff0000);
      this.scene.add(helper);
      this.boxHelpers.push(helper);
    }
    
    // Instanced obstacles
    for (let obstData of instancedObstacles) {
      if (!obstData.active) continue;
      const helper = new THREE.Box3Helper(obstData.worldBox, 0x9b7fc7);
      this.scene.add(helper);
      this.boxHelpers.push(helper);
    }
  }

  clearHelpers() {
    for (let helper of this.boxHelpers) {
      this.scene.remove(helper);
      helper.dispose();
    }
    this.boxHelpers = [];
  }

  dispose() {
    this.clearHelpers();
  }
}

/*
USAGE IN GameEngine.jsx:

1. Import at top:
   import { CollisionDebugger } from './debug/CollisionDebugger.js';

2. Create ref:
   const debuggerRef = useRef(null);

3. Initialize in useEffect:
   debuggerRef.current = new CollisionDebugger(scene);

4. Add to animate loop (inside playing check):
   if (debuggerRef.current?.enabled) {
     debuggerRef.current.updatePlayerBox(playerRef.current);
     debuggerRef.current.updateObstacleBoxes(
       allEntitiesRef.current.obstacles,
       allEntitiesRef.current.instancedObstacles
     );
   }

5. Toggle in browser console:
   window.toggleCollisionDebug = () => {
     debuggerRef.current?.toggleDebug();
   };

6. Call in console to enable:
   toggleCollisionDebug()

WHAT YOU'LL SEE:
- Green box = Player collision box
- Red boxes = Complex obstacles (drones, lasers)
- Magenta boxes = Instanced obstacles (boxes, spikes, barriers)

If collision detection is correct, the colored boxes should:
✅ Match visual obstacle positions exactly
✅ Move with obstacles (drones floating, barriers sliding)
✅ Update in real-time
✅ Trigger collision when overlapping with player (green box)
*/
