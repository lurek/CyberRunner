import * as THREE from "three";

// Store reference to the canvas texture context for updates
let skyContext = null;
let skyTexture = null;
let activeRainSystem = null;

export function createScene(theme) {
  const scene = new THREE.Scene();

  // 1. Create Sky Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  skyContext = canvas.getContext('2d');

  // ✅ VIBRANT: More colorful night sky with deep blues and purples
  updateSkyGradient(skyContext, '#0a0520', '#1a1040'); // Deep purple-blue gradient

  skyTexture = new THREE.CanvasTexture(canvas);
  skyTexture.minFilter = THREE.LinearFilter;
  skyTexture.magFilter = THREE.LinearFilter;
  scene.background = skyTexture;

  // ✅ VIBRANT: Less dense fog with more colorful tint
  scene.fog = new THREE.FogExp2(0x1a1035, 0.003); // Purple-tinted fog, less dense

  return scene;
}

// ✅ NEW: Efficiently redraw the sky canvas
function updateSkyGradient(ctx, topColor, botColor) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, botColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);
}

// ✅ NEW: Exported helper for Manager to call
export const sceneHelpers = {
  updateSky: (colorTop, colorBot) => {
    if (skyContext && skyTexture) {
      const top = `#${colorTop.getHexString()}`;
      const bot = `#${colorBot.getHexString()}`;
      updateSkyGradient(skyContext, top, bot);
      skyTexture.needsUpdate = true;
    }
  },
  setRainIntensity: (intensity) => {
    if (activeRainSystem) {
      activeRainSystem.material.opacity = intensity * 0.6;
      activeRainSystem.visible = intensity > 0.01;
    }
  },
  rainSystem: null // Will be set by createRainSystem
};


export function createCamera() {
  // ✨ SUBWAY SURFERS STYLE: FOV 60 for wider view, closer side perspective
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 2, -10);
  return camera;
}

export function createRenderer(isHighQuality) {
  const renderer = new THREE.WebGLRenderer({
    antialias: isHighQuality, // ✅ OPTIMIZATION: Disable AA on low-end
    alpha: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // ✅ OPTIMIZATION: Cap DPR at 1.0 for low-end to save massive fill-rate
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHighQuality ? 2 : 1));
  renderer.shadowMap.enabled = isHighQuality;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8; // ✅ VIBRANT: Higher exposure for brighter visuals

  return renderer;
}

export function createLights(scene, isHighQuality) {
  // ✅ VIBRANT: Brighter hemisphere light with colorful sky/ground
  const hemiLight = new THREE.HemisphereLight(0x6688ff, 0x221144, 1.2);
  scene.add(hemiLight);

  // ✅ VIBRANT: Brighter directional light
  const dirLight = new THREE.DirectionalLight(0xddeeff, 3.0);
  dirLight.position.set(10, 50, 10);
  dirLight.castShadow = isHighQuality;
  if (isHighQuality) {
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.bias = -0.0005;
  }
  scene.add(dirLight);

  // ✅ VIBRANT: Brighter ambient light with purple tint
  const ambientLight = new THREE.AmbientLight(0x443366, 0.8);
  scene.add(ambientLight);

  // ✅ VIBRANT: Much brighter neon accent lights
  const pinkLight = new THREE.DirectionalLight(0xff44ff, 2.0);
  pinkLight.position.set(-30, 10, -10);
  scene.add(pinkLight);

  const cyanLight = new THREE.DirectionalLight(0x44ffff, 2.0);
  cyanLight.position.set(30, 10, -10);
  scene.add(cyanLight);

  return { hemiLight, dirLight, ambientLight, pinkLight, cyanLight };
}

export function createRainSystem(camera, constants, isHighQuality) {
  // ✅ OPTIMIZATION: Reduce particle count significantly for low-end
  const rainCount = isHighQuality ? 4000 : 200;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  const rainVelocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 100;
    rainPositions[i * 3 + 1] = Math.random() * 80;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    rainVelocities[i] = 40 + Math.random() * 20;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainGeo.userData = { velocities: rainVelocities };

  const rainMat = new THREE.PointsMaterial({
    color: 0xeeffff,
    size: 0.25,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const rain = new THREE.Points(rainGeo, rainMat);
  rain.position.set(0, 20, -20);
  rain.visible = false; // Default to false, controlled by TimeWeatherManager
  if (isHighQuality) camera.add(rain); // Only add to scene/camera if high quality to save draw calls

  // Store reference for TimeManager
  activeRainSystem = rain;
  sceneHelpers.rainSystem = rain; // Export for manager

  return { rain, rainGeo, rainMat };
}

export function updateRain(rain, constants, deltaTime) {
  if (!rain.visible) return;
  const positions = rain.geometry.attributes.position;
  const velocities = rain.geometry.userData.velocities;

  for (let i = 0; i < positions.count; i++) {
    positions.array[i * 3 + 1] -= velocities[i] * deltaTime;
    if (positions.array[i * 3 + 1] < 0) {
      positions.array[i * 3 + 1] = 80;
    }
  }
  positions.needsUpdate = true;
}

export function createEnvironmentMap(renderer) {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    colorSpace: THREE.SRGBColorSpace
  });
  const cubeCamera = new THREE.CubeCamera(1, 2000, cubeRenderTarget);
  return { cubeCamera, renderTarget: cubeRenderTarget };
}