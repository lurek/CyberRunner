import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { CHARACTERS } from '../utils/constants';
import { useGLTFWithCache } from '../game/models/useGLTFWithCache';
import { characterModelCache } from '../game/models/CharacterModelCache';
import * as THREE from 'three';
import './CharacterPreviewPage.css';

/**
 * 3D Character Model with Idle Animation
 * FIXED: Improved scaling to prevent clipping
 */
function Character3DModel({ modelPath, characterConfig, onLoad }) {
  const gltf = useGLTFWithCache(modelPath);
  const mixer = useRef();
  const modelRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!gltf || !gltf.scene) {
      console.warn(`⚠️ Failed to load model from ${modelPath}`);
      return;
    }

    console.log(`📦 Loading ${modelPath}...`, { hasScene: !!gltf.scene, hasAnimations: !!(gltf.animations && gltf.animations.length) });

    try {
      // Clone the scene to avoid issues with multiple instances
      const clonedScene = gltf.scene.clone(true);
      modelRef.current = clonedScene;

      // Compute bounding box and auto-fit scale so character fills the preview area
      try {
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const modelHeight = size.y || 1;
        const desiredHeight = characterConfig?.previewHeight || 2.0;
        // FIXED: Reduced default previewScale from 1.0 to 0.75 to prevent clipping
        const previewScale = characterConfig?.previewScale || 0.75;
        // FIXED: Clamp scaleFactor between 0.01 and 1.8 to prevent oversizing
        const scaleFactor = Math.max(0.01, Math.min(1.8, (desiredHeight / modelHeight) * previewScale));
        clonedScene.scale.setScalar(scaleFactor);
        console.log(`📏 Character scale: ${scaleFactor.toFixed(2)}`);

        // Recompute box after scaling and center model on origin
        box.setFromObject(clonedScene);
        const center = box.getCenter(new THREE.Vector3());
        clonedScene.position.sub(center);

        // Move the model up so its base sits slightly above origin (platform y=0)
        const newSize = new THREE.Vector3();
        box.getSize(newSize);
        const newHeight = newSize.y || (modelHeight * scaleFactor);
        clonedScene.position.y += newHeight * 0.48; // Adjusted from 0.5 for better positioning
      } catch (err) {
        console.warn('⚠️ Auto-fit/center failed, proceeding without fit:', err);
      }

      // Setup shadows
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            // Ensure double sided for models that may have inverted normals
            child.material.side = THREE.DoubleSide;
          }
        }
      });

      // Setup animation mixer for idle animation
      if (gltf.animations && gltf.animations.length > 0) {
        mixer.current = new THREE.AnimationMixer(clonedScene);
        
        // Find and play idle animation
        const idleClip = gltf.animations.find(clip => {
          const name = clip.name.toLowerCase();
          return name.includes('idle') || name.includes('stand');
        }) || gltf.animations[0]; // Fallback to first animation

        if (idleClip) {
          const action = mixer.current.clipAction(idleClip);
          action.play();
          console.log(`✅ Playing idle animation: ${idleClip.name}`);
        }
      } else {
        console.warn(`⚠️ No animations found in ${modelPath}`);
      }

      setIsLoaded(true);
      if (onLoad) onLoad();
      console.log(`✅ Model loaded successfully: ${modelPath}`);
    } catch (err) {
      console.error(`❌ Error loading model ${modelPath}:`, err);
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
        mixer.current = null;
      }
    };
  }, [gltf, characterConfig, modelPath, onLoad]);

  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  if (!modelRef.current) {
    console.debug(`⏳ Waiting for model to load: ${modelPath}`);
    // Show fallback box while loading
    return (
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.6, 1.8, 0.6]} />
        <meshStandardMaterial color="#00ccff" emissive="#0066aa" emissiveIntensity={0.5} />
      </mesh>
    );
  }

  return <primitive object={modelRef.current} />;
}

/**
 * Animated Platform
 * FIXED: Only rotate the glow ring, keep main platform static
 */
function AnimatedPlatform() {
  const meshRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    // FIXED: Only animate glow ring rotation, keep main platform static for clarity
    if (glowRef.current) {
      glowRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 0.85;
      glowRef.current.material.opacity = pulse;
    }
  });

  return (
    <group position={[0, -1.2, 0]}>
      {/* Main platform - static */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.08, 64]} />
        <meshStandardMaterial 
          color="#00ccff"
          emissive="#0088cc"
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Outer glow ring - rotating */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.7, 1.9, 64]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Light */}
      <pointLight position={[0, 0.5, 0]} intensity={2} color="#00ccff" distance={8} />
    </group>
  );
}

/**
 * Camera Controller for proper framing
 */
function CameraController({ characterHeight }) {
  const { camera } = useThree();

  useEffect(() => {
    // Position camera based on character height
    const distance = characterHeight * 1.5 || 3.5;
    camera.position.set(0, characterHeight * 0.4 || 1, distance);
    camera.lookAt(0, characterHeight * 0.3 || 0.8, 0);
  }, [camera, characterHeight]);

  return null;
}

/**
 * Main Character Preview Page
 * FIXED: Better responsive design for buttons
 */
export default function CharacterPreviewPage({
  selectedCharacter = 'default',
  onEquip,
  onBack,
  totalCoins = 0,
  ownedCharacters = ['default'],
  onCharacterPurchase
}) {
  const [currentCharacterId, setCurrentCharacterId] = useState(selectedCharacter);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('stats');
  
  const characterIds = Object.keys(CHARACTERS);
  const currentIndex = characterIds.indexOf(currentCharacterId);
  const character = CHARACTERS[currentCharacterId] || CHARACTERS.default;
  
  const isOwned = ownedCharacters.includes(currentCharacterId);
  const isEquipped = currentCharacterId === selectedCharacter;
  const canAfford = totalCoins >= character.cost;
  const isFree = character.cost === 0;

  // Log cache stats when page loads
  useEffect(() => {
    const stats = characterModelCache.getStats();
    console.log(`📊 Character Model Cache Status:`, stats);
  }, []);

  // Prefetch adjacent character models for smoother navigation
  useEffect(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : characterIds.length - 1;
    const nextIndex = currentIndex < characterIds.length - 1 ? currentIndex + 1 : 0;
    
    const prevCharId = characterIds[prevIndex];
    const nextCharId = characterIds[nextIndex];
    
    const prevChar = CHARACTERS[prevCharId];
    const nextChar = CHARACTERS[nextCharId];
    
    console.log(`🔄 Prefetching adjacent models: ${prevCharId}, ${nextCharId}`);
    
    // Preload the models (they'll be cached automatically by useGLTFWithCache)
    if (prevChar?.modelPath && !characterModelCache.has(prevChar.modelPath)) {
      console.log(`⏳ Prefetching ${prevCharId} from ${prevChar.modelPath}`);
    }
    if (nextChar?.modelPath && !characterModelCache.has(nextChar.modelPath)) {
      console.log(`⏳ Prefetching ${nextCharId} from ${nextChar.modelPath}`);
    }
  }, [currentIndex, characterIds]);

  // Navigation handlers
  const handlePrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : characterIds.length - 1;
    setCurrentCharacterId(characterIds[prevIndex]);
    setModelLoaded(false);
  };

  const handleNext = () => {
    const nextIndex = currentIndex < characterIds.length - 1 ? currentIndex + 1 : 0;
    setCurrentCharacterId(characterIds[nextIndex]);
    setModelLoaded(false);
  };

  // Action handlers
  const handleAction = () => {
    if (isFree || isOwned) {
      if (onEquip) onEquip(currentCharacterId);
    } else if (canAfford) {
      if (onCharacterPurchase) {
        onCharacterPurchase(currentCharacterId);
      }
    }
  };

  // Get button text and style
  const getButtonConfig = () => {
    if (isEquipped) {
      return { text: '✓ EQUIPPED', className: 'equipped', disabled: true };
    }
    if (isFree || isOwned) {
      return { text: 'EQUIP', className: 'equip', disabled: false };
    }
    if (canAfford) {
      return { text: `BUY ${character.cost.toLocaleString()} 🪙`, className: 'buy', disabled: false };
    }
    return { text: `LOCKED - ${character.cost.toLocaleString()} 🪙`, className: 'locked', disabled: true };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="character-preview-page">
      {/* Header */}
      <div className="preview-header">
        <button className="back-button" onClick={onBack} title="Go back">
          <span>←</span>
        </button>
        <h1 className="preview-title">CHARACTERS</h1>
        <div className="currency-display">
          <span className="coins">🪙 {totalCoins.toLocaleString()}</span>
        </div>
      </div>

      {/* 3D Character Viewer with Rotation */}
      <div className="character-viewer">
        <Canvas
          shadows
          gl={{ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
          }}
          dpr={[1, 2]}
        >
          <CameraController characterHeight={character.previewHeight || 2.0} />
          
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1.2} 
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-3, 3, 3]} intensity={0.8} color="#00ccff" />
          
          {/* Character Model */}
          <Suspense fallback={null}>
            <Character3DModel 
              modelPath={character.modelPath}
              characterConfig={character}
              onLoad={() => setModelLoaded(true)}
            />
          </Suspense>

          {/* Platform */}
          <AnimatedPlatform />

          {/* Controls - Enable rotation */}
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
            autoRotate={false}
            rotateSpeed={0.5}
          />

          {/* Environment */}
          <Environment preset="city" />
        </Canvas>

        {/* Loading Indicator */}
        {!modelLoaded && (
          <div className="model-loading">
            <div className="loading-spinner"></div>
            <p>Loading {character.name}...</p>
            <p className="loading-hint">(Caching model for game)</p>
          </div>
        )}

        {/* Rotation Hint */}
        <div className="rotation-hint">
          ↻ Drag to rotate
        </div>

        {/* Navigation Arrows */}
        <button className="nav-arrow left" onClick={handlePrevious} title="Previous character" aria-label="Previous character">
          ‹
        </button>
        <button className="nav-arrow right" onClick={handleNext} title="Next character" aria-label="Next character">
          ›
        </button>
      </div>

      {/* Character Info */}
      <div className="character-info-panel">
        {/* Character Name & Description */}
        <div className="character-header-info">
          <h2 className="character-name">{character.name}</h2>
          <p className="character-description">{character.description}</p>
        </div>

        {/* Tab Navigation */}
        <div className="info-tabs">
          <button 
            className={`tab ${selectedTab === 'stats' ? 'active' : ''}`}
            onClick={() => setSelectedTab('stats')}
          >
            STATS
          </button>
          <button 
            className={`tab ${selectedTab === 'abilities' ? 'active' : ''}`}
            onClick={() => setSelectedTab('abilities')}
          >
            ABILITIES
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {selectedTab === 'stats' && (
            <div className="stats-grid">
              <StatBar 
                label="Speed" 
                value={character.stats.speed} 
                icon="⚡"
                baseValue={1.0}
              />
              <StatBar 
                label="Jump Height" 
                value={character.stats.jumpHeight} 
                icon="🦘"
                baseValue={1.0}
              />
              <StatBar 
                label="Magnet Radius" 
                value={character.stats.magnetRadius} 
                icon="🧲"
                baseValue={1.0}
              />
            </div>
          )}

          {selectedTab === 'abilities' && (
            <div className="abilities-info">
              <div className="ability-card">
                <div className="ability-icon">🎬</div>
                <div className="ability-details">
                  <h4>Smooth Animations</h4>
                  <p>Features idle, running, jumping, flying, falling, and surfing animations</p>
                </div>
              </div>
              
              {character.stats.speed > 1.0 && (
                <div className="ability-card">
                  <div className="ability-icon">⚡</div>
                  <div className="ability-details">
                    <h4>Enhanced Speed</h4>
                    <p>+{((character.stats.speed - 1) * 100).toFixed(0)}% movement speed bonus</p>
                  </div>
                </div>
              )}
              
              {character.stats.jumpHeight > 1.0 && (
                <div className="ability-card">
                  <div className="ability-icon">🦘</div>
                  <div className="ability-details">
                    <h4>Power Jump</h4>
                    <p>+{((character.stats.jumpHeight - 1) * 100).toFixed(0)}% jump height bonus</p>
                  </div>
                </div>
              )}
              
              {character.stats.magnetRadius > 1.0 && (
                <div className="ability-card">
                  <div className="ability-icon">🧲</div>
                  <div className="ability-details">
                    <h4>Coin Magnet</h4>
                    <p>+{((character.stats.magnetRadius - 1) * 100).toFixed(0)}% coin collection radius</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          className={`action-button ${buttonConfig.className}`}
          onClick={handleAction}
          disabled={buttonConfig.disabled}
        >
          {buttonConfig.text}
        </button>

        {/* Character Indicator */}
        <div className="character-indicator">
          {characterIds.map((id, index) => (
            <div 
              key={id}
              className={`indicator-dot ${id === currentCharacterId ? 'active' : ''} ${ownedCharacters.includes(id) ? 'owned' : ''}`}
              onClick={() => {
                setCurrentCharacterId(id);
                setModelLoaded(false);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Bar Component
 */
function StatBar({ label, value, icon, baseValue = 1.0 }) {
  const difference = ((value - baseValue) / baseValue) * 100;
  const isPositive = difference > 0;
  const isNeutral = Math.abs(difference) < 0.1;

  return (
    <div className="stat-bar-container">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
        <span className={`stat-value ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
          {isNeutral ? '100%' : isPositive ? `+${difference.toFixed(0)}%` : `${difference.toFixed(0)}%`}
        </span>
      </div>
      <div className="stat-bar-bg">
        <div 
          className={`stat-bar-fill ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}
          style={{ width: `${Math.min(value / baseValue * 100, 150)}%` }}
        >
          <div className="stat-bar-shine" />
        </div>
      </div>
    </div>
  );
}
