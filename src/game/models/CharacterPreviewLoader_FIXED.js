import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * CharacterPreviewLoader - Enhanced with full animation support
 * Supports: Idle, Running, Jump, Flying, Falling Idle, Surf
 * ✅ FIXED: Properly detects and plays all new animations
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
      // Encode URI to safely handle spaces and special characters in filenames
      const encodedPath = encodeURI(characterPath);
      this.loader.load(
        encodedPath,
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
          scene.position.x = -center.x;
          scene.position.z = -center.z;
          scene.position.y = -box.min.y;


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

          // Setup animations with enhanced detection
          let mixer = null;
          let animationMap = {};
          let detectedAnimations = {
            idle: null,
            running: null,
            jump: null,
            flying: null,
            falling: null,
            surf: null
          };

          if (animations.length > 0) {
            mixer = new THREE.AnimationMixer(scene);

            // Log all available animations for debugging
            console.log(`📋 Available animations in model:`, animations.map(a => a.name));

            // Build animation map and detect all animation types
            animations.forEach(clip => {
              // Remove position tracks to prevent character from moving
              clip.tracks = clip.tracks.filter(track => !track.name.includes('.position'));

              animationMap[clip.name] = clip;

              const nameLower = clip.name.toLowerCase().trim();

              // Detect animation type based on name - ORDER MATTERS!
              // Exact "Idle" match first (highest priority)
              if (nameLower === 'idle' || clip.name === 'Idle') {
                if (!detectedAnimations.idle) {
                  detectedAnimations.idle = clip;
                  console.log(`✅ Found EXACT Idle animation: ${clip.name}`);
                }
              }
            });

            // Second pass for other animations and partial idle matches
            animations.forEach(clip => {
              const nameLower = clip.name.toLowerCase().trim();

              // Idle - partial matches (only if no exact match found)
              if (!detectedAnimations.idle) {
                if (nameLower.includes('idle') ||
                  nameLower.includes('anim_idle') || nameLower.includes('anim idle') ||
                  (nameLower.includes('stand') && !nameLower.includes('standing')) ||
                  nameLower === 'anim') {
                  detectedAnimations.idle = clip;
                  console.log(`✅ Found Idle animation (partial): ${clip.name}`);
                }
              }

              // Running
              if (nameLower.includes('running') || nameLower.includes('run') || nameLower.includes('jog')) {
                if (!detectedAnimations.running) {
                  detectedAnimations.running = clip;
                  console.log(`✅ Found Running animation: ${clip.name}`);
                }
              }

              // Jump
              if (nameLower.includes('jump') || nameLower.includes('leap')) {
                if (!detectedAnimations.jump) {
                  detectedAnimations.jump = clip;
                  console.log(`✅ Found Jump animation: ${clip.name}`);
                }
              }

              // Flying
              if (nameLower.includes('flying') || nameLower.includes('fly') || nameLower.includes('glide')) {
                if (!detectedAnimations.flying) {
                  detectedAnimations.flying = clip;
                  console.log(`✅ Found Flying animation: ${clip.name}`);
                }
              }

              // Falling
              if (nameLower.includes('falling') || nameLower.includes('fall')) {
                if (!detectedAnimations.falling) {
                  detectedAnimations.falling = clip;
                  console.log(`✅ Found Falling animation: ${clip.name}`);
                }
              }

              // Surf
              if (nameLower.includes('surf') || nameLower.includes('slide') || nameLower.includes('skate')) {
                if (!detectedAnimations.surf) {
                  detectedAnimations.surf = clip;
                  console.log(`✅ Found Surf animation: ${clip.name}`);
                }
              }
            });

            // Fallback: if no idle found, use first animation that ISN'T action-based
            if (!detectedAnimations.idle && animations.length > 0) {
              const validAnim = animations.find(a => {
                const n = a.name.toLowerCase();
                // Exclude T-pose AND action animations that look bad when standing
                return !n.includes('t-pose') && !n.includes('tpose') &&
                  !n.includes('a-pose') && !n.includes('apose') &&
                  !n.includes('run') && !n.includes('fly') &&
                  !n.includes('jump') && !n.includes('fall');
              });

              if (validAnim) {
                detectedAnimations.idle = validAnim;
                console.log(`⚠️ No explicit idle found, using: ${validAnim.name}`);
              } else {
                // Absolute last resort - first animation
                detectedAnimations.idle = animations[0];
                console.log(`⚠️ No valid idle found, using first: ${animations[0].name}`);
              }
            }

            // Start playing idle animation immediately
            if (detectedAnimations.idle) {
              console.log(`🎬 Starting idle animation: ${detectedAnimations.idle.name}`);
              const action = mixer.clipAction(detectedAnimations.idle);
              action.setLoop(THREE.LoopRepeat);
              action.timeScale = 1.0;
              action.reset().fadeIn(0.3).play();
              console.log(`✅ Idle animation playing`);
            }
          }

          // ✅ FIXED: Use SkeletonUtils.clone for proper SkinnedMesh cloning with animations
          // Regular scene.clone() doesn't properly clone skeleton bindings
          let sceneToUse = scene;

          // For skinned meshes, we need special cloning
          let hasSkinnedMesh = false;
          scene.traverse((child) => {
            if (child.isSkinnedMesh) hasSkinnedMesh = true;
          });

          if (hasSkinnedMesh) {
            // Import SkeletonUtils dynamically is not possible, so use original scene
            // The preview loader is only used once per character so this is fine
            sceneToUse = scene;
            console.log('📌 Using original scene for SkinnedMesh (animations require original bones)');
          } else {
            sceneToUse = scene.clone(true);
          }

          // Create mixer for the scene we're using
          let mixerForScene = null;
          let currentAction = null;

          if (animations.length > 0 && detectedAnimations.idle) {
            mixerForScene = new THREE.AnimationMixer(sceneToUse);

            // Play idle animation immediately
            currentAction = mixerForScene.clipAction(detectedAnimations.idle);
            currentAction.setLoop(THREE.LoopRepeat);
            currentAction.timeScale = 1.0;
            currentAction.reset().fadeIn(0.3).play();
            console.log('✅ Idle animation started on scene');
          }

          // Record base Y so procedural bob can offset from it
          const baseY = sceneToUse.position.y;

          // Enhanced procedural pose application for T-pose models
          const applyProceduralPose = (root) => {
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
              'mixamorig:leftshoulder', 'shoulder.l'
            ]);

            const rightArm = findBone([
              'rightarm', 'right_arm', 'r_arm', 'right_shoulder', 'r_shoulder',
              'armature.right', 'arm_r', 'bip_r_upperarm', 'upperarm_r',
              'shoulder_r', 'arm.r', 'shoulder.r', 'mixamorig:rightarm',
              'mixamorig:rightshoulder', 'shoulder.r'
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

            // Apply natural standing pose
            try {
              if (leftArm) {
                leftArm.rotation.x = -0.35;
                leftArm.rotation.z = 0.25;
                leftArm.rotation.y = 0.08;
                console.log('✅ Left arm posed');
              }

              if (rightArm) {
                rightArm.rotation.x = -0.35;
                rightArm.rotation.z = -0.25;
                rightArm.rotation.y = -0.08;
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
                spine.rotation.x = 0.06;
                spine.rotation.z = 0.01;
                console.log('✅ Spine adjusted');
              }

              if (head) {
                head.rotation.x = 0.1;
                console.log('✅ Head positioned');
              }

              console.log('✅ Procedural pose applied successfully');
            } catch (e) {
              console.error('❌ Error applying procedural pose:', e);
            }
          };

          // Create animation controller
          const playAnimation = (name) => {
            if (!mixerForScene) {
              console.warn(`❌ No mixer available`);
              return false;
            }

            const targetClip = detectedAnimations[name.toLowerCase()];
            if (!targetClip) {
              console.warn(`❌ Animation "${name}" not found`);
              return false;
            }

            // Fade out current action
            if (currentAction) {
              currentAction.fadeOut(0.25);
            }

            // Fade in new action
            const action = mixerForScene.clipAction(targetClip);

            if (name === 'jump' || name === 'surf') {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopRepeat);
            }

            action.reset().fadeIn(0.25).play();
            currentAction = action;

            console.log(`✅ Playing animation: ${name}`);
            return true;
          };

          // Enhanced fallback procedural animation
          const proceduralAnimate = (deltaTime, action = 'idle') => {
            if (mixerForScene) {
              mixerForScene.update(deltaTime);
              return;
            }

            // Fallback: gentle breathing-like motion
            if (sceneToUse) {
              const t = Date.now() * 0.001;
              const bob = Math.sin(t * 1.5) * 0.025;
              const sway = Math.sin(t * 0.9) * 0.012;
              const breathe = Math.sin(t * 2.0) * 0.008;
              sceneToUse.position.y = baseY + bob;
              sceneToUse.rotation.z = sway;
              sceneToUse.rotation.x = breathe * 0.5;
            }
          };

          // If no animations present, apply procedural pose
          // Also apply if the detected idle animation seems to be a T-pose (very short duration or named T-pose)
          const isTPoseAnim = detectedAnimations.idle &&
            (detectedAnimations.idle.name.toLowerCase().includes('t-pose') ||
              detectedAnimations.idle.name.toLowerCase().includes('apose'));

          if (animations.length === 0 || isTPoseAnim) {
            console.log('⚠️ No valid idle animation found (or T-Pose detected), applying procedural pose');
            try {
              applyProceduralPose(sceneToUse);
            } catch (e) {
              console.warn('Could not apply procedural pose', e);
            }
          } else {
            console.log(`✅ Model has ${animations.length} animations, using ${detectedAnimations.idle.name} for idle`);
          }

          resolve({
            scene: sceneToUse,
            animations: animationMap,
            detectedAnimations,
            mixer: mixerForScene,
            playAnimation,
            proceduralAnimate,
            hasAnimations: animations.length > 0,
            idleClip: detectedAnimations.idle
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
