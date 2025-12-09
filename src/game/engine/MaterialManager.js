import * as THREE from "three";
import { getWindowTexture } from "../../utils/windowTexture.js";

export class MaterialManager {
  constructor(envMap = null, isHighQuality = true) {
    this.materials = [];
    this.geometries = [];
    this.envMap = envMap;
    this.isHighQuality = isHighQuality;

    this.texBlue = getWindowTexture("00ffff", { windowSize: 2, litProbability: 0.6, hasNeonStrip: true });
    this.texPink = getWindowTexture("ff00ff", { windowSize: 2, litProbability: 0.6, hasNeonStrip: false });
    this.texGold = getWindowTexture("ffccaa", { windowSize: 2, litProbability: 0.5, hasNeonStrip: true });
    this.texWhite = getWindowTexture("ffffff", { windowSize: 2, litProbability: 0.7, hasNeonStrip: false });

    [this.texBlue, this.texPink, this.texGold, this.texWhite].forEach(tex => {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 8);
      tex.needsUpdate = true;
    });

    this.roadTexture = this.createRoadTexture();

    // Keep track of road material for dynamic updates
    this.roadMaterial = null;
  }

  createRoadTexture() {
    const canvas = document.createElement('canvas');
    // ✅ OPTIMIZATION: 512x512 for low-end devices
    const size = this.isHighQuality ? 1024 : 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // ✅ VIBRANT: Dark purple-blue base instead of pure black
    const baseGradient = ctx.createLinearGradient(0, 0, 1024, 0);
    baseGradient.addColorStop(0, '#0a0515');
    baseGradient.addColorStop(0.5, '#0f0a1a');
    baseGradient.addColorStop(1, '#0a0515');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // ✅ VIBRANT: More visible reflective streaks
    ctx.fillStyle = 'rgba(80, 120, 200, 0.06)';
    for (let i = 0; i < 25; i++) {
      const y = Math.random() * 1024;
      const h = Math.random() * 25 + 15;
      ctx.fillRect(0, y, 1024, h);
    }

    // ✅ VIBRANT: Much brighter, thicker neon lane lines with stronger glow
    ctx.shadowBlur = 40;
    ctx.lineWidth = 14;

    // Magenta/Pink lane line (left)
    ctx.shadowColor = '#ff00ff';
    ctx.strokeStyle = '#ff44ff';
    ctx.beginPath();
    ctx.moveTo(340, 0);
    ctx.lineTo(340, 1024);
    ctx.stroke();

    // Extra glow pass
    ctx.shadowBlur = 60;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ff88ff';
    ctx.stroke();

    // Cyan lane line (right)
    ctx.shadowBlur = 40;
    ctx.lineWidth = 14;
    ctx.shadowColor = '#00ffff';
    ctx.strokeStyle = '#44ffff';
    ctx.beginPath();
    ctx.moveTo(684, 0);
    ctx.lineTo(684, 1024);
    ctx.stroke();

    // Extra glow pass
    ctx.shadowBlur = 60;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#88ffff';
    ctx.stroke();

    // ✅ VIBRANT: Add center dashed line for more visual interest
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffffff';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([40, 60]);
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();
    ctx.setLineDash([]);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 16;

    return texture;
  }

  createBuildingMaterials() {
    const commonOpts = {
      color: 0x080810, // ✅ VIBRANT: Slightly brighter base
      metalness: 0.9,
      roughness: 0.1,
      envMap: this.envMap,
      envMapIntensity: 2.0 // ✅ VIBRANT: More reflective
    };

    // ✅ OPTIMIZATION: Use cheaper Lambert material for low-end
    const MatClass = this.isHighQuality ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;

    const matCyan = new MatClass({ ...commonOpts, map: this.texBlue, emissive: 0x006666, emissiveMap: this.texBlue, emissiveIntensity: 5.0 });
    const matPink = new MatClass({ ...commonOpts, map: this.texPink, emissive: 0x660066, emissiveMap: this.texPink, emissiveIntensity: 5.0 });
    const matGold = new MatClass({ ...commonOpts, map: this.texGold, emissive: 0x664422, emissiveMap: this.texGold, emissiveIntensity: 4.0 });
    const matSilver = new MatClass({ ...commonOpts, map: this.texWhite, emissive: 0x445566, emissiveMap: this.texWhite, emissiveIntensity: 5.0 });

    this.materials.push(matCyan, matPink, matGold, matSilver);
    return { default: [matCyan, matPink, matGold, matSilver] };
  }

  createGroundMaterial() {
    // ✅ OPTIMIZATION: Use cheaper Lambert material for low-end
    const MatClass = this.isHighQuality ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;

    const groundMaterial = new MatClass({
      map: this.roadTexture,
      emissive: 0xffffff,
      emissiveMap: this.roadTexture,
      emissiveIntensity: 2.0,  // ✅ VIBRANT: Brighter road glow
      color: 0xffffff,
      roughness: 0.0,
      metalness: 1.0,
      envMap: this.envMap,
      envMapIntensity: this.isHighQuality ? 2.5 : 1.0 // Reduce reflection intensity on low-end
    });
    this.materials.push(groundMaterial);
    this.roadMaterial = groundMaterial; // Store ref
    return groundMaterial;
  }

  // ✅ NEW: Dynamic wetness update
  setWetness(intensity) {
    if (this.roadMaterial) {
      // Roughness goes from 0.0 (wet) to 0.6 (dry) based on rain intensity
      // Intensity 1 = Roughness 0.0
      // Intensity 0 = Roughness 0.6
      const targetRoughness = 0.6 * (1.0 - intensity);

      // Lerp for smoothness
      this.roadMaterial.roughness += (targetRoughness - this.roadMaterial.roughness) * 0.05;

      // Also adjust reflection intensity (drier = less reflection)
      const targetEnvMap = 1.0 + intensity * 1.0; // 1.0 to 2.0
      this.roadMaterial.envMapIntensity += (targetEnvMap - this.roadMaterial.envMapIntensity) * 0.05;
    }
  }

  createThemes(buildingMaterials) {
    return [{
      fogColor: new THREE.Color(0x020408),
      gridColor: new THREE.Color(0xff00ff),
      buildingMaterials: buildingMaterials.default
    }];
  }

  dispose() {
    this.materials.forEach(m => m.dispose());
    this.geometries.forEach(g => g.dispose());
    if (this.texBlue) this.texBlue.dispose();
    if (this.texPink) this.texPink.dispose();
    if (this.texGold) this.texGold.dispose();
    if (this.texWhite) this.texWhite.dispose();
    if (this.roadTexture) this.roadTexture.dispose();
    this.materials = [];
    this.geometries = [];
  }
}