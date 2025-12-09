import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Optimized Chromatic Aberration Shader
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.002 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 offset = amount * vec2(1.0, 0.0);
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cga = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
    }
  `,
};

// ✅ PHASE 1.1: New Radial Blur Shader for "Speed Lines"
const RadialBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.0 }, // 0.0 to ~0.03
    center: { value: new THREE.Vector2(0.5, 0.5) },
    timeSlow: { value: 0.0 }, // ✅ PHASE 5.1: Add time slow uniform
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define SAMPLES 8
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform vec2 center;
    varying vec2 vUv;
    uniform float timeSlow;

    void main() {
      if (strength == 0.0 && timeSlow == 0.0) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      vec2 dir = vUv - center;
      float dist = length(dir);
      vec4 color = texture2D(tDiffuse, vUv);
      float step = strength * 0.01 * (1.0 - dist); // Blur more at edges

      for (int i = 0; i < SAMPLES; i++) {
        float s = float(i) / float(SAMPLES - 1);
        color += texture2D(tDiffuse, vUv + dir * s * step);
      }
      color /= float(SAMPLES + 1);

      // ✅ PHASE 5.1: Time Slow Effect (blue tint & vignette)
      if (timeSlow > 0.0) {
        float vignette = 1.0 - smoothstep(0.0, 1.0, dist * 1.5);
        vec3 blueTint = vec3(0.7, 0.8, 1.0);
        color.rgb = mix(color.rgb, blueTint, timeSlow * 0.3 * vignette);
        color.rgb = mix(color.rgb, vec3(1.0), timeSlow * 0.1); // Slight desaturation/brightness
      }

      gl_FragColor = color;
    }
  `,
};

export class PostProcessingManager {
  constructor(renderer, scene, camera, isHighQuality = true) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = isHighQuality;

    if (!this.enabled) return;

    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Bloom
    // ✅ UPDATED: Initial values tuned for high-quality character glow
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,   // Strength (Increased from 0.4)
      0.4,   // Radius (Increased from 0.3)
      0.7    // Threshold (Lowered from 0.85) - Allows darker materials to glow
    );
    this.composer.addPass(this.bloomPass);

    // Chromatic aberration
    this.chromaPass = new ShaderPass(ChromaticAberrationShader);
    this.chromaPass.enabled = true;
    this.composer.addPass(this.chromaPass);

    // Radial Blur pass
    this.radialBlurPass = new ShaderPass(RadialBlurShader);
    this.radialBlurPass.enabled = false;
    this.composer.addPass(this.radialBlurPass);

    console.log('✨ Post-Processing initialized with Bloom, Chroma, and Radial Blur');
  }

  update(speedProgress, multiplier, shieldActive, deltaTime = 0, currentFPS = 60, isTimeSlowActive = false, energyIntensity = 0) {
    if (!this.enabled || !this.composer) return;

    // Dynamic effects based on game state
    const speedFactor = Math.pow(speedProgress, 1.5);

    // ✅ PHASE 5.4: Energy Mode overrides normal visual effects
    const isEnergyMode = energyIntensity > 0;

    // Bloom
    if (this.bloomPass) {
      // ✅ PHASE 5.4: Energy Mode increases bloom dramatically
      const energyBloomBoost = isEnergyMode ? (1.0 + energyIntensity * 0.5) : 1.0;

      // ✅ UPDATED: Stronger baseline strength for character neon (0.6 base)
      this.bloomPass.strength = (0.6 + (speedFactor * 0.2)) * energyBloomBoost;

      // ✅ UPDATED: Slightly wider radius for "soft" glow feel (0.4 base)
      this.bloomPass.radius = 0.4 + (speedFactor * 0.1) + (energyIntensity * 0.1);

      // ✅ UPDATED: Lower threshold (0.7) is critical for the new "Speed Demon" model materials
      // to actually glow. 0.85 was too high for the 0x1a1a1a materials.
      this.bloomPass.threshold = isEnergyMode ? 0.6 : (shieldActive ? 0.65 : 0.7);
    }

    // Chromatic aberration
    if (this.chromaPass) {
      // Energy Mode adds extra chromatic aberration
      const energyChromaBoost = isEnergyMode ? (energyIntensity * 0.002) : 0;
      this.chromaPass.uniforms.amount.value = 0.001 + (speedFactor * 0.003) + energyChromaBoost;
      this.chromaPass.enabled = speedProgress > 0.3 || isEnergyMode;
    }

    // Radial Blur
    if (this.radialBlurPass) {
      // Energy Mode multiplies blur strength
      const energyBlurBoost = isEnergyMode ? (1.0 + energyIntensity * 1.0) : 1.0;
      this.radialBlurPass.uniforms.strength.value = speedFactor * 0.03 * energyBlurBoost;

      // Update time slow effect
      const targetTimeSlow = isTimeSlowActive ? 1.0 : 0.0;
      this.radialBlurPass.uniforms.timeSlow.value += (targetTimeSlow - this.radialBlurPass.uniforms.timeSlow.value) * 0.1;

      this.radialBlurPass.enabled = speedProgress > 0.4 || isTimeSlowActive || isEnergyMode;
    }
  }

  render() {
    if (!this.enabled || !this.composer) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.composer.render();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.composer) {
      // When disabling, make sure we render normally
      this.renderer.render(this.scene, this.camera);
    }
  }

  resize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
      if (this.bloomPass) {
        this.bloomPass.resolution.set(width, height);
      }
    }
  }
  setTimeSlowEffect(active, intensity = 0.8) {
    if (!this.enabled) return;

    if (active) {
      console.log('🎨 Time slow visual ON');
      if (this.chromaPass) {
        this.chromaPass.uniforms.amount.value = intensity * 0.003;
      }
      if (this.bloomPass) {
        this.bloomPass.strength = 2.0 + intensity;
        this.bloomPass.threshold = 0.3;
      }
    } else {
      console.log('🎨 Time slow visual OFF');
      if (this.chromaPass) {
        this.chromaPass.uniforms.amount.value = 0.001;
      }
      if (this.bloomPass) {
        this.bloomPass.strength = 1.0;
        this.bloomPass.threshold = 0.5;
      }
    }
  }

  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
  }
}