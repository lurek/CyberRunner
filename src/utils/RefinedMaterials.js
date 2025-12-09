/**
 * ðŸŽ¨ REFINED THEME - 3D MATERIALS & COLORS
 * Use this in place of bright neon colors in Three.js
 */

import * as THREE from 'three';

// ============================================
// COLOR PALETTE - MUTED & ELEGANT
// ============================================

export const RefinedColors = {
  // Dark Base Colors
  bgPrimary: 0x0f0f1a,
  bgSecondary: 0x1a1a2e,
  bgTertiary: 0x252542,
  
  // Neutral Grays
  gray900: 0x0a0a14,
  gray800: 0x1e1e2e,
  gray700: 0x2a2a3e,
  gray600: 0x3a3a4e,
  gray500: 0x5a5a6e,
  
  // Muted Accents (Use these instead of bright cyan)
  accentBlue: 0x5b8fc7,    // Soft blue (replaces #00ffff)
  accentPurple: 0x9b7fc7,  // Muted purple (replaces #ff00ff)
  accentTeal: 0x5ba8a0,    // Desaturated teal
  accentOrange: 0xd4874f,  // Warm orange
  
  // Bright Highlights (Use sparingly - only for active states)
  highlightCyan: 0x00d4ff,   // Dimmer cyan for important actions
  highlightGold: 0xffb84d,   // Rewards, success
  highlightRed: 0xff6b6b,    // Danger
  highlightGreen: 0x51cf66,  // Success
};

// ============================================
// MATERIAL PRESETS - ELEGANT CYBERPUNK
// ============================================

/**
 * Player Core Material (Replaces bright glowing cyan)
 */
export const createPlayerCoreMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: RefinedColors.accentBlue,
    emissive: RefinedColors.accentBlue,
    emissiveIntensity: 0.4, // Was 1.5 - much more subtle
    metalness: 0.85,
    roughness: 0.15,
    envMapIntensity: 0.7,
  });
};

/**
 * Player Head Material (Replaces bright magenta)
 */
export const createPlayerHeadMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: RefinedColors.accentPurple,
    emissive: RefinedColors.accentPurple,
    emissiveIntensity: 0.3, // Was 0.5
    metalness: 0.9,
    roughness: 0.2,
  });
};

/**
 * Building Material (Replaces bright cyan buildings)
 */
export const createBuildingMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: RefinedColors.gray700,
    metalness: 0.3,
    roughness: 0.7,
    envMapIntensity: 0.5,
    // Only very subtle emissive
    emissive: RefinedColors.accentBlue,
    emissiveIntensity: 0.05, // Barely visible glow
  });
};

/**
 * Neon Light Material (For accent lights on buildings)
 */
export const createNeonLightMaterial = (colorKey = 'accentPurple') => {
  return new THREE.MeshBasicMaterial({
    color: RefinedColors[colorKey],
    transparent: true,
    opacity: 0.8, // Was 1.0
  });
};

/**
 * Ground/Track Material (Replaces bright base)
 */
export const createGroundMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: RefinedColors.gray800,
    metalness: 0.4,
    roughness: 0.6,
    envMapIntensity: 0.3,
  });
};

/**
 * Obstacle Material (Muted, visible but not glaring)
 */
export const createObstacleMaterial = (type = 'default') => {
  const colorMap = {
    default: RefinedColors.accentBlue,
    danger: RefinedColors.highlightRed,
    warning: RefinedColors.accentOrange,
  };
  
  return new THREE.MeshStandardMaterial({
    color: colorMap[type],
    emissive: colorMap[type],
    emissiveIntensity: 0.2, // Subtle glow
    metalness: 0.7,
    roughness: 0.3,
  });
};

// ============================================
// PARTICLE SYSTEM HELPERS
// ============================================

/**
 * Get muted particle colors (replaces bright cyan/magenta)
 */
export const getParticleColors = () => {
  return [
    new THREE.Color(RefinedColors.accentBlue),
    new THREE.Color(RefinedColors.accentPurple),
    new THREE.Color(RefinedColors.accentTeal),
  ];
};

/**
 * Create particle material with reduced opacity
 */
export const createParticleMaterial = (size = 0.12) => {
  return new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 0.3, // Was 0.7-0.8 - much more subtle
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
};

// ============================================
// LIGHTING HELPERS
// ============================================

/**
 * Create refined neon point light (not blinding)
 */
export const createNeonLight = (position, colorKey = 'accentPurple') => {
  const colors = [
    RefinedColors.accentBlue,
    RefinedColors.accentPurple,
    RefinedColors.accentTeal,
    RefinedColors.accentOrange,
  ];
  
  const randomColor = colorKey === 'random' 
    ? colors[Math.floor(Math.random() * colors.length)]
    : RefinedColors[colorKey];
  
  const light = new THREE.PointLight(randomColor, 0.6, 30); // Was 2.0, 50
  light.position.copy(position);
  return light;
};

/**
 * Create ambient/environment lighting
 */
export const createAmbientLighting = () => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.3); // Dim ambient
  const hemisphere = new THREE.HemisphereLight(
    RefinedColors.accentBlue,  // Sky color
    RefinedColors.gray700,     // Ground color
    0.4
  );
  
  return { ambient, hemisphere };
};

// ============================================
// SCENE SETUP HELPERS
// ============================================

/**
 * Configure refined fog and background
 */
export const setupSceneAtmosphere = (scene) => {
  scene.fog = new THREE.Fog(RefinedColors.bgPrimary, 50, 200);
  scene.background = new THREE.Color(RefinedColors.bgPrimary);
};

/**
 * Get trail material (for speed/boost effects)
 */
export const createTrailMaterial = (colorKey = 'accentBlue') => {
  return new THREE.MeshBasicMaterial({
    color: RefinedColors[colorKey],
    transparent: true,
    opacity: 0.35, // Was 0.7
    side: THREE.DoubleSide,
  });
};

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example: Update existing player model
 * 
 * // Before:
 * playerCore.material.color = new THREE.Color(0x00ffff);
 * playerCore.material.emissiveIntensity = 1.5;
 * 
 * // After:
 * playerCore.material = createPlayerCoreMaterial();
 */

/**
 * Example: Update building colors
 * 
 * // Before:
 * building.material.color = new THREE.Color(0x00ffff);
 * 
 * // After:
 * building.material = createBuildingMaterial();
 */

/**
 * Example: Update particle system
 * 
 * // Before:
 * const colors = [0x00ffff, 0xff00ff];
 * 
 * // After:
 * const colors = getParticleColors();
 * const particleMaterial = createParticleMaterial(0.12);
 */

export default {
  RefinedColors,
  createPlayerCoreMaterial,
  createPlayerHeadMaterial,
  createBuildingMaterial,
  createNeonLightMaterial,
  createGroundMaterial,
  createObstacleMaterial,
  getParticleColors,
  createParticleMaterial,
  createNeonLight,
  createAmbientLighting,
  setupSceneAtmosphere,
  createTrailMaterial,
};
