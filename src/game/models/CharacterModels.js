/**
 * ✅ VISUAL CHARACTER MODELS SYSTEM
 * Creates unique 3D models for each character with distinct appearances
 * Each character has unique colors, shapes, accessories, and particle effects
 */

import * as THREE from 'three';

/**
 * Base character creation with customization options
 */
export function createCharacterModel(characterId, geometries, materials, envMapTexture) {
  const character = new THREE.Group();
  character.name = characterId;
  
  // Get character-specific config
  const config = CHARACTER_VISUALS[characterId] || CHARACTER_VISUALS.default;
  
  // === TORSO ===
  const torsoGeo = new THREE.BoxGeometry(0.6, 0.7, 0.4);
  geometries.push(torsoGeo);
  
  const torsoMat = new THREE.MeshStandardMaterial({
    color: config.colors.primary,
    emissive: config.colors.emissive,
    emissiveIntensity: config.emissiveIntensity,
    metalness: config.metalness,
    roughness: config.roughness,
    envMap: envMapTexture
  });
  torsoMat.name = 'armorMat';
  materials.push(torsoMat);
  
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 0.7;
  torso.name = 'torso';
  character.add(torso);

  // === HEAD ===
  const headGeo = config.headShape === 'box' 
    ? new THREE.BoxGeometry(0.5, 0.5, 0.5)
    : config.headShape === 'sphere'
    ? new THREE.SphereGeometry(0.3, 16, 16)
    : new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
  geometries.push(headGeo);
  
  const headMat = new THREE.MeshStandardMaterial({
    color: config.colors.secondary,
    emissive: config.colors.emissive,
    emissiveIntensity: config.emissiveIntensity * 0.8,
    metalness: config.metalness,
    roughness: config.roughness,
    envMap: envMapTexture
  });
  materials.push(headMat);
  
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.3;
  head.name = 'head';
  character.add(head);

  // === VISOR/FACE ===
  const visorGeo = new THREE.PlaneGeometry(0.3, 0.15);
  geometries.push(visorGeo);
  
  const visorMat = new THREE.MeshStandardMaterial({
    color: config.colors.accent,
    emissive: config.colors.accent,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9
  });
  materials.push(visorMat);
  
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.3, 0.26);
  visor.name = 'visor';
  character.add(visor);

  // === ENERGY CORE (chest) ===
  const coreGeo = config.coreShape === 'sphere'
    ? new THREE.SphereGeometry(0.15, 12, 12)
    : config.coreShape === 'box'
    ? new THREE.BoxGeometry(0.2, 0.2, 0.1)
    : new THREE.OctahedronGeometry(0.12);
  geometries.push(coreGeo);
  
  const coreMat = new THREE.MeshStandardMaterial({
    color: config.colors.core,
    emissive: config.colors.core,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.95
  });
  materials.push(coreMat);
  
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 0.7, 0.25);
  core.name = 'energy_core';
  character.add(core);

  // === ARMS ===
  const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  geometries.push(armGeo);
  
  const leftArmMat = new THREE.MeshStandardMaterial({
    color: config.colors.limbs,
    emissive: config.colors.emissive,
    emissiveIntensity: config.emissiveIntensity * 0.5,
    metalness: config.metalness * 0.8,
    roughness: config.roughness,
    envMap: envMapTexture
  });
  materials.push(leftArmMat);
  
  const leftArm = new THREE.Mesh(armGeo, leftArmMat);
  leftArm.position.set(-0.45, 0.6, 0);
  leftArm.name = 'left_arm';
  character.add(leftArm);
  
  const rightArmMat = leftArmMat.clone();
  materials.push(rightArmMat);
  const rightArm = new THREE.Mesh(armGeo, rightArmMat);
  rightArm.position.set(0.45, 0.6, 0);
  rightArm.name = 'right_arm';
  character.add(rightArm);

  // === LEGS ===
  const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.22);
  geometries.push(legGeo);
  
  const leftLegMat = new THREE.MeshStandardMaterial({
    color: config.colors.limbs,
    emissive: config.colors.emissive,
    emissiveIntensity: config.emissiveIntensity * 0.5,
    metalness: config.metalness * 0.8,
    roughness: config.roughness,
    envMap: envMapTexture
  });
  materials.push(leftLegMat);
  
  const leftLeg = new THREE.Mesh(legGeo, leftLegMat);
  leftLeg.position.set(-0.18, 0.15, 0);
  leftLeg.name = 'left_leg';
  character.add(leftLeg);
  
  const rightLegMat = leftLegMat.clone();
  materials.push(rightLegMat);
  const rightLeg = new THREE.Mesh(legGeo, rightLegMat);
  rightLeg.position.set(0.18, 0.15, 0);
  rightLeg.name = 'right_leg';
  character.add(rightLeg);

  // === CHARACTER-SPECIFIC ACCESSORIES ===
  addCharacterAccessories(character, characterId, config, geometries, materials);

  return character;
}

/**
 * Add unique accessories for each character
 */
function addCharacterAccessories(character, characterId, config, geometries, materials) {
  switch(characterId) {
    case 'speed_demon':
      addLightningBolts(character, geometries, materials);
      break;
      
    case 'tank':
      addShieldBackpack(character, geometries, materials);
      break;
      
    case 'coin_magnet':
      addMagneticRings(character, geometries, materials);
      break;
      
    case 'neon_ninja':
      addKatana(character, geometries, materials);
      break;
      
    case 'cyber_samurai':
      addArmorPlates(character, geometries, materials);
      break;
      
    case 'holo_ghost':
      addHolographicAura(character, geometries, materials);
      break;
      
    case 'featherweight':
      addWings(character, geometries, materials);
      break;
      
    case 'fortune_hunter':
      addCoinPouch(character, geometries, materials);
      break;
      
    case 'medic':
      addMedicalCross(character, geometries, materials);
      break;
      
    case 'time_bender':
      addClockFace(character, geometries, materials);
      break;
      
    case 'streak_master':
      addFlameAccessory(character, geometries, materials);
      break;
      
    case 'phoenix':
      addPhoenixWings(character, geometries, materials);
      break;
  }
}

// === ACCESSORY FUNCTIONS ===

function addLightningBolts(character, geometries, materials) {
  const boltGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
  geometries.push(boltGeo);
  
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 2.0
  });
  materials.push(boltMat);
  
  const leftBolt = new THREE.Mesh(boltGeo, boltMat);
  leftBolt.position.set(-0.45, 1.1, 0);
  leftBolt.rotation.z = Math.PI;
  leftBolt.name = 'left_bolt';
  character.add(leftBolt);
  
  const rightBolt = new THREE.Mesh(boltGeo, boltMat);
  rightBolt.position.set(0.45, 1.1, 0);
  rightBolt.rotation.z = Math.PI;
  rightBolt.name = 'right_bolt';
  character.add(rightBolt);
}

function addShieldBackpack(character, geometries, materials) {
  const shieldGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
  geometries.push(shieldGeo);
  
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    metalness: 1.0,
    roughness: 0.2
  });
  materials.push(shieldMat);
  
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.set(0, 0.7, -0.25);
  shield.rotation.x = Math.PI / 2;
  shield.name = 'shield_backpack';
  character.add(shield);
}

function addMagneticRings(character, geometries, materials) {
  const ringGeo = new THREE.TorusGeometry(0.4, 0.03, 8, 16);
  geometries.push(ringGeo);
  
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.6
  });
  materials.push(ringMat);
  
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0.7, 0);
  ring.rotation.x = Math.PI / 2;
  ring.name = 'magnetic_ring';
  character.add(ring);
}

function addKatana(character, geometries, materials) {
  const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
  const bladeGeo = new THREE.BoxGeometry(0.05, 0.6, 0.02);
  geometries.push(handleGeo, bladeGeo);
  
  const katanaGroup = new THREE.Group();
  
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 1.0,
    roughness: 0.1
  });
  materials.push(handleMat, bladeMat);
  
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.y = -0.1;
  katanaGroup.add(handle);
  
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.y = 0.2;
  katanaGroup.add(blade);
  
  katanaGroup.position.set(0.3, 0.9, -0.15);
  katanaGroup.rotation.z = -Math.PI / 4;
  katanaGroup.name = 'katana';
  character.add(katanaGroup);
}

function addArmorPlates(character, geometries, materials) {
  const plateGeo = new THREE.BoxGeometry(0.25, 0.15, 0.05);
  geometries.push(plateGeo);
  
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0x660000,
    emissiveIntensity: 0.5,
    metalness: 1.0,
    roughness: 0.3
  });
  materials.push(plateMat);
  
  const leftPlate = new THREE.Mesh(plateGeo, plateMat);
  leftPlate.position.set(-0.45, 1.0, 0);
  leftPlate.name = 'left_plate';
  character.add(leftPlate);
  
  const rightPlate = new THREE.Mesh(plateGeo, plateMat);
  rightPlate.position.set(0.45, 1.0, 0);
  rightPlate.name = 'right_plate';
  character.add(rightPlate);
}

function addHolographicAura(character, geometries, materials) {
  const auraGeo = new THREE.SphereGeometry(0.5, 16, 16);
  geometries.push(auraGeo);
  
  const auraMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  materials.push(auraMat);
  
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.position.y = 0.7;
  aura.name = 'holo_aura';
  character.add(aura);
}

function addWings(character, geometries, materials) {
  const wingGeo = new THREE.BoxGeometry(0.3, 0.5, 0.05);
  geometries.push(wingGeo);
  
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xaaaaff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.7
  });
  materials.push(wingMat);
  
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.4, 0.7, -0.15);
  leftWing.rotation.y = Math.PI / 6;
  leftWing.name = 'left_wing';
  character.add(leftWing);
  
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.4, 0.7, -0.15);
  rightWing.rotation.y = -Math.PI / 6;
  rightWing.name = 'right_wing';
  character.add(rightWing);
}

function addCoinPouch(character, geometries, materials) {
  const pouchGeo = new THREE.SphereGeometry(0.15, 12, 12);
  geometries.push(pouchGeo);
  
  const pouchMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8
  });
  materials.push(pouchMat);
  
  const pouch = new THREE.Mesh(pouchGeo, pouchMat);
  pouch.position.set(-0.3, 0.3, 0.1);
  pouch.scale.set(1, 0.8, 0.8);
  pouch.name = 'coin_pouch';
  character.add(pouch);
}

function addMedicalCross(character, geometries, materials) {
  const crossGeo = new THREE.BoxGeometry(0.15, 0.05, 0.05);
  geometries.push(crossGeo);
  
  const crossMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.5
  });
  materials.push(crossMat);
  
  const horizontal = new THREE.Mesh(crossGeo, crossMat);
  horizontal.position.set(0, 1.0, 0.25);
  character.add(horizontal);
  
  const verticalGeo = new THREE.BoxGeometry(0.05, 0.15, 0.05);
  geometries.push(verticalGeo);
  const vertical = new THREE.Mesh(verticalGeo, crossMat);
  vertical.position.set(0, 1.0, 0.25);
  character.add(vertical);
}

function addClockFace(character, geometries, materials) {
  const clockGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
  geometries.push(clockGeo);
  
  const clockMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaff,
    emissive: 0xaaaaff,
    emissiveIntensity: 1.0
  });
  materials.push(clockMat);
  
  const clock = new THREE.Mesh(clockGeo, clockMat);
  clock.position.set(0, 0.7, 0.25);
  clock.rotation.x = Math.PI / 2;
  clock.name = 'clock_face';
  character.add(clock);
}

function addFlameAccessory(character, geometries, materials) {
  const flameGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
  geometries.push(flameGeo);
  
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff4400,
    emissiveIntensity: 2.0
  });
  materials.push(flameMat);
  
  const flame1 = new THREE.Mesh(flameGeo, flameMat);
  flame1.position.set(-0.2, 0.3, -0.2);
  flame1.name = 'flame1';
  character.add(flame1);
  
  const flame2 = new THREE.Mesh(flameGeo, flameMat);
  flame2.position.set(0.2, 0.3, -0.2);
  flame2.name = 'flame2';
  character.add(flame2);
}

function addPhoenixWings(character, geometries, materials) {
  const wingGeo = new THREE.BoxGeometry(0.4, 0.6, 0.05);
  geometries.push(wingGeo);
  
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff4400,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.8
  });
  materials.push(wingMat);
  
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.5, 0.7, -0.2);
  leftWing.rotation.y = Math.PI / 4;
  leftWing.name = 'phoenix_left_wing';
  character.add(leftWing);
  
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.5, 0.7, -0.2);
  rightWing.rotation.y = -Math.PI / 4;
  rightWing.name = 'phoenix_right_wing';
  character.add(rightWing);
}

/**
 * Character visual configurations
 */
export const CHARACTER_VISUALS = {
  default: {
    colors: {
      primary: 0x00aaff,
      secondary: 0x0088cc,
      accent: 0x00ffff,
      core: 0x00ffff,
      emissive: 0x004466,
      limbs: 0x0099dd
    },
    headShape: 'box',
    coreShape: 'sphere',
    metalness: 0.8,
    roughness: 0.3,
    emissiveIntensity: 0.4
  },
  
  speed_demon: {
    colors: {
      primary: 0xffff00,
      secondary: 0xffaa00,
      accent: 0xffffff,
      core: 0xffff00,
      emissive: 0xff8800,
      limbs: 0xffcc00
    },
    headShape: 'cylinder',
    coreShape: 'octahedron',
    metalness: 1.0,
    roughness: 0.1,
    emissiveIntensity: 0.8
  },
  
  tank: {
    colors: {
      primary: 0x00ffff,
      secondary: 0x0088aa,
      accent: 0x00ffff,
      core: 0x00ffff,
      emissive: 0x004444,
      limbs: 0x00aacc
    },
    headShape: 'box',
    coreShape: 'box',
    metalness: 1.0,
    roughness: 0.2,
    emissiveIntensity: 0.6
  },
  
  coin_magnet: {
    colors: {
      primary: 0x00ff00,
      secondary: 0x00aa00,
      accent: 0x00ff00,
      core: 0xffff00,
      emissive: 0x004400,
      limbs: 0x00cc00
    },
    headShape: 'sphere',
    coreShape: 'sphere',
    metalness: 0.9,
    roughness: 0.2,
    emissiveIntensity: 0.6
  },
  
  neon_ninja: {
    colors: {
      primary: 0xff00ff,
      secondary: 0xaa00aa,
      accent: 0xff00ff,
      core: 0xff00ff,
      emissive: 0x660066,
      limbs: 0xcc00cc
    },
    headShape: 'sphere',
    coreShape: 'octahedron',
    metalness: 0.9,
    roughness: 0.2,
    emissiveIntensity: 0.7
  },
  
  cyber_samurai: {
    colors: {
      primary: 0xff0000,
      secondary: 0xaa0000,
      accent: 0xff0000,
      core: 0xff0000,
      emissive: 0x440000,
      limbs: 0xcc0000
    },
    headShape: 'box',
    coreShape: 'octahedron',
    metalness: 1.0,
    roughness: 0.3,
    emissiveIntensity: 0.6
  },
  
  holo_ghost: {
    colors: {
      primary: 0x00ffff,
      secondary: 0x00cccc,
      accent: 0x00ffff,
      core: 0x00ffff,
      emissive: 0x006666,
      limbs: 0x00dddd
    },
    headShape: 'sphere',
    coreShape: 'sphere',
    metalness: 0.5,
    roughness: 0.6,
    emissiveIntensity: 1.0
  },
  
  featherweight: {
    colors: {
      primary: 0xffffff,
      secondary: 0xdddddd,
      accent: 0xaaaaff,
      core: 0xaaaaff,
      emissive: 0xaaaaff,
      limbs: 0xeeeeee
    },
    headShape: 'sphere',
    coreShape: 'sphere',
    metalness: 0.6,
    roughness: 0.4,
    emissiveIntensity: 0.5
  },
  
  fortune_hunter: {
    colors: {
      primary: 0xffd700,
      secondary: 0xffaa00,
      accent: 0xffffff,
      core: 0xffd700,
      emissive: 0xaa8800,
      limbs: 0xffcc00
    },
    headShape: 'cylinder',
    coreShape: 'sphere',
    metalness: 1.0,
    roughness: 0.1,
    emissiveIntensity: 0.7
  },
  
  medic: {
    colors: {
      primary: 0xffffff,
      secondary: 0xeeeeee,
      accent: 0xff0000,
      core: 0xff0000,
      emissive: 0xffcccc,
      limbs: 0xdddddd
    },
    headShape: 'box',
    coreShape: 'box',
    metalness: 0.4,
    roughness: 0.6,
    emissiveIntensity: 0.5
  },
  
  time_bender: {
    colors: {
      primary: 0xaaaaff,
      secondary: 0x8888cc,
      accent: 0xffffff,
      core: 0xaaaaff,
      emissive: 0x6666aa,
      limbs: 0x9999dd
    },
    headShape: 'cylinder',
    coreShape: 'octahedron',
    metalness: 0.8,
    roughness: 0.3,
    emissiveIntensity: 0.8
  },
  
  streak_master: {
    colors: {
      primary: 0xff4400,
      secondary: 0xcc3300,
      accent: 0xffff00,
      core: 0xff4400,
      emissive: 0xff2200,
      limbs: 0xdd3300
    },
    headShape: 'sphere',
    coreShape: 'octahedron',
    metalness: 0.9,
    roughness: 0.2,
    emissiveIntensity: 1.0
  },
  
  phoenix: {
    colors: {
      primary: 0xff4400,
      secondary: 0xff2200,
      accent: 0xffaa00,
      core: 0xffff00,
      emissive: 0xff6600,
      limbs: 0xff3300
    },
    headShape: 'sphere',
    coreShape: 'sphere',
    metalness: 0.7,
    roughness: 0.3,
    emissiveIntensity: 1.2
  }
};

/**
 * Export function for backward compatibility
 * Replaces the original createDetailedPlayer function
 */
export function createDetailedPlayer(geometries, materials, envMapTexture, characterId = 'default') {
  return createCharacterModel(characterId, geometries, materials, envMapTexture);
}
