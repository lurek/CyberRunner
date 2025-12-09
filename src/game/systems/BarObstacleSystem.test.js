// ============================================================================
// BAR OBSTACLE TESTING SUITE
// File: src/game/systems/BarObstacleSystem.test.js
// ============================================================================

/**
 * Comprehensive testing suite for bar obstacle system
 * Run with: npm test -- BarObstacleSystem.test.js
 */

import { BarObstacleSystem } from './BarObstacleSystem.js';
import * as THREE from 'three';

describe('BarObstacleSystem', () => {
  let barSystem;
  let mockPlayerPos;
  let mockPlayerBox;
  let mockBarData;

  beforeEach(() => {
    barSystem = new BarObstacleSystem();
    mockPlayerPos = new THREE.Vector3(0, 1.0, 0);
    mockPlayerBox = new THREE.Box3(
      new THREE.Vector3(-0.35, 0.5, -0.35),
      new THREE.Vector3(0.35, 1.8, 0.35)
    );
    mockBarData = {
      id: 'test-bar-1',
      position: new THREE.Vector3(0, 0.8, 0),
      type: 'bar'
    };
  });

  describe('Collision Detection - Safe Zones', () => {
    test('Should allow safe slide - player below threshold', () => {
      mockPlayerPos.y = 1.2;
      const result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      expect(result.canSlide).toBe(true);
      expect(result.damageAmount).toBe(0);
      expect(result.zone).toBe('safe_slide');
    });

    test('Should allow player above bar', () => {
      mockPlayerPos.y = 2.2;
      const result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      expect(result.canSlide).toBe(true);
      expect(result.damageAmount).toBe(0);
      expect(result.zone).toBe('above');
    });

    test('Should prevent debounce collision', () => {
      const barId = 'test-debounce';
      mockBarData.id = barId;
      
      // First collision
      let result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      expect(result.damageAmount).toBeGreaterThan(0);
      
      // Immediate second collision (should be debounced)
      result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      expect(result.zone).toBe('debounce');
      expect(result.damageAmount).toBe(0);
    });
  });

  describe('Collision Detection - Damage Zones', () => {
    test('Should deal top damage for head collision', () => {
      mockPlayerPos.y = 1.55;
      const result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      expect(result.canSlide).toBe(false);
      expect(result.damageAmount).toBe(25);
      expect(result.zone).toBe('top_hit');
      expect(result.impactType).toBe('head_collision');
    });

    test('Should deal edge damage for glancing blow', () => {
      mockPlayerPos.y = 1.45;
      const result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      expect(result.canSlide).toBe(false);
      expect(result.damageAmount).toBeGreaterThan(0);
      expect(result.damageAmount).toBeLessThanOrEqual(15);
      expect(result.zone).toBe('edge_contact');
      expect(result.impactType).toBe('glancing_blow');
    });

    test('Should calculate damage severity based on proximity', () => {
      // Right at the bottom edge (least damage)
      mockPlayerPos.y = 1.40;
      const result1 = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      // Higher up in danger zone (more damage)
      mockPlayerPos.y = 1.48;
      const result2 = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      expect(result1.damageAmount).toBeLessThan(result2.damageAmount);
    });
  });

  describe('Collision Debouncing', () => {
    test('Should clear debounce after timeout', (done) => {
      const barId = 'test-debounce-clear';
      mockBarData.id = barId;
      
      // First collision (should record)
      barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      // Clear immediately
      barSystem.clearDebounce(barId);
      
      // Second collision should not be debounced
      mockPlayerPos.y = 1.55; // Top hit
      const result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      
      expect(result.damageAmount).toBe(25);
      expect(result.zone).not.toBe('debounce');
      done();
    });
  });

  describe('Geometry Creation', () => {
    test('Should create valid bar geometry', () => {
      const bar = BarObstacleSystem.createBarGeometry();
      
      expect(bar).toBeDefined();
      expect(bar.type).toBe('THREE.Group');
      expect(bar.userData.type).toBe('bar');
      expect(bar.userData.canSlideUnder).toBe(true);
      expect(bar.userData.isBar).toBe(true);
    });

    test('Bar should have correct bounding box', () => {
      const bar = BarObstacleSystem.createBarGeometry();
      const bbox = bar.userData.localBox;
      
      expect(bbox.max.x).toBe(1.2);
      expect(bbox.min.x).toBe(-1.2);
      expect(bbox.max.y).toBe(1.625);
      expect(bbox.min.y).toBe(1.575);
    });

    test('Should have 3 meshes (2 posts + 1 bar)', () => {
      const bar = BarObstacleSystem.createBarGeometry();
      expect(bar.children.length).toBe(3);
    });
  });

  describe('Visual Updates', () => {
    test('Should update bar visuals with animation', () => {
      const bar = BarObstacleSystem.createBarGeometry();
      barSystem.createBarVisuals(bar);
      
      expect(bar.userData.glowMesh).toBeDefined();
      expect(bar.userData.animTime).toBe(0);
      
      const initialOpacity = bar.userData.glowMesh.material.opacity;
      
      barSystem.updateBarVisuals(bar, 0.016); // ~60fps
      
      // Animation time should have advanced
      expect(bar.userData.animTime).toBeGreaterThan(0);
    });

    test('Glow should pulse over time', () => {
      const bar = BarObstacleSystem.createBarGeometry();
      barSystem.createBarVisuals(bar);
      
      const opacities = [];
      for (let i = 0; i < 60; i++) {
        barSystem.updateBarVisuals(bar, 0.016);
        opacities.push(bar.userData.glowMesh.material.opacity);
      }
      
      // Should have variation (min and max different)
      const minOpacity = Math.min(...opacities);
      const maxOpacity = Math.max(...opacities);
      
      expect(minOpacity).toBeLessThan(0.2);
      expect(maxOpacity).toBeGreaterThan(0.1);
    });
  });

  describe('Active Collision Detection', () => {
    test('Should filter bars near player', () => {
      const bars = [
        { userData: { isBar: true }, position: { z: 0 } },
        { userData: { isBar: true }, position: { z: 50 } },
        { userData: { isBar: false }, position: { z: 100 } }, // Not a bar
        { userData: { isBar: true }, position: { z: 200 } }, // Too far
      ];
      
      const active = barSystem.getActiveBarCollisions(0, bars, 120);
      
      expect(active.length).toBe(2);
      expect(active.every(b => b.userData.isBar)).toBe(true);
    });

    test('Should respect max distance parameter', () => {
      const bars = [
        { userData: { isBar: true }, position: { z: 0 } },
        { userData: { isBar: true }, position: { z: 50 } },
        { userData: { isBar: true }, position: { z: 100 } },
        { userData: { isBar: true }, position: { z: 150 } },
      ];
      
      const activeClose = barSystem.getActiveBarCollisions(0, bars, 50);
      const activeFar = barSystem.getActiveBarCollisions(0, bars, 120);
      
      expect(activeClose.length).toBeLessThan(activeFar.length);
    });
  });

  describe('Edge Cases', () => {
    test('Should handle undefined bar data gracefully', () => {
      expect(() => {
        barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, undefined);
      }).not.toThrow();
    });

    test('Should handle missing player box', () => {
      expect(() => {
        barSystem.checkBarCollision(mockPlayerPos, null, mockBarData);
      }).not.toThrow();
    });

    test('Should handle extreme player heights', () => {
      // Very high
      mockPlayerPos.y = 10;
      let result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      expect(result.canSlide).toBe(true);
      
      // Negative (underground)
      mockPlayerPos.y = -5;
      result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      expect(result.canSlide).toBe(true);
    });

    test('Should handle duplicate collision calls', () => {
      const damageResults = [];
      
      for (let i = 0; i < 5; i++) {
        const result = barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
        damageResults.push(result.damageAmount);
      }
      
      // Only first should have damage, rest should be debounced
      expect(damageResults[0]).toBeGreaterThan(0);
      expect(damageResults.slice(1).every(d => d === 0)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('Should process 1000 bar checks under 1ms', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        mockPlayerPos.y = Math.random() * 2;
        barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, mockBarData);
      }
      
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1);
    });

    test('Should handle multiple bars efficiently', () => {
      const bars = Array.from({ length: 100 }, (_, i) => ({
        id: `bar-${i}`,
        position: new THREE.Vector3(0, 0.8, i * 5),
        type: 'bar'
      }));
      
      const start = performance.now();
      
      for (let bar of bars) {
        barSystem.checkBarCollision(mockPlayerPos, mockPlayerBox, bar);
      }
      
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10); // Should process 100 bars in <10ms
    });
  });

  describe('Constants Configuration', () => {
    test('Should accept custom constants', () => {
      const customSystem = new BarObstacleSystem({
        BAR_HEIGHT: 2.0,
        BAR_DAMAGE_TOP_HIT: 50,
        BAR_DAMAGE_EDGE_HIT: 20
      });
      
      expect(customSystem.constants.BAR_HEIGHT).toBe(2.0);
      expect(customSystem.constants.BAR_DAMAGE_TOP_HIT).toBe(50);
      expect(customSystem.constants.BAR_DAMAGE_EDGE_HIT).toBe(20);
    });

    test('Should preserve default constants if not overridden', () => {
      const customSystem = new BarObstacleSystem({ BAR_HEIGHT: 2.0 });
      
      expect(customSystem.constants.BAR_DAMAGE_TOP_HIT).toBe(25); // Default
      expect(customSystem.constants.BAR_HEIGHT).toBe(2.0); // Custom
    });
  });
});
