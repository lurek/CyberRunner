import * as THREE from "three";
import { updateBillboardWithEffects } from "../../effects/EnvironmentalEffects.js";

export class WorldRecycler {
  constructor(constants) {
    this.constants = constants;
  }

  recycleGround(groundPlanes, groundGrids, playerZ) {
    if (groundPlanes) {
      groundPlanes.forEach((ground) => {
        if (ground.position.z > playerZ + this.constants.GAME.GROUND_RECYCLE_DISTANCE) {
          const farthestAheadZ = Math.min(...groundPlanes.map(g => g.position.z));
          ground.position.z = farthestAheadZ - this.constants.GAME.GROUND_SEGMENT_LENGTH;
        }
      });
    }

    // ✅ FIXED: Added safety check to prevent the "undefined" crash
    if (groundGrids && Array.isArray(groundGrids)) {
      groundGrids.forEach((grid) => {
        if (grid.position.z > playerZ + this.constants.GAME.GROUND_RECYCLE_DISTANCE) {
          const farthestAheadZ = Math.min(...groundGrids.map(g => g.position.z));
          grid.position.z = farthestAheadZ - this.constants.GAME.GROUND_SEGMENT_LENGTH;
        }
      });
    }
  }

  recycleBuildings(buildings, playerZ, theme, worldBuilder, isHighQuality) {
    let matrixNeedsUpdate = false; 
    buildings.forEach((building) => {
      if (building.position.z > playerZ + this.constants.GAME.GROUND_RECYCLE_DISTANCE) {
        
        const farthestAheadZ = Math.min(...buildings.map(b => b.position.z));
        // Move building far ahead
        building.position.z = farthestAheadZ - 25 - (Math.random() * 10);

        if (building.light) {
          worldBuilder.recycleLight(building.light);
          building.light = null;
        }

        // Regenerate geometry for variety
        worldBuilder.setupBuildingInstance(building, theme);
        matrixNeedsUpdate = true;

        // Dynamic Lights logic
        if (isHighQuality && Math.random() < 0.3) {
          const h = 20 + Math.random() * 40; 
          const w = 4; 
          const light = worldBuilder.getLightFromPool();
          if (light) {
            const neonColors = [0x00ffff, 0xff00ff, 0xffaa00];
            light.color.setHex(neonColors[Math.floor(Math.random() * neonColors.length)]);
            const lightSide = building.position.x < 0 ? 0 : 1;
            light.position.set(
              building.position.x + (lightSide === 0 ? (w / 2 + 1.0) : -(w / 2 + 1.0)),
              h * 0.5,
              building.position.z + 2.0
            );
            light.visible = true;
            light.active = true;
            building.light = light;
          }
        }
      }
    });

    if (matrixNeedsUpdate) {
      worldBuilder.updateAllInstanceMatrices();
    }
  }

  recycleBillboards(billboards, playerZ, time, isHighQuality) {
    billboards.forEach((billboard) => {
      if (billboard.position.z > playerZ + this.constants.GAME.GROUND_RECYCLE_DISTANCE) {
        const farthestAheadZ = Math.min(...billboards.map(b => b.position.z));
        billboard.position.z = farthestAheadZ - 50 - (Math.random() * 20);
      }

      const distance = Math.abs(billboard.position.z - playerZ);
      if (distance > this.constants.GAME.BILLBOARD_UPDATE_DISTANCE) {
        return;
      }
      
      if (billboard.userData.texture) {
        updateBillboardWithEffects(billboard.userData.texture, time, billboard.userData.texture.image.userData.text, isHighQuality);
      }
    });
  }

  /**
   * ✅ NEW: Animate obstacle elements for sliding obstacles
   * Adds visual interest with subtle rotations and movements
   */
  updateObstacles(obstacles, deltaTime) {
    if (!obstacles) return;
    
    obstacles.forEach((obstacle) => {
      if (!obstacle.userData) return;
      
      // Initialize animation time if not present
      if (typeof obstacle.userData.animTime !== 'number') {
        obstacle.userData.animTime = Math.random() * Math.PI * 2;
      }
      
      obstacle.userData.animTime += deltaTime * 2; // Animation speed
      
      // ✅ SLIDING OBSTACLES: Add subtle pulsing/glow animation
      if (obstacle.userData.type === 'energy_barrier' || 
          obstacle.userData.type === 'drone_turret' || 
          obstacle.userData.type === 'plasma_gate') {
        
        // Pulse the opacity/emissive of child meshes
        const pulseAmount = Math.sin(obstacle.userData.animTime * 1.5) * 0.2 + 0.8; // 0.6-1.0
        
        obstacle.children.forEach((child) => {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            const baseIntensity = child.userData?.baseEmissiveIntensity || 0.6;
            child.material.emissiveIntensity = baseIntensity * pulseAmount;
          }
        });
        
        // Subtle bobbing motion for visual interest
        if (obstacle.userData.baseY === undefined) {
          obstacle.userData.baseY = obstacle.position.y;
        }
        const bobAmount = Math.sin(obstacle.userData.animTime * 0.8) * 0.1;
        obstacle.position.y = obstacle.userData.baseY + bobAmount;
      }
      
      // ✅ DRONE TURRETS: Add slow rotation to barrel
      if (obstacle.userData.type === 'drone_turret') {
        const barrelHolder = obstacle.children.find(child => child.name === 'barrelHolder');
        if (barrelHolder) {
          barrelHolder.rotation.z += deltaTime * 1.5; // Spinning barrel
        }
      }
      
      // ✅ PLASMA GATES: Add pulsing scale effect
      if (obstacle.userData.type === 'plasma_gate') {
        const plasmaCore = obstacle.children.find(child => child.name === 'plasmaCore');
        if (plasmaCore) {
          const scaleAmount = Math.sin(obstacle.userData.animTime * 2) * 0.1 + 1.0; // 0.9-1.1
          plasmaCore.scale.set(scaleAmount, scaleAmount, scaleAmount);
        }
      }
    });
  }
}
