import * as THREE from "three";

// ================== STANDARD POWER-UPS ==================

export function createShieldShape() {
  const s = new THREE.Shape();
  const r = 0.5;
  // Hexagon shield shape
  s.moveTo(0, r);
  s.lineTo(r * 0.866, r * 0.5);
  s.lineTo(r * 0.866, -r * 0.5);
  s.lineTo(0, -r);
  s.lineTo(-r * 0.866, -r * 0.5);
  s.lineTo(-r * 0.866, r * 0.5);
  s.closePath();
  return s;
}

export function createZapShape() {
  const s = new THREE.Shape();
  // Lightning bolt
  s.moveTo(0.2, 0.5);
  s.lineTo(-0.3, 0.1);
  s.lineTo(0.1, 0.1);
  s.lineTo(-0.2, -0.5);
  s.lineTo(0.3, -0.1);
  s.lineTo(-0.1, -0.1);
  s.closePath();
  return s;
}

export function createMagnetShape() {
  const s = new THREE.Shape();
  const outerRadius = 0.45;
  const innerRadius = 0.2;
  const V_OFFSET = 0.1;
  // Horseshoe magnet
  s.moveTo(outerRadius, V_OFFSET);
  s.absarc(0, V_OFFSET, outerRadius, 0, Math.PI, false);
  s.lineTo(-innerRadius, V_OFFSET);
  s.absarc(0, V_OFFSET, innerRadius, Math.PI, 0, true);
  s.lineTo(outerRadius, V_OFFSET);
  return s;
}

export function createHealthShape() {
  const s = new THREE.Shape();
  const r = 0.4;
  // Plus sign / cross
  s.moveTo(-r * 0.3, -r);
  s.lineTo(r * 0.3, -r);
  s.lineTo(r * 0.3, -r * 0.3);
  s.lineTo(r, -r * 0.3);
  s.lineTo(r, r * 0.3);
  s.lineTo(r * 0.3, r * 0.3);
  s.lineTo(r * 0.3, r);
  s.lineTo(-r * 0.3, r);
  s.lineTo(-r * 0.3, r * 0.3);
  s.lineTo(-r, r * 0.3);
  s.lineTo(-r, -r * 0.3);
  s.lineTo(-r * 0.3, -r * 0.3);
  s.closePath();
  return s;
}

export function createTimeShape() {
  const s = new THREE.Shape();
  const w = 0.4;
  const h = 0.5;
  // Hourglass shape
  s.moveTo(-w, -h);
  s.lineTo(w, -h);
  s.lineTo(-w, h);
  s.lineTo(w, h);
  s.closePath();

  s.moveTo(-w * 0.8, -h * 0.9);
  s.lineTo(-w * 0.8, h * 0.9);
  s.moveTo(w * 0.8, -h * 0.9);
  s.lineTo(w * 0.8, h * 0.9);

  return s;
}

// ================== ✨ UNIQUE ABILITY POWER-UPS ==================

// Jetpack removed

/**
 * 🛹 Hoverboard - Board shape with rounded edges
 */
export function createHoverboardGeometry() {
  // Rounded box for board
  const geometry = new THREE.BoxGeometry(0.8, 0.12, 1.2);
  return geometry;
}

/**
 * ⚡ Lightning Dash - Energy crystal
 */
export function createLightningGeometry() {
  // Dodecahedron for energy crystal
  const geometry = new THREE.DodecahedronGeometry(0.5, 0);
  return geometry;
}

/**
 * Create enhanced material for unique abilities
 */
export function createAbilityMaterial(color, emissiveColor, emissiveIntensity = 1.5) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: emissiveColor,
    emissiveIntensity: emissiveIntensity,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });
}

/**
 * Create pulsing glow point light for power-ups
 */
export function createPowerUpLight(color, intensity = 2, distance = 5) {
  const light = new THREE.PointLight(color, intensity, distance);
  light.castShadow = false;
  return light;
}

/**
 * Create rotating particle ring around power-up
 */
export function createPowerUpRing(color) {
  const particleCount = 20;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorObj = new THREE.Color(color);
  const radius = 0.6;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    colors[i * 3] = colorObj.r;
    colors[i * 3 + 1] = colorObj.g;
    colors[i * 3 + 2] = colorObj.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  return points;
}

/**
 * Animate power-up with float and rotation
 */
export function animatePowerUp(powerUp, deltaTime, elapsedTime) {
  if (!powerUp || !powerUp.visible || !powerUp.active) return;

  // Float animation
  const floatSpeed = 2;
  const floatAmplitude = 0.2;
  const baseY = powerUp.userData.baseY || 1.5;
  powerUp.position.y = baseY + Math.sin(elapsedTime * floatSpeed) * floatAmplitude;

  // Rotation animation
  powerUp.rotation.y += deltaTime * 2;

  // Pulse scale for unique abilities
  if (powerUp.userData.type === 'hoverboard' || powerUp.userData.type === 'lightning') {
    const pulseSpeed = 3;
    const pulseScale = 0.1;
    const scale = 1 + Math.sin(elapsedTime * pulseSpeed) * pulseScale;
    powerUp.scale.set(scale, scale, scale);
  }

  // Rotate particle ring if exists
  const ring = powerUp.getObjectByName('particleRing');
  if (ring) {
    ring.rotation.y += deltaTime * 3;
  }
}

export default {
  createShieldShape,
  createZapShape,
  createMagnetShape,
  createHealthShape,
  createTimeShape,
  createHoverboardGeometry,
  createLightningGeometry,
  createAbilityMaterial,
  createPowerUpLight,
  createPowerUpRing,
  animatePowerUp
};
