/**
 * DangerIndicators.js
 * Visual warning system for Jump Safety
 * Phase 0.7 - Shows red indicators for dangerous landing zones
 */

import * as THREE from 'three';

export class DangerIndicators {
  constructor(scene, constants) {
    this.scene = scene;
    this.constants = constants;
    this.indicators = [];
    this.maxIndicators = 5;
    
    // Create indicator geometry and material
    this.indicatorGeometry = new THREE.RingGeometry(0.8, 1.2, 32);
    this.indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    // Pool of indicator meshes
    this.indicatorPool = [];
    for (let i = 0; i < this.maxIndicators; i++) {
      const indicator = new THREE.Mesh(this.indicatorGeometry, this.indicatorMaterial);
      indicator.rotation.x = -Math.PI / 2; // Lay flat on ground
      indicator.visible = false;
      this.scene.add(indicator);
      this.indicatorPool.push(indicator);
    }
  }
  
  /**
   * Add a danger indicator at the specified position
   */
  addIndicator(position, lifetime = 1.5) {
    // Find available indicator
    let indicator = this.indicatorPool.find(ind => !ind.visible);
    
    if (!indicator) {
      // Recycle oldest indicator
      indicator = this.indicatorPool[0];
    }
    
    // Position indicator slightly above ground to avoid z-fighting
    indicator.position.set(position.x, 0.1, position.z);
    indicator.visible = true;
    indicator.userData.lifetime = lifetime;
    indicator.userData.startTime = performance.now() / 1000;
    indicator.userData.maxLifetime = lifetime;
    
    // Add to active indicators
    if (!this.indicators.includes(indicator)) {
      this.indicators.push(indicator);
    }
  }
  
  /**
   * Update danger indicators (fade out over time)
   */
  update(deltaTime) {
    const now = performance.now() / 1000;
    
    this.indicators = this.indicators.filter(indicator => {
      const elapsed = now - indicator.userData.startTime;
      const remaining = indicator.userData.maxLifetime - elapsed;
      
      if (remaining <= 0) {
        indicator.visible = false;
        return false;
      }
      
      // Fade out and pulse
      const lifetimeRatio = remaining / indicator.userData.maxLifetime;
      indicator.material.opacity = 0.3 + (lifetimeRatio * 0.5);
      
      // Pulse effect
      const pulse = 1.0 + Math.sin(now * 8) * 0.2;
      indicator.scale.set(pulse, pulse, pulse);
      
      return true;
    });
  }
  
  /**
   * Clear all danger indicators
   */
  clear() {
    this.indicators.forEach(indicator => {
      indicator.visible = false;
    });
    this.indicators = [];
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    this.indicatorGeometry.dispose();
    this.indicatorMaterial.dispose();
    this.indicatorPool.forEach(indicator => {
      this.scene.remove(indicator);
    });
    this.indicatorPool = [];
    this.indicators = [];
  }
}
