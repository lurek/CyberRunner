/**
 * ✅ PHASE 3.4: Word Hunt Collectibles System
 * 
 * Features:
 * - Spawn letters "C-Y-B-E-R" daily on track
 * - Collecting all 5 = Large reward (5,000 coins + 100 gems)
 * - Resets at midnight
 * - Letters glow and have particle effects
 */

import * as THREE from 'three';

const WORD_HUNT_LETTERS = ['C', 'Y', 'B', 'E', 'R'];

export class WordHuntManager {
  constructor() {
    this.letters = new Map(); // Map of letter -> collected status
    this.letterMeshes = new Map(); // Map of letter -> THREE.Group
    this.lastResetDate = null;
    this.rewardClaimed = false;
    this.spawnedLetters = [];
    
    // Load saved progress
    this.loadProgress();
    this.checkDailyReset();
  }

  /**
   * Initialize the word hunt for a new game session
   */
  reset() {
    this.checkDailyReset();
    
    // Reset collected letters for this session
    WORD_HUNT_LETTERS.forEach(letter => {
      if (!this.letters.has(letter)) {
        this.letters.set(letter, false);
      }
    });
    
    this.spawnedLetters = [];
    this.clearLetterMeshes();
  }

  /**
   * Check if it's a new day and reset if needed
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    
    if (this.lastResetDate !== today) {
      console.log('📅 New day detected - resetting Word Hunt');
      this.letters.clear();
      WORD_HUNT_LETTERS.forEach(letter => {
        this.letters.set(letter, false);
      });
      this.rewardClaimed = false;
      this.lastResetDate = today;
      this.saveProgress();
    }
  }

  /**
   * Spawn a letter at a specific position on the track
   * @param {THREE.Scene} scene 
   * @param {number} lane - 0, 1, or 2
   * @param {number} z - Z position
   */
  spawnLetter(scene, lane, z) {
    // Find which letters haven't been spawned yet
    const unspawnedLetters = WORD_HUNT_LETTERS.filter(
      letter => !this.spawnedLetters.includes(letter)
    );
    
    if (unspawnedLetters.length === 0) return null;
    
    // Pick a random unspawned letter
    const letter = unspawnedLetters[Math.floor(Math.random() * unspawnedLetters.length)];
    this.spawnedLetters.push(letter);
    
    // Create letter mesh
    const letterGroup = this.createLetterMesh(letter);
    
    // Position
    const lanePositions = [-3, 0, 3];
    letterGroup.position.set(lanePositions[lane], 1.5, z);
    
    // Store reference
    this.letterMeshes.set(letter, {
      group: letterGroup,
      letter: letter,
      collected: false,
      z: z
    });
    
    scene.add(letterGroup);
    
    return letterGroup;
  }

  /**
   * Create a glowing letter mesh
   * @param {string} letter 
   */
  createLetterMesh(letter) {
    const group = new THREE.Group();
    
    // Create text geometry (simplified cube for performance)
    const geometry = new THREE.BoxGeometry(1.2, 1.6, 0.3);
    const material = new THREE.MeshStandardMaterial({
      color: 0x5b8fc7,
      emissive: 0x5b8fc7,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const cube = new THREE.Mesh(geometry, material);
    group.add(cube);
    
    // Add canvas texture with letter
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw letter
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#5b8fc7';
    ctx.font = 'bold 96px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });
    
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1.3),
      textMaterial
    );
    textPlane.position.z = 0.16;
    group.add(textPlane);
    
    // Add glow ring
    const ringGeometry = new THREE.RingGeometry(0.7, 0.9, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x5b8fc7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.9;
    group.add(ring);
    
    // Add point light
    const light = new THREE.PointLight(0x5b8fc7, 2, 8);
    light.position.set(0, 0, 0.5);
    group.add(light);
    
    // Store references for animation
    group.userData.cube = cube;
    group.userData.ring = ring;
    group.userData.light = light;
    group.userData.letter = letter;
    group.userData.isWordHuntLetter = true;
    
    return group;
  }

  /**
   * Update letter animations
   * @param {number} delta 
   */
  update(delta) {
    this.letterMeshes.forEach(({ group, collected }) => {
      if (collected) return;
      
      // Rotate
      group.rotation.y += delta * 2;
      
      // Bob up and down
      group.position.y = 1.5 + Math.sin(Date.now() * 0.002) * 0.3;
      
      // Pulse glow
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
      if (group.userData.cube) {
        group.userData.cube.material.emissiveIntensity = pulse;
      }
      if (group.userData.light) {
        group.userData.light.intensity = 2 + pulse;
      }
      if (group.userData.ring) {
        group.userData.ring.material.opacity = 0.3 + pulse * 0.2;
      }
    });
  }

  /**
   * Check if player collected a letter
   * @param {THREE.Vector3} playerPosition 
   * @returns {string|null} - Letter collected or null
   */
  checkCollection(playerPosition) {
    let collectedLetter = null;
    
    this.letterMeshes.forEach(({ group, letter, collected }, key) => {
      if (collected) return;
      
      const distance = playerPosition.distanceTo(group.position);
      
      if (distance < 1.5) {
        // Collect letter
        console.log(`📝 Collected letter: ${letter}`);
        this.letters.set(letter, true);
        this.letterMeshes.get(key).collected = true;
        
        // Remove from scene
        group.visible = false;
        
        collectedLetter = letter;
        this.saveProgress();
      }
    });
    
    return collectedLetter;
  }

  /**
   * Check if all letters collected
   */
  isWordComplete() {
    return Array.from(this.letters.values()).every(collected => collected);
  }

  /**
   * Get progress (e.g., "3/5")
   */
  getProgress() {
    const collected = Array.from(this.letters.values()).filter(c => c).length;
    return `${collected}/${WORD_HUNT_LETTERS.length}`;
  }

  /**
   * Get collected letters as array
   */
  getCollectedLetters() {
    return WORD_HUNT_LETTERS.filter(letter => this.letters.get(letter));
  }

  /**
   * Claim the completion reward
   */
  claimReward() {
    if (this.isWordComplete() && !this.rewardClaimed) {
      this.rewardClaimed = true;
      this.saveProgress();
      return {
        coins: 5000,
        gems: 100
      };
    }
    return null;
  }

  /**
   * Can claim reward?
   */
  canClaimReward() {
    return this.isWordComplete() && !this.rewardClaimed;
  }

  /**
   * Clear all letter meshes
   */
  clearLetterMeshes() {
    this.letterMeshes.forEach(({ group }) => {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.letterMeshes.clear();
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      const data = {
        letters: Array.from(this.letters.entries()),
        lastResetDate: this.lastResetDate,
        rewardClaimed: this.rewardClaimed
      };
      localStorage.setItem('cyberrunner_wordhunt', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save word hunt progress:', e);
    }
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('cyberrunner_wordhunt');
      if (saved) {
        const data = JSON.parse(saved);
        this.letters = new Map(data.letters || []);
        this.lastResetDate = data.lastResetDate;
        this.rewardClaimed = data.rewardClaimed || false;
      } else {
        // Initialize fresh
        WORD_HUNT_LETTERS.forEach(letter => {
          this.letters.set(letter, false);
        });
        this.lastResetDate = new Date().toDateString();
      }
    } catch (e) {
      console.error('Failed to load word hunt progress:', e);
      WORD_HUNT_LETTERS.forEach(letter => {
        this.letters.set(letter, false);
      });
      this.lastResetDate = new Date().toDateString();
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.clearLetterMeshes();
  }
}
