/**
 * Character Stats Manager
 * Handles character stat modifications and special abilities
 * Integrates character purchases with actual gameplay
 */

import { CHARACTERS } from '../../utils/constants.js';

export class CharacterStatsManager {
  constructor() {
    this.activeCharacter = 'default';
    this.characterStats = null;
    this.updateStats();
  }

  /**
   * Set the active character
   */
  setActiveCharacter(characterId) {
    if (CHARACTERS[characterId]) {
      this.activeCharacter = characterId;
      this.updateStats();
      console.log(`✅ Character equipped: ${CHARACTERS[characterId].name}`);
      return true;
    }
    console.warn(`⚠️ Unknown character: ${characterId}`);
    return false;
  }

  /**
   * Get current character ID
   */
  getActiveCharacter() {
    return this.activeCharacter;
  }

  /**
   * Get current character stats
   */
  getStats() {
    return this.characterStats;
  }

  /**
   * Update internal stats cache
   */
  updateStats() {
    const character = CHARACTERS[this.activeCharacter];
    this.characterStats = character ? character.stats : CHARACTERS.default.stats;
  }

  /**
   * Get modified speed based on character
   * @param {number} baseSpeed - Base game speed
   * @returns {number} Modified speed
   */
  getModifiedSpeed(baseSpeed) {
    return baseSpeed * (this.characterStats.speed || 1.0);
  }

  /**
   * Get modified jump velocity based on character
   * @param {number} baseJumpVelocity - Base jump power
   * @returns {number} Modified jump velocity
   */
  getModifiedJumpVelocity(baseJumpVelocity) {
    return baseJumpVelocity * (this.characterStats.jumpHeight || 1.0);
  }

  /**
   * Get modified magnet radius based on character
   * @param {number} baseMagnetRadius - Base magnet range
   * @returns {number} Modified magnet radius
   */
  getModifiedMagnetRadius(baseMagnetRadius) {
    return baseMagnetRadius * (this.characterStats.magnetRadius || 1.0);
  }

  /**
   * Get modified grapple cooldown based on character
   * @param {number} baseCooldown - Base cooldown time
   * @returns {number} Modified cooldown
   */
  getModifiedGrappleCooldown(baseCooldown) {
    return baseCooldown * (this.characterStats.grappleCooldown || 1.0);
  }

  /**
   * Check if character starts with shield
   * @returns {boolean}
   */
  hasStartingShield() {
    return this.characterStats.startWithShield === true;
  }

  /**
   * Check if character has double jump ability
   * @returns {boolean}
   */
  hasDoubleJump() {
    return this.characterStats.doubleJump === true;
  }

  /**
   * Get revive invincibility duration
   * @returns {number} Seconds of invincibility after revive (0 if none)
   */
  getReviveInvincibility() {
    return this.characterStats.reviveInvincibility || 0;
  }

  /**
   * Check if character has a specific ability
   * @param {string} ability - Ability name
   * @returns {boolean}
   */
  hasAbility(ability) {
    return this.characterStats[ability] === true;
  }

  /**
   * Get character info for display
   */
  getCharacterInfo() {
    const character = CHARACTERS[this.activeCharacter];
    return {
      id: this.activeCharacter,
      name: character?.name || 'Unknown',
      description: character?.description || '',
      stats: this.characterStats
    };
  }

  /**
   * Debug: Print current character stats
   */
  printStats() {
    const info = this.getCharacterInfo();
    console.log('=== CHARACTER STATS ===');
    console.log(`Name: ${info.name}`);
    console.log(`Speed Multiplier: ${info.stats.speed}x`);
    console.log(`Jump Multiplier: ${info.stats.jumpHeight}x`);
    console.log(`Magnet Multiplier: ${info.stats.magnetRadius}x`);
    console.log(`Start With Shield: ${this.hasStartingShield()}`);
    console.log(`Double Jump: ${this.hasDoubleJump()}`);
    console.log(`Grapple Cooldown: ${(info.stats.grappleCooldown || 1.0) * 100}%`);
    console.log(`Revive Invincibility: ${this.getReviveInvincibility()}s`);
    console.log('========================');
  }
}

// Singleton instance
let characterStatsManager = null;

export function getCharacterStatsManager() {
  if (!characterStatsManager) {
    characterStatsManager = new CharacterStatsManager();
  }
  return characterStatsManager;
}
