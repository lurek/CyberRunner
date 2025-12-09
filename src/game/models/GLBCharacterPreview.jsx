import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterPreviewLoader } from './CharacterPreviewLoader_FIXED';
import { CHARACTERS } from '../../utils/constants';

/**
 * ✅ FIXED GLBCharacterPreview Component
 * - Proper model scaling (larger, more visible)
 * - Correct positioning (ground level)
 * - Better auto-fit calculations
 * - Improved rotation handling
 */

// Rotating Platform Component
function RotatingPlatform({ color = '#5b8fc7', visible = true }) {
  const platformRef = useRef();

  useFrame(() => {
    if (platformRef.current && visible) {
      platformRef.current.rotation.y += 0.008;
    }
  });

  if (!visible) return null;

  return (
    <group ref={platformRef} position={[0, -0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[1.45, 1.52, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 1.2;
        const z = Math.sin(rad) * 1.2;
        return (
          <mesh
            key={i}
            position={[x, 0.08, z]}
            rotation={[-Math.PI / 2, 0, rad]}
          >
            <planeGeometry args={[0.05, 0.6]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function GLBCharacterPreview({
  characterId = 'default',
  rotating = false,
  showRotationToggle = true,
  floatEnabled = true,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, Math.PI, 0], // ✅ NEW: Default 180° to face camera
  showPlatform = false,
  platformColor = '#5b8fc7',
  playIdleAnimation = true,
  onLoad
}) {
  const groupRef = useRef();
  const characterRef = useRef();
  const loaderRef = useRef(new CharacterPreviewLoader());
  const [modelData, setModelData] = useState(null);
  const [autoFitScale, setAutoFitScale] = useState(1);
  const lastTimeRef = useRef(Date.now());
  const [dragRotation, setDragRotation] = useState({ y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let isMounted = true;
    let previousScene = null;

    const character = CHARACTERS[characterId];
    const modelPath = character?.modelPath || '/Main_Character.glb';

    console.log(`🔄 Loading ${characterId} from ${modelPath}...`);
    setModelData(null);

    loaderRef.current
      .load(modelPath)
      .then((data) => {
        previousScene = data.scene;
        if (isMounted) {
          setModelData(data);
          if (onLoad) onLoad(); // ✅ Notify parent
          console.log(`✅ Loaded ${characterId} successfully`);
          console.log(`🔎 Animation info:`, {
            hasMixer: !!data.mixer,
            animations: (data.animations && data.animations.length) || 0,
            hasIdleClip: !!data.idleClip,
            hasProcedural: !!data.proceduralAnimate
          });

          if (data.hasAnimations && data.idleClip) {
            console.log(`🎬 Playing idle animation: ${data.idleClip.name}`);
          } else {
            console.log(`⚠️ No idle animation, using procedural`);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`❌ Failed to load ${characterId}:`, err);
        }
      });

    return () => {
      isMounted = false;
      if (previousScene) {
        previousScene.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [characterId]);

  // ✅ Explicitly play idle animation when model is loaded and playIdleAnimation is true
  useEffect(() => {
    if (modelData && playIdleAnimation && modelData.playAnimation) {
      console.log(`🎬 GLBCharacterPreview: Triggering idle animation for ${characterId}`);
      modelData.playAnimation('idle');
    }
  }, [modelData, playIdleAnimation, characterId]);

  // Animation loop
  useFrame(() => {
    if (modelData && groupRef.current) {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (modelData.mixer) {
        modelData.mixer.update(deltaTime);
      } else if (modelData.proceduralAnimate) {
        modelData.proceduralAnimate(deltaTime, 'idle');
      }

      if (characterRef.current) {
        if (rotating) {
          characterRef.current.rotation.y += 0.01;
        } else if (dragRotation.y !== 0) {
          characterRef.current.rotation.y += dragRotation.y * 0.02;
          setDragRotation(prev => ({ y: prev.y * 0.85 }));
        }
      }
    }
  });

  // ✅ PREVIEW SCALING: Focused on VISUALS - make characters look big and attractive
  // NOTE: This is INTENTIONALLY DIFFERENT from gameplay scaling!
  // - Gameplay: normalizes to 3.5 units for consistent obstacle clearance
  // - Preview: uses larger scale for better visual presentation
  useEffect(() => {
    if (!modelData) return;
    try {
      const box = new THREE.Box3().setFromObject(modelData.scene);
      const size = new THREE.Vector3();
      box.getSize(size);

      const characterCfg = CHARACTERS[characterId] || {};
      const modelHeight = size.y || 1;

      // ✅ PREVIEW: Base scale for visual presentation
      // Same base as gameplay (3.5), but previewScale provides fine-tuning
      const previewTargetHeight = 3.5;
      const baseScale = previewTargetHeight / modelHeight;

      // ✅ Apply preview-specific multiplier (defaults to 1.0 to keep all characters big)
      const previewScale = characterCfg.previewScale || 1.0;
      const fit = baseScale * previewScale;

      // ✅ Clamp to reasonable preview range (allow smaller values for characters that need it)
      const clamped = Math.max(0.3, Math.min(4.0, fit));

      console.log(`📐 Preview fit for ${characterId}:`, {
        modelHeight: modelHeight.toFixed(2),
        baseScale: baseScale.toFixed(2),
        previewScale,
        fit: fit.toFixed(2),
        clamped: clamped.toFixed(2)
      });
      setAutoFitScale(clamped);
    } catch (e) {
      console.error(`❌ Auto-fit error:`, e);
      setAutoFitScale(1.5); // Larger fallback for preview
    }
  }, [modelData, characterId]);

  if (!modelData) return null;

  const handlePointerDown = (e) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (dragStartRef.current.x === 0 && dragStartRef.current.y === 0) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    setDragRotation({ y: deltaX });
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    dragStartRef.current = { x: 0, y: 0 };
  };

  // Get character-specific position offsets for platform alignment
  const characterCfg = CHARACTERS[characterId] || {};
  const xOffset = characterCfg.previewXOffset || 0;
  const yOffset = characterCfg.previewYOffset || 0;
  const zOffset = characterCfg.previewZOffset || 0;
  const adjustedPosition = [position[0] + xOffset, position[1] + yOffset, position[2] + zOffset];

  const content = (
    <group
      key={characterId}
      ref={groupRef}
      position={adjustedPosition}
      scale={[scale * autoFitScale, scale * autoFitScale, scale * autoFitScale]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <group ref={characterRef} rotation={rotation}>
        <primitive object={modelData.scene} />
      </group>

      {showPlatform && (
        <RotatingPlatform color={platformColor} visible={true} />
      )}
    </group>
  );

  if (floatEnabled) {
    return (
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.08} floatingRange={[-0.03, 0.03]}>
        {content}
      </Float>
    );
  }

  return content;
}
