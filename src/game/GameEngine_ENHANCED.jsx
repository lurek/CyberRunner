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
import { getCharacterStatsManager } from "./systems/CharacterStatsManager.js"; 
import { TimeWeatherManager } from "./systems/TimeWeatherManager.js";
// ✨ NEW: Import ability systems
import { HoverboardSystem, LightningDashSystem } from "./systems/UniqueFeatures.jsx";

import { GLBPlayerSystem } from "./models/GLBPlayerSystem.js";

const CHARACTER_PATH = "/Main_Character.glb"; 

        collisionManagerRef.current.checkObstacleCollisions(
          playerRef.current, 
          allEntitiesRef.current.obstacles, 
          allEntitiesRef.current.instancedObstacles, 
          propsRef, 
          gameStatsRef,
          startGracePeriodRef.current
        );
  onStatsUpdate, 
  onPowerUp, 
  shieldActive, 
  multiplier, 
  isMagnetActive, 
  isTimeSlowActive, 
  onReady, 
  selectedCharacter,
  // ✨ NEW: Ability callbacks
  onAbilityStatesUpdate
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
  const characterStatsManagerRef = useRef(null); 
  const timeWeatherManagerRef = useRef(null); 
  
  // ✨ NEW: Ability system refs
  const hoverboardRef = useRef(null);
  const lightningRef = useRef(null);
  
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
  // ✨ NEW: Track previous sliding state to avoid re-triggering animation every frame
  const prevSlidingStateRef = useRef(false);
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
    if (menuState === 'playing') startGracePeriodRef.current = 0.8;
  }, [menuState, musicOn, sfxOn, isHighQuality, startHealth, onGameOver, onStatsUpdate, onPowerUp, shieldActive, multiplier, isMagnetActive, isTimeSlowActive, onReady, selectedCharacter, onAbilityStatesUpdate]);

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
      
      // Teleport player
      playerRef.current.position.z = result.targetZ;
      
      // Grant temporary invincibility
      if (collisionManagerRef.current && collisionManagerRef.current.setTemporaryInvincibility) {
        collisionManagerRef.current.setTemporaryInvincibility(result.invincibilityDuration);
      }
      
      // Camera shake for impact
      triggerCameraShake(0.5);
    } else {
      console.log("⚡ Lightning: On cooldown or already active");
    }
  }, [triggerCameraShake]);

  const memoryMonitorRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    
    console.log("🎮 GameEngine: Initializing with abilities support...");
    
    const camera = createCamera(); 
    cameraRef.current = camera;
    
    const renderer = createRenderer(propsRef.current.isHighQuality); 
    mount.appendChild(renderer.domElement); 
    rendererRef.current = renderer;
    
    let envMapTexture = null;
    if (propsRef.current.isHighQuality) {
      const { cubeCamera, renderTarget } = createEnvironmentMap(renderer); 
      cubeCameraRef.current = cubeCamera; 
      cubeRenderTargetRef.current = renderTarget; 
      envMapTexture = renderTarget.texture;
    }
    
    materialManagerRef.current = new MaterialManager(envMapTexture);
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
    
    // ✨ NEW: Initialize ability systems
    console.log("🛹 GameEngine: Initializing Hoverboard System...");
    hoverboardRef.current = new HoverboardSystem(scene, CONSTANTS);
    
    console.log("⚡ GameEngine: Initializing Lightning Dash System...");
    lightningRef.current = new LightningDashSystem(scene, CONSTANTS);
    
    playerSystemRef.current = new GLBPlayerSystem(scene);
    let isMounted = true;

    console.log("🚀 Engine: Loading character from " + CHARACTER_PATH);
    setDebugStatus("Loading Character...");

    playerSystemRef.current.load(CHARACTER_PATH).then((anchorGroup) => {
        if (!isMounted) return;
        console.log("✅ Engine: Character loaded!");
        setDebugStatus("Character Ready");

        playerRef.current = anchorGroup;
        playerRef.current.position.set(CONSTANTS.LANE_POSITIONS[1], CONSTANTS.PLAYER.BASE_HEIGHT, 0);
        playerRef.current.updateMatrixWorld(true);
        
        if (playerControllerRef.current) {
            playerControllerRef.current.player = playerRef.current;
        }

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
    jumpSafetySystemRef.current = new JumpSafetySystem(CONSTANTS); 
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
      characterStatsManagerRef.current
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
        if (propsRef.current.menuState === 'playing' && playerControllerRef.current.slide(sfxEnabledRef.current)) {
          playerSystemRef.current?.playAnimation?.('slide');
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
      )
    });
    
    const handleResize = () => { 
      if(!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight; 
      cameraRef.current.updateProjectionMatrix(); 
      rendererRef.current.setSize(window.innerWidth, window.innerHeight); 
      postProcessingRef.current?.resize(window.innerWidth, window.innerHeight); 
    };
    window.addEventListener('resize', handleResize);
    
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
        
        // ✨ NEW: Update ability systems
        let speedMultiplier = 1.0;
        let coinMultiplier = 1.0;
        let hoverboardActive = false;
        let lightningActive = false;

        // Update Hoverboard
        if (hoverboardRef.current) {
          const currentLane = playerControllerRef.current?.state.currentLane || 0;
          const hoverboardUpdate = hoverboardRef.current.update(
            physicsDt,
            playerRef.current.position,
            currentLane
          );
          
          if (hoverboardUpdate.active) {
            hoverboardActive = true;
            speedMultiplier *= hoverboardUpdate.speedMultiplier || 1.5;
            
            // Apply hoverboard mode to player
            if (playerControllerRef.current) {
              playerControllerRef.current.state.hoverboardMode = true;
              playerControllerRef.current.state.groundImmune = hoverboardUpdate.groundImmune;
            }
            
            // Update collision manager
            if (collisionManagerRef.current) {
              collisionManagerRef.current.hoverboardGroundImmune = hoverboardUpdate.groundImmune;
            }
          } else if (hoverboardUpdate.justEnded) {
            // Hoverboard just ended
            if (playerControllerRef.current) {
              playerControllerRef.current.state.hoverboardMode = false;
              playerControllerRef.current.state.groundImmune = false;
            }
            if (collisionManagerRef.current) {
              collisionManagerRef.current.hoverboardGroundImmune = false;
            }
          }
        }
        
        // Update Lightning Dash
        if (lightningRef.current) {
          const lightningUpdate = lightningRef.current.update(
            physicsDt,
            playerRef.current.position
          );
          
          if (lightningUpdate.active) {
            lightningActive = true;
            // Apply visual transparency during dash
            if (playerRef.current.material) {
              playerRef.current.material.opacity = lightningUpdate.opacity || 0.5;
              playerRef.current.material.transparent = true;
            }
          } else if (lightningUpdate.justEnded) {
            // Restore player visibility
            if (playerRef.current.material) {
              playerRef.current.material.opacity = 1.0;
              playerRef.current.material.transparent = false;
            }
          }
        }
        
        // Check if should spawn hoverboard power-up
        spawnAccumulatorRef.current.hoverboardCheck += physicsDt;
        if (spawnAccumulatorRef.current.hoverboardCheck > 10) { // Check every 10 seconds
          if (hoverboardRef.current?.shouldSpawn(gameStatsRef.current.distance)) {
            // Spawn hoverboard power-up
            entitySpawnerRef.current.spawnHoverboardPowerUp(playerRef.current.position);
            console.log("🛹 Spawned hoverboard power-up at distance:", gameStatsRef.current.distance);
          }
          spawnAccumulatorRef.current.hoverboardCheck = 0;
        }
        
        const playerIsJumping = playerControllerRef.current?.state.isJumping;
        jumpSafetySystemRef.current?.update(physicsDt, playerRef.current.position, playerIsJumping);
        
        const { obstacles, instancedObstacles } = allEntitiesRef.current;
        grappleManagerRef.current?.update(
          physicsDt, 
          playerRef.current.position, 
          obstacles, 
          instancedObstacles, 
          sfxEnabledRef.current
        );
        
        const safePhysicsDt = physicsDt * timeScaleRef.current;

        // Determine current prominent ability for the model (hoverboard > jetpack > lightning)
        let abilityType = null;
        if (hoverboardActive) abilityType = 'hoverboard';
        else if (jetpackActive) abilityType = 'jetpack';
        else if (lightningActive) abilityType = 'lightning';

        // ✨ FIXED: Check for sliding animation trigger (only trigger on START of slide)
        const isSliding = playerControllerRef.current?.state?.isSliding || false;
        const wasSliding = prevSlidingStateRef.current;
        
        // Only trigger animation when sliding STARTS (transition from false to true)
        if (isSliding && !wasSliding && playerSystemRef.current && playerSystemRef.current.playAnimation) {
          playerSystemRef.current.playAnimation('Anim_slide');
        }
        prevSlidingStateRef.current = isSliding; // Update state for next frame

        if (playerSystemRef.current) {
          if (playerSystemRef.current.update) playerSystemRef.current.update(deltaTime, abilityType);
          if (playerSystemRef.current.syncAbilityAnimation) playerSystemRef.current.syncAbilityAnimation(abilityType);
        }

        playerControllerRef.current.update(
          safePhysicsDt, 
          safePhysicsDt * 60, 
          speedRef.current * speedMultiplier, // ✨ Apply speed multiplier from abilities
          CONSTANTS.LANE_POSITIONS
        );
        playerRef.current.updateMatrixWorld(true);

        if (timeScaleRef.current > 0.5) {
          energyModeManagerRef.current?.update(safePhysicsDt); 
          const energySpeedMult = energyModeManagerRef.current?.getSpeedMultiplier() || 1.0;
          const deltaDistance = speedRef.current * energySpeedMult * speedMultiplier * safePhysicsDt * 60; // ✨ Apply ability speed
          gameStatsRef.current.distance += deltaDistance;
          
          const progress = Math.min(
            gameStatsRef.current.distance / CONSTANTS.GAME.DIFFICULTY_RAMP_DISTANCE, 
            1.0
          );
          speedRef.current = CONSTANTS.GAME.BASE_SPEED + 
            (CONSTANTS.GAME.MAX_SPEED - CONSTANTS.GAME.BASE_SPEED) * progress;
          
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
            // ✨ MORE FREQUENT SPAWN: 5-9 seconds (was 8-12) so easier to test abilities
            spawnAcc.powerUpInterval = (5.0 + Math.random() * 4.0) / 
              (1 + difficultyState.intensity * 0.2); 
          }
          
          // ✨ Update ability states for UI
          if (time - lastStatsUpdateRef.current > CONSTANTS.GAME.STATE_UPDATE_INTERVAL) {
            const dangerZones = jumpSafetySystemRef.current?.getDangerZones() || [];
            const slowMotionActive = jumpSafetySystemRef.current?.slowMoActive || false;
            const energyModeData = energyModeManagerRef.current?.getEffectsData();
            const grappleData = grappleManagerRef.current?.getGrappleData();
            
            // ✨ NEW: Build ability states for UI
            const abilityStates = {
              hoverboard: {
                active: hoverboardActive,
                duration: hoverboardRef.current?.duration || 0
              },
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
          jetpackActive // ✨ Pass jetpack immunity
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
          powerUpAurasRef.current,
          hoverboardRef.current // ✨ Pass hoverboard system for activation
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
          // ✨ SUBWAY SURFERS CAMERA: Dynamic positioning based on ability state
          
          const isHoverboardActive = hoverboardRef.current?.active || false;
          
          // Smoothly follow player horizontally (lane switching)
          cameraRef.current.position.x += (playerRef.current.position.x - cameraRef.current.position.x) * 0.1;
          
          // ✨ FIXED: Camera Z - further back during jetpack so player is fully visible
          // During jetpack: move camera FURTHER BACK (higher Z+offset) not closer
          // Player needs room to be seen fully
          const targetCameraZ = playerRef.current.position.z + (isJetpackActive ? CONSTANTS.CAMERA.OFFSET_Z + 3 : CONSTANTS.CAMERA.OFFSET_Z);
          cameraRef.current.position.z = targetCameraZ;
          
          // ✨ NEW: Camera height dynamically follows player during flight
          let targetCameraY = CONSTANTS.CAMERA.BASE_HEIGHT;
          if (isJetpackActive) {
            // During jetpack: camera rises higher to see the full flight effect
            // Use fallback boost if constant removed
            const jetpackBoost = (CONSTANTS.CAMERA.JETPACK_HEIGHT_BOOST) || 0;
            targetCameraY = playerRef.current.position.y + jetpackBoost + 3.5;
          }
          
          // Smooth height movement (faster during flight for responsiveness)
          const heightSmoothingSpeed = (isJetpackActive || isHoverboardActive) ? CONSTANTS.CAMERA.FLIGHT_HEIGHT_SMOOTHING : CONSTANTS.CAMERA.VERTICAL_FOLLOW;
          cameraRef.current.position.y += (targetCameraY - cameraRef.current.position.y) * heightSmoothingSpeed;
          
          // ✨ FIXED: Camera lookAt - look more down during flight so player is centered
          // During flight: look directly at player (not ahead)
          const lookZ = isJetpackActive ? playerRef.current.position.z : playerRef.current.position.z - 5;
          const lookY = isJetpackActive ? playerRef.current.position.y + 0.5 : playerRef.current.position.y + 1.5;
          
          cameraRef.current.lookAt(
            playerRef.current.position.x,
            lookY,
            lookZ
          );
        }
        
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
      
      if (postProcessingRef.current && postProcessingRef.current.enabled) {
        postProcessingRef.current.render();
      } else {
        rendererRef.current.render(scene, camera);
      }
    };
    
    animate();
    
    // ✨ Cleanup function
    return () => {
      console.log('🧹 Cleaning up GameEngine with abilities...');
      isMounted = false;
      
      if (memoryMonitorRef.current) {
        clearInterval(memoryMonitorRef.current);
      }
      
      cancelAnimationFrame(animationFrameId);
      inputHandlerRef.current?.disable();
      window.removeEventListener('resize', handleResize);
      
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
      
      if (playerSystemRef.current) { 
        playerSystemRef.current.dispose(); 
        playerSystemRef.current = null; 
      }
      
      rendererRef.current.dispose();
      
      if (mount && mount.contains(rendererRef.current.domElement)) {
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

  // ✨ NEW: Hoverboard activation callback
  const handleHoverboardActivate = useCallback(() => {
    if (!hoverboardRef.current || propsRef.current.menuState !== 'playing' || !playerRef.current) {
      console.log("🛹 Hoverboard: Cannot activate - not in playing state");
      return;
    }
    
    const result = hoverboardRef.current.activate(playerRef.current.position);
    if (result) {
      console.log("🛹 Hoverboard: Activated! Duration:", result.duration);
    } else {
      console.log("🛹 Hoverboard: Activation failed");
    }
  }, []);

  // ✨ NEW: Expose ability callbacks to parent
  useEffect(() => {
    if (propsRef.current.onAbilityStatesUpdate) {
      propsRef.current.onAbilityStatesUpdate({
        handleJetpackActivate,
        handleHoverboardActivate,
        handleLightningActivate
      });
    }
  }, [handleJetpackActivate, handleHoverboardActivate, handleLightningActivate]);

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
