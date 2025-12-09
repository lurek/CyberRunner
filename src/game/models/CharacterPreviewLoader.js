import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * CharacterPreviewLoader - Enhanced with better idle animation detection
 * ✅ FIXED: Properly detects and plays idle animations
 * ✅ FIXED: Better procedural pose for T-pose models
 * ✅ FIXED: Smoother animation transitions
 */
export class CharacterPreviewLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = {}; // Cache loaded models
  }

  /**
   * Load a character model with enhanced animation support
   * @param {string} characterPath - Path to GLB file
   * @returns {Promise} Resolves with { scene, animations, mixer, playAnimation, proceduralAnimate }
   */
  async load(characterPath) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        characterPath,
        (gltf) => {
          const scene = gltf.scene;
          const animations = gltf.animations || [];

          console.log(`📦 Loaded model from ${characterPath}`);
          console.log(`🎬 Found ${animations.length} animations:`, animations.map(a => a.name));

          // Setup scene
          scene.position.set(0, 0, 0);

          // Auto-scale model to fit in 3.5m height
          const box = new THREE.Box3().setFromObject(scene);
          const size = new THREE.Vector3();
          box.getSize(size);
          const scaleFactor = 3.5 / (size.y || 1);
          scene.scale.setScalar(scaleFactor);

          // Apply rotation FIRST (flip to face camera)
          scene.rotation.y = Math.PI;

          // Then recalculate bounding box AFTER scaling AND rotation
          scene.updateMatrixWorld(true);
          box.setFromObject(scene);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // ✅ FIX: Center the model on X and Z, and place feet at Y=0
          // This fixes models with displaced origins (like SWAT, Vanguard)
          scene.position.x = -center.x;
          scene.position.z = -center.z;
          scene.position.y = -box.min.y;

          console.log(`📍 Model centered: x=${scene.position.x.toFixed(2)}, z=${scene.position.z.toFixed(2)}, y=${scene.position.y.toFixed(2)}`);


          // Setup materials with better lighting
          scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                // Enhanced material properties for better appearance
                child.material.emissive = new THREE.Color(0x1a1a2e);
                child.material.emissiveIntensity = 0.4;
                child.material.metalness = 0.3;
                child.material.roughness = 0.7;
              }
            }
          });

          // Setup animations
          let mixer = null;
          let animationMap = {};
          let idleClip = null;

          if (animations.length > 0) {
            mixer = new THREE.AnimationMixer(scene);

            // Build animation map and find BEST idle animation
            animations.forEach(clip => {
              // Remove position tracks to prevent character from moving
              clip.tracks = clip.tracks.filter(track => !track.name.includes('.position'));

              animationMap[clip.name] = clip;

              const nameLower = clip.name.toLowerCase();

              // Priority order for idle detection:
              // 1. Exact "idle" match
              // 2. Contains "idle" or "stand" 
              // 3. Contains "rest", "wait", or "breathing"
              // 4. First animation with duration > 1 second
              // 5. Fallback to first animation

              if (nameLower === 'idle' || nameLower === 'idle.001' || nameLower === 'idle animation') {
                idleClip = clip;
                console.log(`✅ Found perfect idle animation: ${clip.name}`);
              } else if (!idleClip && (nameLower.includes('idle') || nameLower.includes('stand'))) {
                idleClip = clip;
                console.log(`✅ Found idle-like animation: ${clip.name}`);
              } else if (!idleClip && (nameLower.includes('rest') || nameLower.includes('wait') || nameLower.includes('breath'))) {
                idleClip = clip;
                console.log(`✅ Found rest/breathing animation: ${clip.name}`);
              } else if (!idleClip && clip.duration > 1.0) {
                // Prefer animations longer than 1 second as they're more likely to be idles
                idleClip = clip;
                console.log(`✅ Using long animation as idle: ${clip.name} (${clip.duration.toFixed(2)}s)`);
              } else if (!idleClip) {
                idleClip = clip;
                console.log(`⚠️ Using first available animation as idle: ${clip.name}`);
              }
            });

            // Start playing idle animation immediately
            if (idleClip) {
              console.log(`🎬 Starting idle animation: ${idleClip.name}`);
              const action = mixer.clipAction(idleClip);
              action.setLoop(THREE.LoopRepeat);
              action.timeScale = 1.0; // Normal speed
              action.reset().fadeIn(0.5).play();
              console.log(`✅ Idle animation playing: ${idleClip.name}`);
            }
          }

          // Prepare scene clone so each preview gets its own instance
          const sceneClone = scene.clone(true);

          // If we have a mixer, clone it for the cloned scene
          let mixerClone = null;
          if (mixer && idleClip) {
            mixerClone = new THREE.AnimationMixer(sceneClone);
            const actionClone = mixerClone.clipAction(idleClip);
            actionClone.setLoop(THREE.LoopRepeat);
            actionClone.timeScale = 1.0;
            actionClone.reset().fadeIn(0.5).play();
          }

          // Record base Y so procedural bob can offset from it
          const baseY = sceneClone.position.y;

          // Enhanced procedural pose application for T-pose models
          const applyProceduralPose = (root) => {
            // Find a skinned mesh and its bones
            let skinned = null;
            root.traverse((c) => {
              if (!skinned && c.isSkinnedMesh) skinned = c;
            });

            if (!skinned || !skinned.skeleton) {
              console.log('⚠️ No skinned mesh found for procedural pose');
              return;
            }

            const bones = skinned.skeleton.bones;
            console.log(`📦 Found ${bones.length} bones in skeleton`);

            const findBone = (patterns) => {
              const match = bones.find(b => {
                const lower = b.name.toLowerCase();
                return patterns.some(p => lower.includes(p));
              });
              if (match) console.log(`  ✓ Matched bone: ${match.name}`);
              return match;
            };

            // Comprehensive bone name patterns
            const leftArm = findBone([
              'leftarm', 'left_arm', 'l_arm', 'left_shoulder', 'l_shoulder',
              'armature.left', 'arm_l', 'bip_l_upperarm', 'upperarm_l',
              'shoulder_l', 'arm.l', 'shoulder.l', 'mixamorig:leftarm',
              'mixamorig:leftshoulder'
            ]);

            const rightArm = findBone([
              'rightarm', 'right_arm', 'r_arm', 'right_shoulder', 'r_shoulder',
              'armature.right', 'arm_r', 'bip_r_upperarm', 'upperarm_r',
              'shoulder_r', 'arm.r', 'shoulder.r', 'mixamorig:rightarm',
              'mixamorig:rightshoulder'
            ]);

            const leftForeArm = findBone([
              'leftforearm', 'left_forearm', 'l_forearm', 'left_lowerarm',
              'l_lowerarm', 'forearm_l', 'lowerarm_l', 'forearm.l',
              'mixamorig:leftforearm'
            ]);

            const rightForeArm = findBone([
              'rightforearm', 'right_forearm', 'r_forearm', 'right_lowerarm',
              'r_lowerarm', 'forearm_r', 'lowerarm_r', 'forearm.r',
              'mixamorig:rightforearm'
            ]);

            const spine = findBone([
              'spine', 'spine.001', 'spine1', 'spine.1', 'chest',
              'torso', 'armature', 'upperbody', 'mixamorig:spine',
              'mixamorig:spine1'
            ]);

            const head = findBone([
              'head', 'head.001', 'neck', 'bip_head', 'neck.001',
              'mixamorig:head', 'mixamorig:neck'
            ]);

            // Apply natural standing pose (drop arms from T-pose)
            try {
              if (leftArm) {
                leftArm.rotation.x = -0.35;  // Drop arm forward
                leftArm.rotation.z = 0.25;   // Slight outward
                leftArm.rotation.y = 0.08;   // Slight forward rotation
                console.log('✅ Left arm posed');
              }

              if (rightArm) {
                rightArm.rotation.x = -0.35; // Drop arm forward
                rightArm.rotation.z = -0.25; // Slight outward
                rightArm.rotation.y = -0.08; // Slight forward rotation
                console.log('✅ Right arm posed');
              }

              if (leftForeArm) {
                leftForeArm.rotation.x = -0.4;
                console.log('✅ Left forearm bent');
              }

              if (rightForeArm) {
                rightForeArm.rotation.x = -0.4;
                console.log('✅ Right forearm bent');
              }

              if (spine) {
                spine.rotation.x = 0.06; // Slight forward lean
                spine.rotation.z = 0.01; // Very slight tilt
                console.log('✅ Spine adjusted');
              }

              if (head) {
                head.rotation.x = 0.1; // Look slightly down
                console.log('✅ Head positioned');
              }

              console.log('✅ Procedural pose applied successfully');
            } catch (e) {
              console.error('❌ Error applying procedural pose:', e);
            }
          };

          // Create animation controller
          const playAnimation = (name) => {
            if (!mixerClone || !animationMap[name]) {
              console.warn(`❌ Animation "${name}" not found`);
              return false;
            }

            const clip = animationMap[name];
            const action = mixerClone.clipAction(clip);

            if (name === 'jump' || name === 'slide') {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopRepeat);
            }

            action.reset().fadeIn(0.3).play();
            console.log(`✅ Playing animation: ${name}`);
            return true;
          };

          // Enhanced fallback procedural animation for models without animations
          const proceduralAnimate = (deltaTime, action = 'idle') => {
            if (mixerClone) {
              mixerClone.update(deltaTime);
              return;
            }

            // Fallback: gentle breathing-like bob when no animations present
            if (sceneClone) {
              const t = Date.now() * 0.001;
              const bob = Math.sin(t * 1.5) * 0.025; // Subtle breathing motion
              const sway = Math.sin(t * 0.9) * 0.012; // Very slight sway
              const breathe = Math.sin(t * 2.0) * 0.008; // Chest breathing
              sceneClone.position.y = baseY + bob;
              sceneClone.rotation.z = sway;
              sceneClone.rotation.x = breathe * 0.5;
            }
          };

          // If no animations are present, apply relaxed procedural pose
          if (animations.length === 0) {
            console.log('⚠️ No animations found, applying procedural pose');
            try {
              applyProceduralPose(sceneClone);
            } catch (e) {
              console.warn('Could not apply procedural pose', e);
            }
          } else {
            console.log(`✅ Model has ${animations.length} animations, idle will play`);
          }

          resolve({
            scene: sceneClone,
            animations: animationMap,
            mixer: mixerClone,
            playAnimation,
            proceduralAnimate,
            hasAnimations: animations.length > 0,
            idleClip
          });
        },
        undefined,
        (err) => {
          console.error('❌ CharacterPreviewLoader: Failed to load', characterPath, err);
          reject(err);
        }
      );
    });
  }
}
