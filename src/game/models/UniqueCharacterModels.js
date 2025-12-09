import * as THREE from 'three';

// ============================================
// 1. SHARED MATERIALS (Reused for performance)
// ============================================
const MATS = {
  armorDark: new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, // Dark charcoal/black
    metalness: 0.6,
    roughness: 0.4,
    name: 'armorDark'
  }),
  armorLight: new THREE.MeshStandardMaterial({
    color: 0x333344, // Slightly lighter grey for contrast plates
    metalness: 0.7,
    roughness: 0.3,
    name: 'armorLight'
  }),
  skin: new THREE.MeshStandardMaterial({
    color: 0x222222, // Dark undersuit
    metalness: 0.4,
    roughness: 0.6,
    name: 'skin'
  }),
  glowOrange: new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff4400, // Deep orange glow
    emissiveIntensity: 4.0, // HIGH INTENSITY FOR BLOOM
    toneMapped: false,
    name: 'glowOrange'
  }),
  glowCyan: new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 4.0,
    toneMapped: false,
    name: 'glowCyan'
  }),
  visor: new THREE.MeshStandardMaterial({
    color: 0xffcc00, // Gold visor
    emissive: 0xffcc00,
    emissiveIntensity: 2.0,
    metalness: 1.0,
    roughness: 0.0,
    name: 'visor'
  })
};

// ============================================
// 2. CHARACTER CONFIGS
// ============================================
export const UNIQUE_CHARACTER_CONFIGS = {
  default: { scale: 1.0, theme: 'cyan' },
  speed_demon: { scale: 1.0, theme: 'orange', features: ['fins', 'chest_plate', 'leg_thrusters'] },
  tank: { scale: 1.2, theme: 'cyan', features: ['heavy_shoulders'] }
};

// ============================================
// 3. MAIN BUILDER FUNCTION
// ============================================
export function createUniqueCharacter(characterId, geometries = [], materials = [], envMap = null) {
  const group = new THREE.Group();
  const config = UNIQUE_CHARACTER_CONFIGS[characterId] || UNIQUE_CHARACTER_CONFIGS.default;
  
  // Apply EnvMap to materials if provided
  Object.values(MATS).forEach(mat => {
    if(mat.name !== 'glowOrange' && mat.name !== 'glowCyan') {
      mat.envMap = envMap;
      mat.envMapIntensity = 1.0;
    }
  });

  // Determine Theme Color
  const glowMat = config.theme === 'orange' ? MATS.glowOrange : MATS.glowCyan;

  // --- SKELETON STRUCTURE ---
  
  // 1. PELVIS (Central Anchor)
  const hipsGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.25, 8);
  geometries.push(hipsGeo);
  const hips = new THREE.Mesh(hipsGeo, MATS.skin);
  hips.position.y = 0.9;
  group.add(hips);

  // 2. TORSO (The V-Shape Armor)
  // We use a cylinder that is wider at top to mimic athletic build
  const torsoGeo = new THREE.CylinderGeometry(0.35, 0.2, 0.6, 6);
  geometries.push(torsoGeo);
  const torso = new THREE.Mesh(torsoGeo, MATS.armorDark);
  torso.position.y = 0.45; // Relative to hips
  torso.castShadow = true;
  hips.add(torso);

  // Chest Glow Lines (The specific pattern from your image)
  const chestPlateGeo = new THREE.BoxGeometry(0.4, 0.3, 0.35);
  geometries.push(chestPlateGeo);
  const chestPlate = new THREE.Mesh(chestPlateGeo, MATS.armorLight);
  chestPlate.position.set(0, 0.1, 0.05);
  torso.add(chestPlate);

  // The Glowing "Y" shape on chest
  const glowYGeo = new THREE.TorusGeometry(0.15, 0.02, 4, 3); // Triangular glow
  geometries.push(glowYGeo);
  const chestGlow = new THREE.Mesh(glowYGeo, glowMat);
  chestGlow.position.set(0, 0.1, 0.18);
  chestGlow.rotation.z = Math.PI;
  torso.add(chestGlow);

  // 3. HEAD (Helmet with Fins)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.5; // Relative to torso
  torso.add(headGroup);

  // Main Helmet Sphere
  const helmetGeo = new THREE.SphereGeometry(0.22, 16, 16);
  geometries.push(helmetGeo);
  const helmet = new THREE.Mesh(helmetGeo, MATS.armorDark);
  headGroup.add(helmet);

  // Visor (The gold strip)
  const visorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16, 1, true, 0, Math.PI);
  geometries.push(visorGeo);
  const visor = new THREE.Mesh(visorGeo, MATS.visor);
  visor.rotation.x = -0.1;
  visor.position.set(0, 0.02, 0.02);
  headGroup.add(visor);

  // "Speed Demon" Fins (The yellow ears in your image)
  if (config.features?.includes('fins')) {
    const finGeo = new THREE.BufferGeometry();
    // Custom triangle shape
    const vertices = new Float32Array([
      0, 0, 0,   0.1, 0.4, -0.1,   0, 0, -0.2
    ]);
    finGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    finGeo.computeVertexNormals();
    geometries.push(finGeo);

    const leftFin = new THREE.Mesh(finGeo, glowMat);
    leftFin.position.set(-0.15, 0.1, 0);
    leftFin.rotation.z = 0.3;
    leftFin.rotation.y = -0.2;
    headGroup.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, glowMat);
    rightFin.position.set(0.15, 0.1, 0);
    rightFin.rotation.z = -0.3;
    rightFin.rotation.y = 0.2;
    headGroup.add(rightFin);
  }

  // 4. LIMBS (With Glow Joints)
  
  const limbGeo = new THREE.CapsuleGeometry(0.09, 0.5, 4, 8);
  geometries.push(limbGeo);
  const jointGeo = new THREE.SphereGeometry(0.11, 8, 8); // Knees/Elbows
  geometries.push(jointGeo);

  function createLimb(x, y, z, isLeg = false) {
    const limbGroup = new THREE.Group();
    limbGroup.position.set(x, y, z);

    // Upper Part
    const upper = new THREE.Mesh(limbGeo, MATS.armorDark);
    upper.position.y = -0.25;
    limbGroup.add(upper);

    // Joint (Glowing Knee/Elbow)
    const joint = new THREE.Mesh(jointGeo, glowMat);
    joint.position.y = -0.55;
    joint.scale.set(1, 0.8, 1);
    limbGroup.add(joint);

    // Lower Part
    const lower = new THREE.Mesh(limbGeo, MATS.armorLight);
    lower.position.y = -0.9;
    limbGroup.add(lower);

    // Glow Strip on lower limb
    const stripGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.4, 6, 1, true);
    geometries.push(stripGeo);
    const strip = new THREE.Mesh(stripGeo, glowMat);
    strip.position.y = -0.9;
    // Use vertex colors or texture for pattern - using scale here for simple effect
    strip.scale.set(1.05, 0.8, 1.05); 
    // Hack: Make it a wireframe-ish look or solid strip
    limbGroup.add(strip);

    return { group: limbGroup, upper, lower };
  }

  // Create Arms
  const leftArm = createLimb(-0.45, 0.3, 0);
  leftArm.group.name = 'left_arm';
  torso.add(leftArm.group);

  const rightArm = createLimb(0.45, 0.3, 0);
  rightArm.group.name = 'right_arm';
  torso.add(rightArm.group);

  // Create Legs
  const leftLeg = createLimb(-0.2, 0, 0, true);
  leftLeg.group.name = 'left_leg';
  hips.add(leftLeg.group);

  const rightLeg = createLimb(0.2, 0, 0, true);
  rightLeg.group.name = 'right_leg';
  hips.add(rightLeg.group);

  // Add naming for animation controller
  headGroup.name = 'head';
  
  // Scale entire character
  group.scale.setScalar(config.scale);

  return group;
}