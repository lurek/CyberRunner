/**
 * GameEngine_ENHANCED.jsx
 * ✅ PHASE 1.7 - INTEGRATED UNIQUE ABILITIES SYSTEM
 * 
 * Enhanced with Jetpack, Hoverboard, and Lightning Dash abilities
 * Version: 2.0 with full ability integration
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { CONSTANTS } from "../utils/constants.js";
import { PostProcessingManager } from "../effects/PostProcessing.js";
import { PlayerTrail, CoinSparkles, PowerUpAura, TemporaryParticleSystem } from "../effects/EnhancedParticles.js";
import { FlyingVehicles, VolumetricBeams } from "../effects/EnvironmentalEffects.js";
import { MaterialManager } from "./engine/MaterialManager.js";
import { createScene, createCamera, createRenderer, createLights, createRainSystem, updateRain, createEnvironmentMap, sceneHelpers } from "./engine/SceneSetup.js";
import { WorldBuilder } from "./engine/WorldBuilder.js";
import { WorldRecycler } from "./engine/WorldRecycler.js";
import { PlayerController } from "./engine/PlayerController.js";
import { EntitySpawner } from "./engine/EntitySpawner.js";
import { CollisionManager } from "./engine/CollisionManager.js";
import { InputHandler } from "./controls/InputHandler.js";
import { DifficultyManager } from "./systems/DifficultyManager.js";
import { ComboSystem } from "./systems/ComboSystem.js";
import { ObstaclePatterns, RiskRewardPatterns } from "./systems/PatternGenerator.js";
import { BossManager } from "./systems/BossManager.js";
import { EventManager } from "./systems/EventManager.js";
import { EnergyModeManager } from "./systems/EnergyModeManager.js";
import { GrapplingHookManager } from "./systems/GrapplingHookManager.js";
import { JumpSafetySystem } from "./systems/safety/JumpSafetySystem.js";
import { DangerIndicators } from "./systems/safety/DangerIndicators.js"; // ✅ PHASE 0.7
import { getCharacterStatsManager } from "./systems/CharacterStatsManager.js";
import { TimeWeatherManager } from "./systems/TimeWeatherManager.js";
import { AbilityManager } from "./systems/AbilityManager.js";
import { HoverboardSystem, LightningDashSystem, ShieldAbilitySystem, SpeedBoostAbilitySystem, TimeSlowAbilitySystem } from "./systems/UniqueFeatures.jsx";
import audioManager from '../utils/audio/AudioManager.js';
import { analytics } from '../utils/analytics/AnalyticsManager.js';

import { GLBPlayerSystem } from "./models/GLBPlayerSystem.js";
import { CHARACTERS } from "../utils/constants.js";

const getCharacterPath = (selectedCharacter) => {
  if (!selectedCharacter) return '/Main_Character.glb';
  const character = CHARACTERS[selectedCharacter];
  return character?.modelPath || '/Main_Character.glb';
};

export default React.memo(function GameEngine({
  menuState,
  musicOn,
  sfxOn,
  isHighQuality,
  startHealth,
  onGameOver,
  onStatsUpdate,
  onPowerUp,
  shieldActive,
  multiplier,
  isMagnetActive,
  isTimeSlowActive,
  onReady,
  selectedCharacter,
  // ✨ NEW: Ability callbacks
  onAbilityStatesUpdate,
  reviveTrigger = 0 // ✨ NEW: Trigger for revive
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef(null);
  const playerSystemRef = useRef(null);

  const [debugStatus, setDebugStatus] = useState("Initializing...");

  const clockRef = useRef(new THREE.Clock());
  const startGracePeriodRef = useRef(0.8);

  const materialManagerRef = useRef(null);
  const worldBuilderRef = useRef(null);
  const worldRecyclerRef = useRef(null);
  const playerControllerRef = useRef(null);
  const entitySpawnerRef = useRef(null);
  const collisionManagerRef = useRef(null);
  const inputHandlerRef = useRef(null);
  const difficultyManagerRef = useRef(null);
  const comboSystemRef = useRef(null);
  const patternGeneratorRef = useRef(null);
  const bossManagerRef = useRef(null);
  const eventManagerRef = useRef(null);
  const energyModeManagerRef = useRef(null);
  const grappleManagerRef = useRef(null);
  const jumpSafetySystemRef = useRef(null);
  const dangerIndicatorsRef = useRef(null); // ✅ PHASE 0.7: Visual warnings
  const characterStatsManagerRef = useRef(null);
  const timeWeatherManagerRef = useRef(null);
  const abilitiesRef = useRef(null); // ✨ NEW: Unified ability system manager

  // ✨ NEW: Ability system refs
  const hoverboardRef = useRef(null);
  const lightningRef = useRef(null);

  const memoryMonitorRef = useRef(null);
  const timeSlowRef = useRef({
    active: false,
    duration: 0,
    cooldown: 0
  });
  // Time slow configuration
  const TIME_SLOW_CONFIG = {
    duration: 5000, // 5 seconds
    timeScale: 0.5, // 50% speed (game runs at half speed)
    cooldown: 20000, // 20 seconds
    visualIntensity: 0.8
  };

  const postProcessingRef = useRef(null);
  const playerTrailRef = useRef(null);
  const coinSparklesRef = useRef(null);
  const powerUpAurasRef = useRef(null);
  const flyingVehiclesRef = useRef(null);
  const volumetricBeamsRef = useRef(null);
  const rainRef = useRef(null);
  const particleSystemRef = useRef(null);
  const cubeCameraRef = useRef(null);
  const cubeRenderTargetRef = useRef(null);

  const gameStatsRef = useRef({ score: 0, distance: 0, coins: 0, health: 100 });
  const speedRef = useRef(CONSTANTS.GAME.BASE_SPEED);
  const currentThemeIndexRef = useRef(0);
  const themesRef = useRef([]);
  const worldElementsRef = useRef(null);
  const allEntitiesRef = useRef(null);
  const timeScaleRef = useRef(1.0);
  const cameraShakeRef = useRef({ time: 0, intensity: 0 });
  const fpsCounterRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const currentFpsRef = useRef(60);
  const lastStatsUpdateRef = useRef(0);
  const milestonesRef = useRef(new Set()); // ✅ FIX #2: Track reached milestones for analytics
  const spawnAccumulatorRef = useRef({
    obstacle: 0,
    coin: 0,
    powerUp: 0,
    obstacleInterval: 2.2,
    coinInterval: 1.8,
    powerUpInterval: 8.0,
    hoverboardCheck: 0  // ✨ NEW: Track hoverboard spawn intervals
  });

  const propsRef = useRef({
    menuState,
    musicOn,
    sfxOn,
    isHighQuality,
    startHealth,
    onGameOver,
    onStatsUpdate,
    onPowerUp,
    shieldActive,
    multiplier,
    isMagnetActive,
    isTimeSlowActive,
    onReady,
    selectedCharacter,
    onAbilityStatesUpdate
  });
  const sfxEnabledRef = useRef(true);

  useEffect(() => {
    propsRef.current = {
      menuState,
      musicOn,
      sfxOn,
      isHighQuality,
      startHealth,
      onGameOver,
      onStatsUpdate,
      onPowerUp,
      shieldActive,
      multiplier,
      isMagnetActive,
      isTimeSlowActive,
      onReady,
      selectedCharacter,
      onAbilityStatesUpdate
    };
    sfxEnabledRef.current = sfxOn;
  }, [menuState, musicOn, sfxOn, isHighQuality, startHealth, onGameOver, onStatsUpdate, onPowerUp, shieldActive, multiplier, isMagnetActive, isTimeSlowActive, onReady, selectedCharacter, onAbilityStatesUpdate]);

  // ✅ FIX: Separate useEffect for startGracePeriod - only reset when menuState changes to 'playing'
  // This prevents the grace period from being reset every time other props update
  useEffect(() => {
    if (menuState === 'playing') {
      startGracePeriodRef.current = 0.8;
      console.log('🎮 Game started - grace period set to 0.8s');
    }
  }, [menuState]);

  const triggerCameraShake = useCallback((intensity) => {
    cameraShakeRef.current.time = 0.4;
    cameraShakeRef.current.intensity = intensity * 0.8;
  }, []);



  // ✨ NEW: Lightning Dash activation callback
  const handleLightningActivate = useCallback(() => {
    if (!lightningRef.current || propsRef.current.menuState !== 'playing' || !playerRef.current) {
      console.log("⚡ Lightning: Cannot activate - not in playing state");
      return;
    }

    const result = lightningRef.current.activate(playerRef.current.position);
    if (result && result.success) {
      console.log("⚡ Lightning: Dash activated! Teleporting to", result.targetZ);
      audioManager.play('lightning_activation');

      // ✅ FIX #2: Track ability usage
      analytics.trackAbilityUsed('lightning_dash', gameStatsRef.current.distance);

      // Teleport player
      playerRef.current.position.z = result.targetZ;

      // Grant temporary invincibility
      if (collisionManagerRef.current && collisionManagerRef.current.setTemporaryInvincibility) {
        collisionManagerRef.current.setTemporaryInvincibility(result.invincibilityDuration);
        console.log('✨ Invincibility granted for', result.invincibilityDuration, 'ms');
      }

      // Play ability animation
      if (playerSystemRef.current?.playAnimation) {
        playerSystemRef.current.playAnimation('boost');
      }

      // Camera shake for impact
      triggerCameraShake(0.5);
    } else {
      console.log("⚡ Lightning: On cooldown or already active");
    }
  }, [triggerCameraShake]);

  // 🛡️ NEW: Shield ability activation callback
  const handleShieldActivate = useCallback(() => {
    if (!abilitiesRef.current || propsRef.current.menuState !== 'playing' || !playerRef.current) {
      console.log("🛡️ Shield: Cannot activate - not in playing state");
      return;
    }

    const result = abilitiesRef.current.activate('shield', playerRef.current.position);
    if (result && result.success) {
      console.log("🛡️ Shield: Activated! Protection granted for", result.duration, "ms");
      audioManager.play('shield_activation');

      // ✅ FIX #2: Track ability usage
      analytics.trackAbilityUsed('shield', gameStatsRef.current.distance);

      // Play ability animation
      if (playerSystemRef.current?.playAnimation) {
        playerSystemRef.current.playAnimation('jump');
      }

      // Camera flash for feedback
      triggerCameraShake(0.3);
    } else {
      console.log("🛡️ Shield: On cooldown or already active");
    }
  }, [triggerCameraShake]);

  // ⚡ NEW: Speed boost ability activation callback
  const handleSpeedBoostActivate = useCallback(() => {
    if (!abilitiesRef.current || propsRef.current.menuState !== 'playing' || !playerRef.current) {
      console.log("⚡ Speed Boost: Cannot activate - not in playing state");
      return;
    }

    const result = abilitiesRef.current.activate('speedBoost', playerRef.current.position);
    if (result && result.success) {
      console.log("⚡ Speed Boost: Activated! Speed multiplier: 1.8x for", result.duration, "ms");
      audioManager.play('speed_boost_activation');

      // ✅ FIX #2: Track ability usage
      analytics.trackAbilityUsed('speed_boost', gameStatsRef.current.distance);

      // Play ability animation
      if (playerSystemRef.current?.playAnimation) {
        playerSystemRef.current.playAnimation('boost');
      }

      // Camera shake for impact
      triggerCameraShake(0.4);
    } else {
      console.log("⚡ Speed Boost: On cooldown or not enough charges");
    }
  }, [triggerCameraShake]);

  // ⏱️ NEW: Time slow ability activation callback
  const handleTimeSlowActivate = useCallback(() => {
    if (!abilitiesRef.current || propsRef.current.menuState !== 'playing' || !playerRef.current) {
      console.log("⏱️ Time Slow: Cannot activate - not in playing state");
      return;
    }

    // ✅ FIX: Check if already active or on cooldown using timeSlowRef
    if (timeSlowRef.current.active) {
      console.log("⏱️ Time Slow: Already active");
      return;
    }
    if (timeSlowRef.current.cooldown > 0) {
      console.log("⏱️ Time Slow: On cooldown", (timeSlowRef.current.cooldown / 1000).toFixed(1), 's');
      return;
    }

    const result = abilitiesRef.current.activate('timeSlow', playerRef.current.position);
    if (result && result.success) {
      console.log("⏱️ Time Slow: Activated! World speed reduced to 40% for", result.duration, "ms");
      audioManager.play('time_slow_activation');

      // ✅ FIX: CRITICAL - Also update timeSlowRef so game loop tracks the duration!
      timeSlowRef.current.active = true;
      timeSlowRef.current.duration = result.duration || TIME_SLOW_CONFIG.duration;
      timeScaleRef.current = TIME_SLOW_CONFIG.timeScale;

      // ✅ FIX #2: Track ability usage
      analytics.trackAbilityUsed('time_slow', gameStatsRef.current.distance);

      // Visual feedback from ability system
      if (postProcessingRef.current && postProcessingRef.current.setTimeSlowEffect) {
        postProcessingRef.current.setTimeSlowEffect(true, TIME_SLOW_CONFIG.visualIntensity);
      }
    } else {
      console.log("⏱️ Time Slow: On cooldown or already active");
    }
  }, []);

  // ⏱️ NEW: Time Slow Activation Handler
  const handleTimeSlowCollect = useCallback(() => {
    if (timeSlowRef.current.active) {
      console.log('⏱️ Time slow already active');
      return false;
    }
    if (timeSlowRef.current.cooldown > 0) {
      console.log('⏱️ Time slow on cooldown:', (timeSlowRef.current.cooldown / 1000).toFixed(1), 's');
      return false;
    }

    console.log('⏱️ TIME SLOW ACTIVATED - Game speed: 50%');
    timeSlowRef.current.active = true;
    timeSlowRef.current.duration = TIME_SLOW_CONFIG.duration;
    timeScaleRef.current = TIME_SLOW_CONFIG.timeScale;

    // Visual feedback
    if (postProcessingRef.current && postProcessingRef.current.setTimeSlowEffect) {
      postProcessingRef.current.setTimeSlowEffect(true, TIME_SLOW_CONFIG.visualIntensity);
    }

    return true;
  }, []);

  // ⏱️ NEW: Time Slow End Handler
  const handleTimeSlowEnd = useCallback(() => {
    console.log('⏱️ TIME SLOW ENDED - Game speed: 100%');
    timeSlowRef.current.active = false;
    timeSlowRef.current.cooldown = TIME_SLOW_CONFIG.cooldown;
    timeScaleRef.current = 1.0;

    if (postProcessingRef.current && postProcessingRef.current.setTimeSlowEffect) {
      postProcessingRef.current.setTimeSlowEffect(false, 0);
    }
  }, []);


  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    console.log("🎮 GameEngine: Initializing with abilities support...");

    // ✅ FIX #2: Track game start
    analytics.trackGameStart();

    const camera = createCamera();
    cameraRef.current = camera;

    const renderer = createRenderer(propsRef.current.isHighQuality);
    // Remove any existing canvas inside mount to avoid creating multiple WebGL contexts
    try {
      const existingCanvases = mount.querySelectorAll('canvas');
      if (existingCanvases && existingCanvases.length) {
        existingCanvases.forEach(c => {
          try { c.remove(); } catch (e) { console.warn('Could not remove existing canvas', e); }
        });
        console.log('Removed previous canvases from mount to avoid multiple contexts');
      }
    } catch (e) { }
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    // WebGL context handlers to detect and log context lost/restored
    const onContextLost = (e) => {
      try { e.preventDefault(); } catch (ignored) { }
      console.error('THREE.WebGLRenderer: Context Lost.', e);
      setDebugStatus('WebGL context lost');
    };
    const onContextRestored = (e) => {
      console.log('THREE.WebGLRenderer: Context Restored.', e);
      setDebugStatus('WebGL context restored');
      // Best-effort: reload to reinitialize renderer/resources
      try { window.location.reload(); } catch (ignored) { }
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);
    // keep references for cleanup
    rendererRef.current._contextHandlers = { onContextLost, onContextRestored };

    let envMapTexture = null;
    if (propsRef.current.isHighQuality) {
      const { cubeCamera, renderTarget } = createEnvironmentMap(renderer);
      cubeCameraRef.current = cubeCamera;
      cubeRenderTargetRef.current = renderTarget;
      envMapTexture = renderTarget.texture;
    }

    materialManagerRef.current = new MaterialManager(envMapTexture, propsRef.current.isHighQuality);
    const buildingMaterials = materialManagerRef.current.createBuildingMaterials();
    const groundMaterial = materialManagerRef.current.createGroundMaterial();
    themesRef.current = materialManagerRef.current.createThemes(buildingMaterials);

    const currentTheme = themesRef.current[currentThemeIndexRef.current];
    const scene = createScene(currentTheme);
    sceneRef.current = scene;

    if (envMapTexture) scene.environment = envMapTexture;

    const lights = createLights(scene, propsRef.current.isHighQuality);
    const { rain } = createRainSystem(camera, CONSTANTS, propsRef.current.isHighQuality);
    rainRef.current = rain;
    timeWeatherManagerRef.current = new TimeWeatherManager(scene, lights, materialManagerRef.current, sceneHelpers);

    // ✨ NEW: Initialize unified ability manager system
    console.log("✨ GameEngine: Initializing Ability Manager...");
    abilitiesRef.current = new AbilityManager(scene, CONSTANTS);
    // Expose for debugging
    window.gameAbilitiesRef = abilitiesRef.current;

    // ✨ NEW: Initialize ability systems

    // Hoverboard system removed
    hoverboardRef.current = null;

    console.log("⚡ GameEngine: Initializing Lightning Dash System...");
    lightningRef.current = new LightningDashSystem(scene, CONSTANTS);

    // ✅ OPTIMIZATION: Pass shadow config to player system
    playerSystemRef.current = new GLBPlayerSystem(scene, {
      showShadow: propsRef.current.isHighQuality
    });
    let isMounted = true;

    const characterPath = getCharacterPath(propsRef.current.selectedCharacter);
    // ✅ FIX: Pass character config for proper scaling
    const characterConfig = CHARACTERS[propsRef.current.selectedCharacter] || CHARACTERS.default;
    console.log("🚀 Engine: Loading character from " + characterPath, "with scale:", characterConfig.gameplayScale || 1.0);
    setDebugStatus("Loading Character...");

    playerSystemRef.current.load(characterPath, characterConfig).then((anchorGroup) => {
      if (!isMounted) return;
      console.log("✅ Engine: Character loaded!");
      setDebugStatus("Character Ready");

      playerRef.current = anchorGroup;
      playerRef.current.position.set(CONSTANTS.LANE_POSITIONS[1], CONSTANTS.PLAYER.BASE_HEIGHT, 0);
      playerRef.current.updateMatrixWorld(true);

      if (playerControllerRef.current) {
        playerControllerRef.current.player = playerRef.current;
      }


      // Hoverboard attachment removed

      if (propsRef.current.onReady) propsRef.current.onReady();
    }).catch(err => {
      console.error("Engine: Load Error", err);
      setDebugStatus("Load Failed: " + err.message);
    });

    coinSparklesRef.current = new CoinSparkles(scene);
    powerUpAurasRef.current = new PowerUpAura(scene);
    particleSystemRef.current = new TemporaryParticleSystem(scene);
    playerTrailRef.current = new PlayerTrail(scene, 0x5b8fc7);
    flyingVehiclesRef.current = new FlyingVehicles(scene);
    volumetricBeamsRef.current = new VolumetricBeams(scene);
    if (propsRef.current.isHighQuality) {
      postProcessingRef.current = new PostProcessingManager(renderer, scene, camera, true);
    }

    worldBuilderRef.current = new WorldBuilder(scene, materialManagerRef.current, CONSTANTS, propsRef.current.isHighQuality);
    worldBuilderRef.current.initializeLightPools();
    worldBuilderRef.current.createGround(currentTheme, groundMaterial);
    worldBuilderRef.current.createBuildings(currentTheme, volumetricBeamsRef.current);
    worldBuilderRef.current.createBillboards();
    worldElementsRef.current = worldBuilderRef.current.getWorldElements();

    difficultyManagerRef.current = new DifficultyManager(CONSTANTS);
    comboSystemRef.current = new ComboSystem(CONSTANTS);
    patternGeneratorRef.current = {
      obstacle: new ObstaclePatterns(CONSTANTS),
      riskReward: new RiskRewardPatterns(CONSTANTS)
    };
    bossManagerRef.current = new BossManager(CONSTANTS, scene);
    eventManagerRef.current = new EventManager(CONSTANTS, scene);
    energyModeManagerRef.current = new EnergyModeManager(CONSTANTS, scene);
    characterStatsManagerRef.current = getCharacterStatsManager();

    if (propsRef.current.selectedCharacter) {
      characterStatsManagerRef.current.setActiveCharacter(propsRef.current.selectedCharacter);
    }

    grappleManagerRef.current = new GrapplingHookManager(
      CONSTANTS,
      scene,
      characterStatsManagerRef.current
    );

    // ✅ PHASE 0.7: Initialize danger indicators first, then pass to jump safety
    dangerIndicatorsRef.current = new DangerIndicators(scene, CONSTANTS);
    jumpSafetySystemRef.current = new JumpSafetySystem(CONSTANTS, dangerIndicatorsRef.current);
    console.log("✅ Jump Safety System initialized with visual warnings");

    worldRecyclerRef.current = new WorldRecycler(CONSTANTS);

    playerControllerRef.current = new PlayerController(
      null,
      CONSTANTS,
      grappleManagerRef.current,
      jumpSafetySystemRef.current,
      characterStatsManagerRef.current
    );

    entitySpawnerRef.current = new EntitySpawner(
      scene,
      CONSTANTS,
      coinSparklesRef.current,
      powerUpAurasRef.current,
      difficultyManagerRef.current,
      patternGeneratorRef.current
    );

    collisionManagerRef.current = new CollisionManager(
      scene,
      CONSTANTS,
      comboSystemRef.current,
      timeScaleRef,
      triggerCameraShake,
      entitySpawnerRef.current,
      particleSystemRef.current,
      energyModeManagerRef.current,
      grappleManagerRef.current,
      jumpSafetySystemRef.current,
      characterStatsManagerRef.current,
      abilitiesRef.current, // ✨ Pass ability manager for shield checks
      playerControllerRef.current // ✅ FIX: Pass playerController for collision state checks
    );

    allEntitiesRef.current = entitySpawnerRef.current.getActiveEntities();
    gameStatsRef.current = {
      score: 0,
      distance: 0,
      coins: 0,
      health: propsRef.current.startHealth || 100
    };

    inputHandlerRef.current = new InputHandler({
      changeLane: (d) => propsRef.current.menuState === 'playing' && playerControllerRef.current.changeLane(d, sfxEnabledRef.current),
      jump: () => {
        if (propsRef.current.menuState === 'playing' && playerControllerRef.current.jump(sfxEnabledRef.current, speedRef.current)) {
          playerSystemRef.current?.playAnimation?.('jump');
        }
      },
      slide: () => {
        console.log('🔽 Slide triggered, menuState:', propsRef.current.menuState);
        if (propsRef.current.menuState === 'playing') {
          const slideResult = playerControllerRef.current.slide(sfxEnabledRef.current);
          console.log('🔽 Slide result:', slideResult);

          if (slideResult) {
            // Starting slide
            const slideAnimName = playerSystemRef.current?.getSlideAnimationName?.();

            if (slideAnimName) {
              // ✅ Has slide animation - play it
              console.log(`🎬 Playing slide animation: ${slideAnimName}`);
              playerSystemRef.current?.playAnimation?.(slideAnimName);
            } else {
              // ✅ No slide animation - use squeeze fallback
              console.log('🔽 No slide animation found, using squeeze fallback');
              playerSystemRef.current?.applySqueezeSlide?.();
            }
          } else {
            // Ending slide - remove squeeze if active
            if (playerSystemRef.current?.isInSqueezeSlide?.()) {
              playerSystemRef.current?.removeSqueezeSlide?.();
            }
          }
        }
      },
      grappleStart: () => propsRef.current.menuState === 'playing' && grappleManagerRef.current?.startTargeting(
        playerRef.current.position,
        allEntitiesRef.current.obstacles,
        allEntitiesRef.current.instancedObstacles,
        sfxEnabledRef.current
      ),
      grappleCycle: (d) => propsRef.current.menuState === 'playing' && grappleManagerRef.current?.cycleTarget(d, sfxEnabledRef.current),
      grappleConfirm: () => propsRef.current.menuState === 'playing' && grappleManagerRef.current?.confirmTarget(
        playerRef.current.position,
        sfxEnabledRef.current
      ),
      // ✨ NEW: Ability activation callbacks
      activateLightning: () => propsRef.current.menuState === 'playing' && handleLightningActivate(),
      activateShield: () => propsRef.current.menuState === 'playing' && handleShieldActivate(),
      activateSpeedBoost: () => propsRef.current.menuState === 'playing' && handleSpeedBoostActivate(),
      activateTimeSlow: () => propsRef.current.menuState === 'playing' && handleTimeSlowActivate()
    });

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      postProcessingRef.current?.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Try loading local sound assets first, fall back to web and cache via AudioManager
    const tryLoadLocalOrWeb = async (name, localPath, webUrl, isMusic = false) => {
      try {
        const resp = await fetch(localPath, { method: 'HEAD' });
        if (resp && resp.ok) {
          audioManager.loadSound(name, localPath, isMusic);
          return;
        }
      } catch (e) {
        // ignore and fall back to web
      }
      try {
        await audioManager.loadSoundFromWeb(name, webUrl, isMusic);
      } catch (e) {
        console.warn(`Failed to load audio '${name}' from web:`, e);
      }
    };

    (async () => {
      // ✅ FIXED: Load energetic cyberpunk background music with caching
      // Randomly select from available tracks for variety
      const musicTracks = CONSTANTS.GAME.MUSIC_TRACKS || [CONSTANTS.GAME.MUSIC_URL];
      const randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
      console.log('🎵 Loading background music:', randomTrack);
      await tryLoadLocalOrWeb('music', randomTrack, randomTrack, true);

      // ✅ FIX: Ensure music enabled state is set from props immediately
      if (propsRef.current) {
        audioManager.setMusicEnabled(propsRef.current.musicOn);
      }

      // Store music start function for later use when game starts
      window.__startGameMusic = () => {
        if (!propsRef.current.musicOn) return; // ✅ Check prop
        audioManager.play('music', { loop: true }).then(() => {
          console.log('🎵 Background music started!');
        }).catch(e => {
          console.warn('Music play failed, will retry on next interaction', e);
        });
      };

      // Attempt to play music; if autoplay policy prevents it, retry on first user gesture
      try {
        if (propsRef.current.musicOn) { // ✅ Check prop
          const playPromise = audioManager.play('music', { loop: true });
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(() => {
              console.log('🎵 Background music auto-started!');
            }).catch((err) => {
              console.log('⏸️ Audio auto-play blocked - will start on first game interaction');
              // Add multiple event listeners for different interaction types
              const resumeAudio = () => {
                if (!propsRef.current.musicOn) return; // double check
                audioManager.play('music', { loop: true }).then(() => {
                  console.log('🎵 Background music started after user interaction!');
                }).catch(e => console.warn('Retry play failed', e));
                window.removeEventListener('pointerdown', resumeAudio);
                window.removeEventListener('keydown', resumeAudio);
                window.removeEventListener('touchstart', resumeAudio);
                window.removeEventListener('click', resumeAudio);
              };
              window.addEventListener('pointerdown', resumeAudio, { once: true });
              window.addEventListener('keydown', resumeAudio, { once: true });
              window.addEventListener('touchstart', resumeAudio, { once: true });
              window.addEventListener('click', resumeAudio, { once: true });
            });
          }
        }
      } catch (e) {
        console.warn('Attempting audio play threw:', e);
      }

      // Load local SFX only (web fallbacks were using broken placeholder URLs)
      audioManager.loadSound('jump', '/assets/sounds/jump.mp3');
      audioManager.loadSound('crash', '/assets/sounds/crash.mp3');
      audioManager.loadSound('coin', '/assets/sounds/coin.mp3');
      audioManager.loadSound('powerup', '/assets/sounds/powerup.mp3');
      audioManager.loadSound('shield_hit', '/assets/sounds/shield_hit.mp3');
      audioManager.loadSound('heal', '/assets/sounds/heal.mp3');
      audioManager.loadSound('laser_zap', '/assets/sounds/laser.mp3');
      audioManager.loadSound('barrier_whoosh', '/assets/sounds/whoosh.mp3');
    })();

    // 🔧 DEBUG: Expose slide function for testing
    window.testSlide = () => {
      console.log('🧪 Testing slide function...');
      console.log('Menu state:', propsRef.current.menuState);
      console.log('Player controller exists:', !!playerControllerRef.current);
      console.log('Player system exists:', !!playerSystemRef.current);
      console.log('Has slide animation:', !!playerSystemRef.current?.hasSlideAnim?.());
      if (playerControllerRef.current) {
        const result = playerControllerRef.current.slide(true);
        console.log('Slide result:', result);
        if (result && playerSystemRef.current) {
          const slideAnimName = playerSystemRef.current?.getSlideAnimationName?.();
          if (slideAnimName) {
            playerSystemRef.current.playAnimation(slideAnimName);
          } else {
            playerSystemRef.current.applySqueezeSlide();
          }
        } else if (!result && playerSystemRef.current?.isInSqueezeSlide?.()) {
          playerSystemRef.current.removeSqueezeSlide();
        }
      }
    };
    console.log('🔧 Debug: Type window.testSlide() in console to test slide');


    // ✨ Main Animation Loop with Ability Integration
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const deltaTime = clockRef.current.getDelta();
      const physicsDt = Math.min(deltaTime, 0.05);
      const time = performance.now() / 1000;

      // Player model update is ability-aware; update after ability state is resolved

      fpsCounterRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current > 1000) {
        currentFpsRef.current = Math.round(fpsCounterRef.current / ((now - lastFpsTimeRef.current) / 1000));
        fpsCounterRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      if (timeWeatherManagerRef.current) {
        timeWeatherManagerRef.current.update(physicsDt);
      }

      if (propsRef.current.menuState === "playing" && playerRef.current) {
        if (startGracePeriodRef.current > 0) {
          startGracePeriodRef.current -= physicsDt;
        }

        // ✨ NEW: Update unified ability manager
        let abilityUpdates = { slowFactor: 1.0, speedMultiplier: 1.0, isShielded: false };
        if (abilitiesRef.current) {
          abilityUpdates = abilitiesRef.current.update(physicsDt, playerRef.current.position);
          // Apply time slow factor to game physics
          if (abilityUpdates.slowFactor && abilityUpdates.slowFactor !== 1.0) {
            timeScaleRef.current = abilityUpdates.slowFactor;
            console.log("⏱️ Time Slow applied: physics speed =", abilityUpdates.slowFactor);
          }
        }

        // Update ability systems
        let speedMultiplier = 1.0;
        let coinMultiplier = 1.0;
        let lightningActive = false;

        // Update Lightning Dash
        if (lightningRef.current) {
          const lightningUpdate = lightningRef.current.update(
            physicsDt,
            playerRef.current.position
          );

          if (lightningUpdate.active) {
            lightningActive = true;

            if (playerRef.current.material) {
              playerRef.current.material.opacity = lightningUpdate.opacity || 0.5;
              playerRef.current.material.transparent = true;
            }

            // ✅ FIX: Play Anim_Boost animation during teleport
            if (playerSystemRef.current?.playAnimation) {
              playerSystemRef.current.playAnimation('Anim_Boost');
            }

          } else if (lightningUpdate.justEnded) {
            // ✅ CRITICAL: Cleanup on end
            if (playerRef.current.material) {
              playerRef.current.material.opacity = 1.0;
              playerRef.current.material.transparent = false;
            }

            // ✅ FIX: Return to running animation
            if (playerSystemRef.current?.playAnimation) {
              playerSystemRef.current.playAnimation('Anim_Run');
            }
          }
          if (timeSlowRef.current.active) {
            const realDeltaMs = physicsDt * 1000;
            timeSlowRef.current.duration -= realDeltaMs;
            if (timeSlowRef.current.duration <= 0) {
              handleTimeSlowEnd();
            }
          }

          if (timeSlowRef.current.cooldown > 0) {
            const realDeltaMs = physicsDt * 1000;
            timeSlowRef.current.cooldown -= realDeltaMs;
            if (timeSlowRef.current.cooldown < 0) {
              timeSlowRef.current.cooldown = 0;
              console.log('⏱️ Time slow ready!');
            }
          }
        }

        // Check if should spawn hoverboard power-up
        spawnAccumulatorRef.current.hoverboardCheck += physicsDt;
        if (spawnAccumulatorRef.current.hoverboardCheck > 10) { // Check every 10 seconds
          // Hoverboard system removed
          spawnAccumulatorRef.current.hoverboardCheck = 0;
        }

        const playerIsJumping = playerControllerRef.current?.state.isJumping;
        jumpSafetySystemRef.current?.update(physicsDt, playerRef.current.position, playerIsJumping);

        // ✅ PHASE 0.7: Update danger indicators
        if (dangerIndicatorsRef.current) {
          dangerIndicatorsRef.current.update(physicsDt);
        }

        const { obstacles, instancedObstacles } = allEntitiesRef.current;
        grappleManagerRef.current?.update(
          physicsDt,
          playerRef.current.position,
          obstacles,
          instancedObstacles,
          sfxEnabledRef.current
        );

        const safePhysicsDt = physicsDt * timeScaleRef.current;
        // Determine current prominent ability for the model (hoverboard > lightning)
        let abilityType = null;
        if (lightningActive) abilityType = 'lightning';

        if (playerSystemRef.current) {
          if (playerSystemRef.current.update) playerSystemRef.current.update(deltaTime, abilityType);
          if (playerSystemRef.current.syncAbilityAnimation) playerSystemRef.current.syncAbilityAnimation(abilityType);
        }

        // ✨ ENERGY MODE: Get speed multiplier for temporary speed boost
        const energyModeSpeedMult = energyModeManagerRef.current?.getSpeedMultiplier() || 1.0;

        playerControllerRef.current.update(
          safePhysicsDt,
          safePhysicsDt * 60,
          speedRef.current * speedMultiplier * energyModeSpeedMult, // ✨ Apply both ability + energy mode speed
          CONSTANTS.LANE_POSITIONS
        );
        playerRef.current.updateMatrixWorld(true);

        // ✅ NEW: Remove squeeze slide when slide ends (timer expired)
        if (!playerControllerRef.current.state.isSliding &&
          playerSystemRef.current?.isInSqueezeSlide?.()) {
          playerSystemRef.current.removeSqueezeSlide();
        }

        if (timeScaleRef.current > 0.5) {
          energyModeManagerRef.current?.update(safePhysicsDt);
          const energySpeedMult = energyModeManagerRef.current?.getSpeedMultiplier() || 1.0;
          const deltaDistance = speedRef.current * energySpeedMult * speedMultiplier * safePhysicsDt * 60; // ✨ Apply ability speed
          gameStatsRef.current.distance += deltaDistance;

          const progress = Math.min(
            gameStatsRef.current.distance / CONSTANTS.GAME.DIFFICULTY_RAMP_DISTANCE,
            1.0
          );
          // ✅ FIX: Apply character's speed modifier (e.g., Eve = 1.05x, Vanguard = 1.03x)
          const baseSpeed = CONSTANTS.GAME.BASE_SPEED +
            (CONSTANTS.GAME.MAX_SPEED - CONSTANTS.GAME.BASE_SPEED) * progress;
          const characterSpeedMult = characterStatsManagerRef.current?.getStats?.()?.speed || 1.0;
          speedRef.current = baseSpeed * characterSpeedMult;

          // ✨ NEW: Apply speed boost from abilities
          if (abilityUpdates.speedMultiplier && abilityUpdates.speedMultiplier !== 1.0) {
            speedRef.current *= abilityUpdates.speedMultiplier;
            console.log("⚡ Speed Boost applied: speed =", speedRef.current.toFixed(1));
          }


          const comboState = comboSystemRef.current.getComboState(time);
          difficultyManagerRef.current.update(
            safePhysicsDt,
            gameStatsRef.current.distance,
            comboState.multiplier
          );

          const sectionUpdate = comboSystemRef.current.update(time, deltaDistance);
          if (sectionUpdate && sectionUpdate.perfectSection) {
            gameStatsRef.current.score += sectionUpdate.bonus;
          }

          // ✅ FIX #2: Track distance milestones for analytics
          if (gameStatsRef.current.distance >= 1000 && !milestonesRef.current.has('1000m')) {
            milestonesRef.current.add('1000m');
            analytics.trackMilestone('distance', 1000);
            console.log('🎯 Milestone reached: 1000m');
          }
          if (gameStatsRef.current.distance >= 5000 && !milestonesRef.current.has('5000m')) {
            milestonesRef.current.add('5000m');
            analytics.trackMilestone('distance', 5000);
            console.log('🎯 Milestone reached: 5000m');
          }
          if (gameStatsRef.current.distance >= 10000 && !milestonesRef.current.has('10000m')) {
            milestonesRef.current.add('10000m');
            analytics.trackMilestone('distance', 10000);
            console.log('🎯 Milestone reached: 10000m');
          }


          const bossAttack = bossManagerRef.current.update(safePhysicsDt, playerRef.current.position);
          if (bossAttack) {
            bossAttack.forEach(obstDef => entitySpawnerRef.current.createObstacleFromDefinition(obstDef));
          }

          const bossDefeated = bossManagerRef.current.checkBossDamage(
            playerRef.current.position,
            { combo: comboState.combo }
          );
          if (bossDefeated) {
            gameStatsRef.current.score += 5000;
            gameStatsRef.current.coins += 50;
            difficultyManagerRef.current.triggerSafeZone(150);
          }

          eventManagerRef.current.update(
            safePhysicsDt,
            playerRef.current.position,
            gameStatsRef.current.distance
          );
          const eventSpawns = eventManagerRef.current.getEventSpawnData();
          eventSpawns.obstacles.forEach(obstDef =>
            entitySpawnerRef.current.createObstacleFromDefinition(obstDef)
          );
          eventSpawns.coins.forEach(coinDef =>
            entitySpawnerRef.current.createCoinFromDefinition(coinDef)
          );

          const difficultyState = difficultyManagerRef.current.getDifficultyState();
          const spawnAcc = spawnAccumulatorRef.current;

          spawnAcc.obstacle += safePhysicsDt;
          spawnAcc.coin += safePhysicsDt;
          spawnAcc.powerUp += safePhysicsDt;

          if (spawnAcc.obstacle > spawnAcc.obstacleInterval) {
            entitySpawnerRef.current.spawnObstaclePattern(
              playerRef.current.position,
              difficultyState,
              playerIsJumping,
              jumpSafetySystemRef.current
            );
            spawnAcc.obstacle = 0;
            const baseInterval = startGracePeriodRef.current > 0 ? 1.2 : 1.8;
            spawnAcc.obstacleInterval = (baseInterval + Math.random() * 1.0) /
              (1 + difficultyState.intensity * 0.5);
          }

          if (spawnAcc.coin > spawnAcc.coinInterval) {
            entitySpawnerRef.current.spawnCoinPattern(
              playerRef.current.position,
              difficultyState
            );
            spawnAcc.coin = 0;
            spawnAcc.coinInterval = (1.5 + Math.random() * 1.0) *
              (1 + (1 - difficultyState.intensity) * 0.3);
          }

          if (spawnAcc.powerUp > spawnAcc.powerUpInterval) {
            entitySpawnerRef.current.spawnPowerUp(playerRef.current.position);
            spawnAcc.powerUp = 0;
            // ✅ IMPROVED: Better spawn distribution (6-10 seconds) at all difficulty levels
            spawnAcc.powerUpInterval = (6.0 + Math.random() * 4.0) /
              (1 + difficultyState.intensity * 0.25);
          }

          // ✨ Update ability states for UI
          if (time - lastStatsUpdateRef.current > CONSTANTS.GAME.STATE_UPDATE_INTERVAL) {
            const dangerZones = jumpSafetySystemRef.current?.getDangerZones() || [];
            const slowMotionActive = jumpSafetySystemRef.current?.slowMoActive || false;
            const energyModeData = energyModeManagerRef.current?.getEffectsData();
            const grappleData = grappleManagerRef.current?.getGrappleData();


            // ✨ NEW: Build ability states for UI
            const abilityStates = {
              lightning: {
                active: lightningActive,
                ready: lightningRef.current?.isReady() || false,
                cooldownPercent: lightningRef.current?.getCooldownPercent() || 0,
                level: lightningRef.current?.level || 1
              }
            };

            propsRef.current.onStatsUpdate?.({
              ...gameStatsRef.current,
              combo: comboState,
              difficultyPhase: difficultyState.intensityLevel,
              fps: currentFpsRef.current,
              speed: speedRef.current * speedMultiplier, // ✨ Include ability speed
              dangerZones,
              slowMotionActive,
              energyMode: energyModeData,
              grapple: grappleData,
              playerLane: playerControllerRef.current?.state.targetLane,
              abilityStates // ✨ NEW: Pass ability states to UI
            });

            lastStatsUpdateRef.current = time;
          }
        }

        entitySpawnerRef.current.updateEntities(safePhysicsDt, playerRef.current.position.z);
        const { coins, powerUps } = allEntitiesRef.current;

        // Update bar visuals
        entitySpawnerRef.current.updateBars(allEntitiesRef.current.obstacles, safePhysicsDt);

        // 🎨 Update power-up animations (NEW)
        entitySpawnerRef.current.updatePowerUpAnimations(safePhysicsDt, clockRef.current.elapsedTime);

        if (playerIsJumping) {
          jumpSafetySystemRef.current?.checkNearMiss(
            playerRef.current.position,
            playerIsJumping,
            allEntitiesRef.current.obstacles,
            allEntitiesRef.current.instancedObstacles
          );
        }

        // ✨ Collision checks with ability immunity
        collisionManagerRef.current.checkObstacleCollisions(
          playerRef.current,
          allEntitiesRef.current.obstacles,
          allEntitiesRef.current.instancedObstacles,
          propsRef,
          gameStatsRef,
          startGracePeriodRef.current // Pass start-grace period to skip initial collisions
        );

        collisionManagerRef.current.checkCoinCollisions(
          playerRef.current,
          coins,
          propsRef,
          gameStatsRef,
          coinSparklesRef.current,
          coinMultiplier // ✨ Pass coin multiplier from abilities
        );

        collisionManagerRef.current.checkPowerUpCollisions(
          playerRef.current,
          powerUps,
          propsRef,
          gameStatsRef,
          powerUpAurasRef.current
        );

        collisionManagerRef.current.checkNearMisses(
          playerRef.current,
          allEntitiesRef.current.obstacles,
          allEntitiesRef.current.instancedObstacles,
          gameStatsRef,
          propsRef
        );

        worldRecyclerRef.current.recycleGround(
          worldElementsRef.current.groundPlanes,
          worldElementsRef.current.groundGrids,
          playerRef.current.position.z
        );

        worldRecyclerRef.current.recycleBuildings(
          worldElementsRef.current.buildings,
          playerRef.current.position.z,
          themesRef.current[currentThemeIndexRef.current],
          worldBuilderRef.current,
          propsRef.current.isHighQuality
        );

        worldRecyclerRef.current.recycleBillboards(
          worldElementsRef.current.billboards,
          playerRef.current.position.z,
          time,
          propsRef.current.isHighQuality
        );

        if (playerTrailRef.current) {
          playerTrailRef.current.update(playerRef.current.position, safePhysicsDt, true);
        }

        if (coinSparklesRef.current) {
          coinSparklesRef.current.update(
            safePhysicsDt,
            playerRef.current.position.z,
            CONSTANTS.GAME.ENTITY_UPDATE_DISTANCE
          );
        }

        if (powerUpAurasRef.current) {
          powerUpAurasRef.current.update(
            safePhysicsDt,
            playerRef.current.position.z,
            CONSTANTS.GAME.ENTITY_UPDATE_DISTANCE
          );
        }

        if (particleSystemRef.current) {
          particleSystemRef.current.update(safePhysicsDt);
        }

        if (flyingVehiclesRef.current) {
          flyingVehiclesRef.current.update(safePhysicsDt, playerRef.current.position.z);
        }

        if (volumetricBeamsRef.current) {
          volumetricBeamsRef.current.update(safePhysicsDt, playerRef.current.position.z);
        }

        if (rainRef.current) {
          updateRain(rainRef.current, CONSTANTS, safePhysicsDt);
        }

        if (playerRef.current && cameraRef.current) {
          cameraRef.current.position.x += (playerRef.current.position.x - cameraRef.current.position.x) * 0.1;
          // Smooth vertical follow to keep player centered
          const desiredY = playerRef.current.position.y + CONSTANTS.CAMERA.BASE_HEIGHT;
          cameraRef.current.position.y += (desiredY - cameraRef.current.position.y) * 0.08;
          cameraRef.current.position.z = playerRef.current.position.z + CONSTANTS.CAMERA.OFFSET_Z;
        }

        // Detach particle effects when jetpack ends
        if (postProcessingRef.current) {
          const speedProgress = (speedRef.current - CONSTANTS.GAME.BASE_SPEED) /
            (CONSTANTS.GAME.MAX_SPEED - CONSTANTS.GAME.BASE_SPEED);
          const energyIntensity = energyModeManagerRef.current?.getVisualIntensity() || 0;

          postProcessingRef.current.update(
            speedProgress,
            propsRef.current.multiplier || 1,
            propsRef.current.shieldActive || false,
            safePhysicsDt,
            currentFpsRef.current,
            propsRef.current.isTimeSlowActive || false,
            energyIntensity
          );
        }
      }

      // 🎨 CRITICAL: Render the scene!
      if (postProcessingRef.current && postProcessingRef.current.enabled) {
        postProcessingRef.current.render();
      } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // ✨ Cleanup function
    return () => {
      console.log('🧹 Cleaning up GameEngine with abilities...');
      isMounted = false;

      // ✅ FIX #2: Track game end with stats
      analytics.trackGameEnd({
        distance: gameStatsRef.current.distance,
        score: gameStatsRef.current.score,
        coins: gameStatsRef.current.coins
      });

      audioManager.stop('music');

      // ✅ FIX #2: Reset milestones for next game
      milestonesRef.current.clear();

      if (memoryMonitorRef.current) {
        clearInterval(memoryMonitorRef.current);
      }

      cancelAnimationFrame(animationFrameId);
      inputHandlerRef.current?.disable();
      window.removeEventListener('resize', handleResize);

      // ✨ NEW: Dispose ability systems
      if (hoverboardRef.current) {
        console.log("🛹 Disposing Hoverboard System...");
        hoverboardRef.current.dispose();
        hoverboardRef.current = null;
      }

      if (lightningRef.current) {
        console.log("⚡ Disposing Lightning System...");
        lightningRef.current.dispose();
        lightningRef.current = null;
      }

      // ✅ PHASE 0.7: Dispose danger indicators
      if (dangerIndicatorsRef.current) {
        console.log("⚠️ Disposing Danger Indicators...");
        dangerIndicatorsRef.current.dispose();
        dangerIndicatorsRef.current = null;
      }

      if (playerSystemRef.current) {
        playerSystemRef.current.dispose();
        playerSystemRef.current = null;
      }
      // Remove WebGL context event listeners if present
      try {
        const handlers = rendererRef.current?._contextHandlers;
        if (handlers && rendererRef.current && rendererRef.current.domElement) {
          rendererRef.current.domElement.removeEventListener('webglcontextlost', handlers.onContextLost);
          rendererRef.current.domElement.removeEventListener('webglcontextrestored', handlers.onContextRestored);
        }
      } catch (e) { }

      try { rendererRef.current.dispose(); } catch (e) { }

      if (mount && rendererRef.current && mount.contains(rendererRef.current.domElement)) {
        mount.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (menuState === 'playing') {
      inputHandlerRef.current?.enable();
    } else {
      inputHandlerRef.current?.disable();
    }
  }, [menuState]);

  // ✨ NEW: Handle Revive Trigger
  useEffect(() => {
    if (reviveTrigger > 0) {
      console.log("❤️ REVIVE TRIGGERED! Resetting health and applying grace period.");
      if (gameStatsRef.current) {
        gameStatsRef.current.health = 100;
      }
      // Grant 3 seconds of invulnerability
      startGracePeriodRef.current = 3.0;

      // Clear nearby obstacles to prevent instant death?
      // Ideally we would, but grace period handles the collision check.

      // Visual feedback
      if (playerSystemRef.current) {
        playerSystemRef.current.playAnimation?.('Anim_Run');
        console.log("🏃‍♂️ Player animation reset to Run");
      }
    }
  }, [reviveTrigger]);

  // ✨ NEW: Expose ability callbacks to parent
  useEffect(() => {
    if (propsRef.current.onAbilityStatesUpdate) {
      propsRef.current.onAbilityStatesUpdate({
        handleLightningActivate,
        handleShieldActivate,
        handleSpeedBoostActivate,
        handleTimeSlowActivate,
        handleTimeSlowCollect // Also expose the power-up collect handler
      });
    }
  }, [handleLightningActivate, handleShieldActivate, handleSpeedBoostActivate, handleTimeSlowActivate, handleTimeSlowCollect]);
  // Debug helpers are exposed elsewhere; removed inline debug setup to avoid parse issues

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative'
      }}
    >
      {/* Ability UI will be rendered by parent component */}
    </div>
  );

});
