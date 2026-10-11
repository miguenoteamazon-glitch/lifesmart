// Web Audio API synthesizer for DeskBuddy (Zero external assets, works 100% offline & in iFrames)

export type AmbientSoundType = 'ocean' | 'forest' | 'rain' | 'river' | 'campfire' | 'space';

export interface AmbientSoundOption {
  id: AmbientSoundType;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  badge: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  {
    id: 'ocean',
    name: 'Océano & Olas Marinas',
    shortName: 'Océano',
    icon: '🌊',
    description: 'Vaivén rítmico y relajante de olas rompiendo en la orilla',
    badge: 'Zen & Calma'
  },
  {
    id: 'forest',
    name: 'Bosque & Brisa Natural',
    shortName: 'Bosque',
    icon: '🌲',
    description: 'Brisa suave entre los árboles con sutiles trinos de la naturaleza',
    badge: 'Paz & Armonía'
  },
  {
    id: 'rain',
    name: 'Lluvia Serena & Gotas',
    shortName: 'Lluvia',
    icon: '🌧️',
    description: 'Lluvia constante y relajante que aísla el ruido exterior',
    badge: 'Focus Profundo'
  },
  {
    id: 'river',
    name: 'Río de Montaña',
    shortName: 'Río',
    icon: '🏞️',
    description: 'Corriente cristalina fluyendo suavemente sobre las piedras',
    badge: 'Claridad Mental'
  },
  {
    id: 'campfire',
    name: 'Fogata Nocturna',
    shortName: 'Fogata',
    icon: '🔥',
    description: 'Calidez envolvente y suave crepitar de leña en el fuego',
    badge: 'Acogedor'
  },
  {
    id: 'space',
    name: 'Focus Espacial / Sci-Fi',
    shortName: 'Espacio',
    icon: '🚀',
    description: 'Zumbido binaural de cabina espacial a 108 Hz',
    badge: 'Productividad'
  }
];

let audioCtx: AudioContext | null = null;
let currentAmbientType: AmbientSoundType | null = null;
let activeAmbientNodes: AudioNode[] = [];
let activeAmbientGainNode: GainNode | null = null;
let activeTimers: number[] = [];
let currentVolume = 0.06;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a high-tech sci-fi UI blip / confirmation sound
 */
export function playTechBlip(frequency = 880, type: OscillatorType = 'sine', duration = 0.08) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/**
 * Play a rewarding XP / Task completed sci-fi fanfare
 */
export function playTaskCompleteSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch {}
}

/**
 * Play Pomodoro timer completed alarm
 */
export function playPomodoroBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 880, 587.33, 880, 1174.66]; // D5, A5, D5, A5, D6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch {}
}

/**
 * Helper to generate noise buffers (Pink, Brown, or White)
 */
function createNoiseBuffer(ctx: AudioContext, type: 'pink' | 'brown' | 'white' = 'pink', durationSeconds = 3): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  } else {
    // Pink noise (Paul Kellet's filtered algorithm)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

/**
 * Clear all current ambient nodes and timers
 */
function cleanupCurrentAmbientNodes() {
  activeTimers.forEach(id => clearInterval(id));
  activeTimers = [];

  if (activeAmbientGainNode && audioCtx) {
    try {
      activeAmbientGainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    } catch {}
  }

  const nodesToClean = [...activeAmbientNodes];
  const gainToClean = activeAmbientGainNode;
  activeAmbientNodes = [];
  activeAmbientGainNode = null;
  currentAmbientType = null;

  setTimeout(() => {
    nodesToClean.forEach(n => {
      try {
        if ('stop' in n && typeof (n as any).stop === 'function') {
          (n as any).stop();
        }
        n.disconnect();
      } catch {}
    });
    try {
      gainToClean?.disconnect();
    } catch {}
  }, 450);
}

/**
 * Set ambient volume dynamically (0.0 to 1.0)
 */
export function setAmbientVolume(volume: number) {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (activeAmbientGainNode && audioCtx) {
    try {
      activeAmbientGainNode.gain.linearRampToValueAtTime(currentVolume, audioCtx.currentTime + 0.1);
    } catch {}
  }
}

/**
 * Stop active ambient sound
 */
export function stopAmbientSound() {
  cleanupCurrentAmbientNodes();
}

/**
 * Check currently active ambient sound
 */
export function getActiveAmbientSound(): { type: AmbientSoundType | null; isPlaying: boolean; volume: number } {
  return {
    type: currentAmbientType,
    isPlaying: activeAmbientGainNode !== null,
    volume: currentVolume
  };
}

/**
 * Start or switch ambient sound generator
 */
export function startAmbientSound(type: AmbientSoundType, volume = currentVolume): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    // Clean up previous sound
    cleanupCurrentAmbientNodes();

    currentVolume = volume;
    currentAmbientType = type;

    // Master ambient gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(currentVolume, ctx.currentTime + 1.2);
    masterGain.connect(ctx.destination);
    activeAmbientGainNode = masterGain;

    const nodes: AudioNode[] = [];

    switch (type) {
      case 'ocean': {
        // OCEAN & SEA WAVES: Filtered brown/pink noise modulated by slow LFO swell
        const buffer = createNoiseBuffer(ctx, 'pink', 4);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(240, ctx.currentTime);
        lowpass.Q.setValueAtTime(1.8, ctx.currentTime);

        const waveGain = ctx.createGain();
        waveGain.gain.setValueAtTime(0.2, ctx.currentTime);

        // LFO for wave swelling (~11.5 seconds cycle)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.087, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.4, ctx.currentTime);

        // Filter modulation: deeper in trough (220 Hz), open on crest (850 Hz)
        const lfoFilterGain = ctx.createGain();
        lfoFilterGain.gain.setValueAtTime(320, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(waveGain.gain);

        lfo.connect(lfoFilterGain);
        lfoFilterGain.connect(lowpass.frequency);

        // Deep sub-rumble for ocean mass
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(48, ctx.currentTime);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.03, ctx.currentTime);
        subOsc.connect(subGain);
        subGain.connect(masterGain);

        noiseSource.connect(lowpass);
        lowpass.connect(waveGain);
        waveGain.connect(masterGain);

        noiseSource.start();
        lfo.start();
        subOsc.start();

        nodes.push(noiseSource, lowpass, waveGain, lfo, lfoGain, lfoFilterGain, subOsc, subGain);
        break;
      }

      case 'forest': {
        // FOREST & BREEZE: Gentle rustling foliage + subtle periodic birdsong
        const buffer = createNoiseBuffer(ctx, 'pink', 4);
        const windNoise = ctx.createBufferSource();
        windNoise.buffer = buffer;
        windNoise.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(650, ctx.currentTime);
        bandpass.Q.setValueAtTime(1.5, ctx.currentTime);

        // Wind gusting LFO
        const windLfo = ctx.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.setValueAtTime(220, ctx.currentTime);
        windLfo.connect(windLfoGain);
        windLfoGain.connect(bandpass.frequency);

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.35, ctx.currentTime);

        windNoise.connect(bandpass);
        bandpass.connect(windGain);
        windGain.connect(masterGain);

        windNoise.start();
        windLfo.start();
        nodes.push(windNoise, bandpass, windLfo, windLfoGain, windGain);

        // Periodic delicate birdsong chirp (every 5-8 seconds)
        const playBirdChirp = () => {
          if (!activeAmbientGainNode || !audioCtx) return;
          try {
            const birdCtx = audioCtx;
            const now = birdCtx.currentTime;
            const baseFreq = 2600 + Math.random() * 800; // 2.6 - 3.4 kHz
            
            // 2-3 note trill
            const noteCount = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < noteCount; i++) {
              const noteStart = now + i * 0.08;
              const osc = birdCtx.createOscillator();
              const g = birdCtx.createGain();

              osc.type = 'sine';
              osc.frequency.setValueAtTime(baseFreq + (i % 2 === 0 ? 300 : -200), noteStart);
              osc.frequency.exponentialRampToValueAtTime(baseFreq + 500, noteStart + 0.06);

              g.gain.setValueAtTime(0.001, noteStart);
              g.gain.linearRampToValueAtTime(0.018, noteStart + 0.02);
              g.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.07);

              osc.connect(g);
              g.connect(masterGain);

              osc.start(noteStart);
              osc.stop(noteStart + 0.075);
            }
          } catch {}
        };

        // Schedule first chirp and interval
        const timerId = window.setInterval(() => {
          if (Math.random() > 0.3) playBirdChirp();
        }, 5500);
        activeTimers.push(timerId);
        setTimeout(playBirdChirp, 1500);
        break;
      }

      case 'rain': {
        // RAIN: Dense wash of raindrops with high-pass and high-frequency sparkle
        const buffer = createNoiseBuffer(ctx, 'pink', 3);
        const rainNoise = ctx.createBufferSource();
        rainNoise.buffer = buffer;
        rainNoise.loop = true;

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(950, ctx.currentTime);

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(4200, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.45, ctx.currentTime);

        rainNoise.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(rainGain);
        rainGain.connect(masterGain);

        // Low roof rumble for immersion
        const bufferBrown = createNoiseBuffer(ctx, 'brown', 3);
        const rumbleSource = ctx.createBufferSource();
        rumbleSource.buffer = bufferBrown;
        rumbleSource.loop = true;

        const rumbleFilter = ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(200, ctx.currentTime);
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.setValueAtTime(0.18, ctx.currentTime);

        rumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(masterGain);

        rainNoise.start();
        rumbleSource.start();
        nodes.push(rainNoise, highpass, lowpass, rainGain, rumbleSource, rumbleFilter, rumbleGain);
        break;
      }

      case 'river': {
        // MOUNTAIN RIVER: Resonant bandpass bubbling stream
        const buffer = createNoiseBuffer(ctx, 'pink', 3);
        const waterNoise = ctx.createBufferSource();
        waterNoise.buffer = buffer;
        waterNoise.loop = true;

        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(750, ctx.currentTime);
        filter1.Q.setValueAtTime(3.2, ctx.currentTime);

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'bandpass';
        filter2.frequency.setValueAtTime(1400, ctx.currentTime);
        filter2.Q.setValueAtTime(2.5, ctx.currentTime);

        // Micro-LFOs for bubbling water movement
        const bubbleLfo1 = ctx.createOscillator();
        bubbleLfo1.frequency.setValueAtTime(1.4, ctx.currentTime);
        const bubbleGain1 = ctx.createGain();
        bubbleGain1.gain.setValueAtTime(180, ctx.currentTime);
        bubbleLfo1.connect(bubbleGain1);
        bubbleGain1.connect(filter1.frequency);

        const streamGain = ctx.createGain();
        streamGain.gain.setValueAtTime(0.38, ctx.currentTime);

        waterNoise.connect(filter1);
        waterNoise.connect(filter2);
        filter1.connect(streamGain);
        filter2.connect(streamGain);
        streamGain.connect(masterGain);

        waterNoise.start();
        bubbleLfo1.start();
        nodes.push(waterNoise, filter1, filter2, bubbleLfo1, bubbleGain1, streamGain);
        break;
      }

      case 'campfire': {
        // CAMPFIRE: Warm low flame rumble + periodic randomized wooden crackles
        const buffer = createNoiseBuffer(ctx, 'brown', 4);
        const flameNoise = ctx.createBufferSource();
        flameNoise.buffer = buffer;
        flameNoise.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(360, ctx.currentTime);

        const flameGain = ctx.createGain();
        flameGain.gain.setValueAtTime(0.35, ctx.currentTime);

        flameNoise.connect(lowpass);
        lowpass.connect(flameGain);
        flameGain.connect(masterGain);

        flameNoise.start();
        nodes.push(flameNoise, lowpass, flameGain);

        // Wood crackle generator
        const playWoodCrackle = () => {
          if (!activeAmbientGainNode || !audioCtx) return;
          try {
            const fireCtx = audioCtx;
            const now = fireCtx.currentTime;
            const crackleLen = 0.015 + Math.random() * 0.025;
            const osc = fireCtx.createOscillator();
            const g = fireCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600 + Math.random() * 1400, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + crackleLen);

            g.gain.setValueAtTime(0.04 + Math.random() * 0.04, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + crackleLen);

            osc.connect(g);
            g.connect(masterGain);

            osc.start(now);
            osc.stop(now + crackleLen);
          } catch {}
        };

        const crackleInterval = window.setInterval(() => {
          if (Math.random() > 0.4) playWoodCrackle();
        }, 700);
        activeTimers.push(crackleInterval);
        break;
      }

      case 'space':
      default: {
        // SPACE FOCUS COCKPIT: Deep 108Hz binaural calm drone + filtered brown noise
        const buffer = createNoiseBuffer(ctx, 'brown', 3);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, ctx.currentTime);

        const humOsc = ctx.createOscillator();
        humOsc.type = 'sine';
        humOsc.frequency.setValueAtTime(108, ctx.currentTime); // 108 Hz calming drone

        const humGain = ctx.createGain();
        humGain.gain.setValueAtTime(0.035, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(masterGain);

        humOsc.connect(humGain);
        humGain.connect(masterGain);

        noiseSource.start();
        humOsc.start();

        nodes.push(noiseSource, filter, humOsc, humGain);
        break;
      }
    }

    activeAmbientNodes = nodes;
    return true;
  } catch (err) {
    console.error('Error starting ambient sound:', err);
    return false;
  }
}

/**
 * Toggle synthesized ambient sound (backwards-compatible with previous toggleAmbientNoise)
 */
export function toggleAmbientNoise(enabled: boolean, volume = 0.06, type: AmbientSoundType = 'forest'): boolean {
  if (!enabled) {
    stopAmbientSound();
    return false;
  } else {
    return startAmbientSound(type || currentAmbientType || 'forest', volume);
  }
}
