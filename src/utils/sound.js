// ✅ PERF: Create a single, lazily-initialized AudioContext
let audioCtx = null;
let masterVolume = 0.3; // ✅ FIX #20: Master volume control

// ✅ FIX #20: Sound volume normalization
const SOUND_VOLUMES = {
  'coin': 0.7,
  'crash': 0.8,
  'jump': 0.6,
  'slide': 0.5,
  'powerup': 0.75,
  'shield_hit': 0.4,
  'heal': 0.6,
  'laser_zap': 0.5,
  'barrier_whoosh': 0.4,
  'grapple': 0.6,
  'boost': 0.7,
  'death': 0.9
};

function getAudioContext() {
  if (!audioCtx) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    } catch(e) {
      console.warn("AudioContext not supported by this browser.");
    }
  }
  return audioCtx;
}

// ✅ FIX #20: Set master volume
export function setMasterVolume(volume) {
  masterVolume = Math.max(0, Math.min(1.0, volume));
  console.log(`🔊 Master volume: ${(masterVolume * 100).toFixed(0)}%`);
}

export function playSfx(type, enabled) {
  // ✅ PERF: Use shared AudioContext
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return; // AudioContext not supported or failed to init

  try {
    // ✅ PERF: Removed context creation from here
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    let duration = 0.18;
    
    // ✅ FIX #20: Normalize volume based on sound type
    const typeVolume = SOUND_VOLUMES[type] || 0.5;
    const normalizedVolume = (typeVolume / 10) * masterVolume;
    gain.gain.setValueAtTime(Math.min(0.3, normalizedVolume), ctx.currentTime);

    if (type === 'coin') {
      osc.frequency.value = 900;
      duration = 0.1;
    } else if (type === 'crash') { 
      osc.type='sawtooth'; 
      osc.frequency.value = 120; 
      duration = 0.3;
    } else if (type === 'jump') {
      osc.frequency.value = 520;
      duration = 0.1;
    } else if (type === 'slide') {
      osc.frequency.value = 320;
      duration = 0.1;
    } else if (type === 'powerup') { 
      osc.type='square'; 
      osc.frequency.value = 1100; 
    }
    // --- NEW SOUNDS ---
    else if (type === 'heal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
      duration = 0.2;
    } else if (type === 'laser_zap') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      duration = 0.1;
    } else if (type === 'barrier_whoosh') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);
      duration = 0.15;
    }
    // --- END NEW SOUNDS ---
    
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); 
    osc.stop(ctx.currentTime + duration);
  } catch(e) {
    // Silent fail
  }
}