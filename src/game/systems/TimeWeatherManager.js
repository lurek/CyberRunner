import * as THREE from "three";

// Reusable color objects to prevent GC spikes
const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

export class TimeWeatherManager {
  constructor(scene, lights, materialManager, sceneSetup) {
    this.scene = scene;
    this.lights = lights;
    this.materialManager = materialManager;
    this.sceneSetup = sceneSetup; // Reference to update sky

    // Configuration
    this.dayDuration = 120; // Seconds for a full 24h cycle
    this.currentTime = 0.0; // 0.0 to 1.0 (0 = Midnight, 0.5 = Noon)
    
    // Weather State
    this.weatherIntensity = 0; // 0 = Clear, 1 = Storm
    this.targetWeatherIntensity = 0;
    this.lightningTimer = 0;

    // --- TIME STATES (The "Keyframes") ---
    this.timeStates = [
      { // 0.0 - NIGHT (Midnight)
        time: 0.0,
        skyTop: 0x000000, skyBot: 0x0f1520,
        fog: 0x0f1520,
        hemiSky: 0x111122, hemiGnd: 0x000000,
        dirColor: 0x4466ff, dirInt: 1.5,
        rainProb: 0.8
      },
      { // 0.25 - DAWN (Sunrise)
        time: 0.25,
        skyTop: 0x201030, skyBot: 0xffaa44, // Purple to Orange
        fog: 0xffaa44,
        hemiSky: 0xffccaa, hemiGnd: 0x332222,
        dirColor: 0xffddaa, dirInt: 1.8,
        rainProb: 0.2
      },
      { // 0.5 - DAY (Noon)
        time: 0.5,
        skyTop: 0x0066ff, skyBot: 0xaaccff, // Blue
        fog: 0xaaccff,
        hemiSky: 0xffffff, hemiGnd: 0x444444,
        dirColor: 0xffffff, dirInt: 2.5,
        rainProb: 0.0
      },
      { // 0.75 - DUSK (Sunset)
        time: 0.75,
        skyTop: 0x1a0525, skyBot: 0xff4422, // Deep Purple to Red
        fog: 0xff4422,
        hemiSky: 0xff5500, hemiGnd: 0x221111,
        dirColor: 0xffaa00, dirInt: 1.5,
        rainProb: 0.3
      },
      { // 1.0 - NIGHT (Wrap)
        time: 1.0,
        skyTop: 0x000000, skyBot: 0x0f1520,
        fog: 0x0f1520,
        hemiSky: 0x111122, hemiGnd: 0x000000,
        dirColor: 0x4466ff, dirInt: 1.5,
        rainProb: 0.8
      }
    ];
  }

  update(deltaTime) {
    // 1. Advance Time
    this.currentTime += deltaTime / this.dayDuration;
    if (this.currentTime >= 1.0) this.currentTime = 0.0;

    // 2. Find Current State & Blend Factor
    let stateA = this.timeStates[0];
    let stateB = this.timeStates[1];
    
    for (let i = 0; i < this.timeStates.length - 1; i++) {
      if (this.currentTime >= this.timeStates[i].time && this.currentTime < this.timeStates[i+1].time) {
        stateA = this.timeStates[i];
        stateB = this.timeStates[i+1];
        break;
      }
    }

    // Calculate Lerp Alpha (0.0 to 1.0 between states)
    const range = stateB.time - stateA.time;
    const alpha = (this.currentTime - stateA.time) / range;

    // 3. Apply Visuals (Efficient Lerping)
    this.applyTimeVisuals(stateA, stateB, alpha);

    // 4. Update Weather
    this.updateWeather(deltaTime, stateA, stateB, alpha);
  }

  applyTimeVisuals(stateA, stateB, alpha) {
    // --- FOG ---
    _c1.setHex(stateA.fog);
    _c2.setHex(stateB.fog);
    // Lerp fog color
    this.scene.fog.color.lerpColors(_c1, _c2, alpha);
    // Also lerp density slightly (thicker fog at night/morning)
    // Night/Dawn = denser (0.006), Day = lighter (0.003)
    const densityA = (stateA.time === 0.5) ? 0.002 : 0.006;
    const densityB = (stateB.time === 0.5) ? 0.002 : 0.006;
    this.scene.fog.density = THREE.MathUtils.lerp(densityA, densityB, alpha);

    // --- LIGHTS ---
    if (this.lights) {
      // Hemisphere Sky
      _c1.setHex(stateA.hemiSky);
      _c2.setHex(stateB.hemiSky);
      this.lights.hemiLight.color.lerpColors(_c1, _c2, alpha);

      // Hemisphere Ground
      _c1.setHex(stateA.hemiGnd);
      _c2.setHex(stateB.hemiGnd);
      this.lights.hemiLight.groundColor.lerpColors(_c1, _c2, alpha);

      // Directional (Sun/Moon)
      _c1.setHex(stateA.dirColor);
      _c2.setHex(stateB.dirColor);
      this.lights.dirLight.color.lerpColors(_c1, _c2, alpha);
      this.lights.dirLight.intensity = THREE.MathUtils.lerp(stateA.dirInt, stateB.dirInt, alpha);
    }

    // --- SKY GRADIENT ---
    // We pass the interpolated colors to SceneSetup to redraw the canvas
    _c1.setHex(stateA.skyTop);
    _c2.setHex(stateB.skyTop);
    const topColor = _c1.clone().lerp(_c2, alpha);

    _c1.setHex(stateA.skyBot);
    _c2.setHex(stateB.skyBot);
    const botColor = _c1.clone().lerp(_c2, alpha);

    // Perform the canvas update
    this.sceneSetup.updateSky(topColor, botColor);
  }

  updateWeather(deltaTime, stateA, stateB, alpha) {
    // Probabilistic weather changes
    const rainProb = THREE.MathUtils.lerp(stateA.rainProb, stateB.rainProb, alpha);
    
    // Simple weather state machine
    if (Math.random() < 0.001) { // Small chance to change weather every frame
       this.targetWeatherIntensity = Math.random() < rainProb ? 1.0 : 0.0;
    }

    // Smoothly transition weather intensity
    this.weatherIntensity += (this.targetWeatherIntensity - this.weatherIntensity) * deltaTime * 0.5;

    // Apply to Material Manager (Wet roads)
    if (this.materialManager) {
      this.materialManager.setWetness(this.weatherIntensity);
    }

    // Apply to Rain System (SceneSetup helper)
    if (this.sceneSetup.rainSystem) {
      this.sceneSetup.setRainIntensity(this.weatherIntensity);
    }

    // Lightning (Only during heavy storm/night)
    if (this.weatherIntensity > 0.8 && this.lights) {
      this.lightningTimer -= deltaTime;
      if (this.lightningTimer <= 0) {
        this.triggerLightning();
        this.lightningTimer = Math.random() * 5 + 2; // Next strike in 2-7 seconds
      }
    }
  }

  triggerLightning() {
    // Flash effect
    const flashIntensity = 5.0;
    const oldIntensity = this.lights.dirLight.intensity;
    const oldColor = this.lights.dirLight.color.clone();

    this.lights.dirLight.intensity = flashIntensity;
    this.lights.dirLight.color.setHex(0xffffff); // White flash

    // Reset after 100ms
    setTimeout(() => {
      this.lights.dirLight.intensity = oldIntensity;
      this.lights.dirLight.color.copy(oldColor);
    }, 100);
  }
}