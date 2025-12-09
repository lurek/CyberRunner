import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { CHARACTERS } from '../utils/constants';
import { GLBCharacterPreview } from '../game/models/GLBCharacterPreview';
import { characterModelCache } from '../game/models/CharacterModelCache';
import { getPerformanceManager } from '../utils/performance/PerformanceManager';
import * as THREE from 'three';
import './CharacterPreviewPage_FINAL.css';

/**
 * 3D Character Model with Idle Animation
 */
// Character3DModel removed in favor of GLBCharacterPreview

/**
 * Animated Platform
 * Clean flat platform without circular ring
 */
function AnimatedPlatform({ reduceMotion = false }) {
  const platformRef = useRef();

  useFrame((state) => {
    // ✅ OPTIMIZATION: Skip animation on reduced motion devices
    if (platformRef.current && !reduceMotion) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      platformRef.current.material.emissiveIntensity = 0.4 + pulse * 0.2;
    }
  });

  return (
    <group position={[0, -1.2, 0]}>
      {/* Main platform - flat disc (reduced segments for performance) */}
      <mesh ref={platformRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 24]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#0066aa"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Subtle edge glow (reduced segments) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.2, 1.35, 24]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* ✅ REMOVED: pointLight saves ~1ms GPU time on low-end devices */}
    </group>
  );
}



/**
 * Camera Controller
 */
function CameraController({ characterHeight }) {
  const { camera } = useThree();

  useEffect(() => {
    // Position camera to see full character + platform
    // Camera slightly below eye level looking slightly up at character
    const distance = 3.5;
    camera.position.set(0, characterHeight * 0.4, distance);
    camera.lookAt(0, characterHeight * 0.25, 0);
  }, [camera, characterHeight]);

  return null;
}

/**
 * Main Character Preview Page
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

  // ✅ Performance-aware UI settings
  const uiSettings = useMemo(() => {
    const perfManager = getPerformanceManager();
    return perfManager.getUISettings();
  }, []);

  useEffect(() => {
    const stats = characterModelCache.getStats();
    console.log(`📊 Cache Status:`, stats);
  }, []);

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

  const handleAction = () => {
    console.log(`🎮 handleAction called. isOwned=${isOwned}, canAfford=${canAfford}, onCharacterPurchase=${!!onCharacterPurchase}`);

    if (isEquipped) {
      console.log('Already equipped');
      return;
    }

    if (isFree || isOwned) {
      console.log(`Equipping ${currentCharacterId}`);
      if (onEquip) onEquip(currentCharacterId);
    } else if (canAfford && onCharacterPurchase) {
      console.log(`Purchasing ${currentCharacterId} for ${character.cost}`);
      onCharacterPurchase(currentCharacterId);
    } else {
      console.log(`Cannot afford: need ${character.cost}, have ${totalCoins}`);
    }
  };

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
      {/* Header - sticky */}
      <div className="preview-header">
        <button className="back-button" onClick={onBack} title="Go back">
          ←
        </button>
        <h1 className="preview-title">CHARACTERS</h1>
        <div className="currency-display">
          <span className="coins">🪙 {totalCoins.toLocaleString()}</span>
        </div>
      </div>

      {/* Scrollable content wrapper */}
      <div className="preview-content">
        {/* 3D Viewer */}
        <div className="character-viewer">
          <Canvas
            shadows={!uiSettings.disableShadows}
            gl={{
              antialias: !uiSettings.reduceMotion,
              alpha: true,
              preserveDrawingBuffer: false,
              powerPreference: 'high-performance'
            }}
            dpr={uiSettings.menuDpr}
          >
            <CameraController characterHeight={3.5} />
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[5, 5, 5]}
              intensity={1.2}
              castShadow={!uiSettings.disableShadows}
              shadow-mapSize={uiSettings.disableShadows ? [256, 256] : [1024, 1024]}
            />
            {/* ✅ OPTIMIZATION: Only show extra lights on capable devices */}
            {!uiSettings.reduceMotion && (
              <pointLight position={[-3, 3, 3]} intensity={0.8} color="#00ccff" />
            )}

            <Suspense fallback={null}>
              <GLBCharacterPreview
                characterId={currentCharacterId}
                rotating={false}
                floatEnabled={!uiSettings.reduceMotion}
                scale={1}
                position={[0, -1.15, 0]}
                showPlatform={false}
                playIdleAnimation={true}
                onLoad={() => setModelLoaded(true)}
              />
            </Suspense>

            <AnimatedPlatform reduceMotion={uiSettings.reduceMotion} />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 2}
              autoRotate={false}
              rotateSpeed={0.5}
            />

            {uiSettings.useEnvironmentPreset && <Environment preset="city" />}
          </Canvas>

          {!modelLoaded && (
            <div className="model-loading">
              <div className="loading-spinner"></div>
              <p>Loading {character.name}...</p>
            </div>
          )}

          <div className="rotation-hint">↻ Drag to rotate</div>

          <button className="nav-arrow left" onClick={handlePrevious} title="Previous">‹</button>
          <button className="nav-arrow right" onClick={handleNext} title="Next">›</button>
        </div>

        {/* Character Info */}
        <div className="character-info-panel">
          <div className="character-header-info">
            <h2 className="character-name">{character.name}</h2>
            <p className="character-description">{character.description}</p>
          </div>

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

          <div className="tab-content">
            {selectedTab === 'stats' && (
              <div className="stats-grid">
                <StatBar label="Speed" value={character.stats.speed} icon="⚡" baseValue={1.0} />
                <StatBar label="Jump Height" value={character.stats.jumpHeight} icon="🦘" baseValue={1.0} />
                <StatBar label="Magnet Radius" value={character.stats.magnetRadius} icon="🧲" baseValue={1.0} />
              </div>
            )}

            {selectedTab === 'abilities' && (
              <div className="abilities-info">
                <div className="ability-card">
                  <div className="ability-icon">🎬</div>
                  <div className="ability-details">
                    <h4>Smooth Animations</h4>
                    <p>Idle, run, jump, fly, fall, and surf animations</p>
                  </div>
                </div>

                {character.stats.speed > 1.0 && (
                  <div className="ability-card">
                    <div className="ability-icon">⚡</div>
                    <div className="ability-details">
                      <h4>Enhanced Speed</h4>
                      <p>+{((character.stats.speed - 1) * 100).toFixed(0)}% speed bonus</p>
                    </div>
                  </div>
                )}

                {character.stats.jumpHeight > 1.0 && (
                  <div className="ability-card">
                    <div className="ability-icon">🦘</div>
                    <div className="ability-details">
                      <h4>Power Jump</h4>
                      <p>+{((character.stats.jumpHeight - 1) * 100).toFixed(0)}% jump bonus</p>
                    </div>
                  </div>
                )}

                {character.stats.magnetRadius > 1.0 && (
                  <div className="ability-card">
                    <div className="ability-icon">🧲</div>
                    <div className="ability-details">
                      <h4>Coin Magnet</h4>
                      <p>+{((character.stats.magnetRadius - 1) * 100).toFixed(0)}% magnet radius</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={`action-button ${buttonConfig.className}`}
            onClick={handleAction}
            disabled={buttonConfig.disabled}
          >
            {buttonConfig.text}
          </button>

          <div className="character-indicator">
            {characterIds.map((id) => (
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
