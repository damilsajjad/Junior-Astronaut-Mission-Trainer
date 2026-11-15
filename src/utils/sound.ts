export type SoundId =
  | 'click'
  | 'pickup'
  | 'alert'
  | 'success'
  | 'error'
  // Spacecraft & Mission Sounds
  | 'rocket-ignition'
  | 'rocket-launch'
  | 'rocket-shutdown'
  | 'rocket-landing'
  | 'landing-impact'
  | 'door-open'
  | 'door-close'
  | 'footstep'
  | 'machine-on'
  | 'machine-off'
  // Machine Sounds
  | 'op-oxygen'
  | 'op-co2'
  | 'op-water'
  | 'op-greenhouse'
  | 'op-solar'
  | 'machine-spark'
  | 'repair-success'
  // Warning & Emergency Sounds
  | 'warn-general'
  | 'alarm-critical'
  | 'warn-low-o2'
  | 'warn-low-battery'
  | 'warn-radiation'
  | 'warn-solar-damage'
  | 'warn-o2-leak'
  | 'warn-machine-fail'
  | 'emergency-resolved'
  // Astronaut Action Sounds
  | 'drink-water'
  | 'eat-food'
  | 'item-pickup'
  | 'item-drop'
  | 'inventory-open'
  | 'inventory-close'
  | 'repair-tool';

export type MusicTrack = 'off' | 'menu' | 'mission';

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let masterConfig = {
  muted: false,
  volume: 0.7,
  musicMuted: false,
  musicVolume: 0.35,
};
const lastPlayedAt: Record<string, number> = {};

// Ambient space/habitat drone state
let ambienceNodes: {
  gain: GainNode;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  noise: AudioBufferSourceNode;
  active: boolean;
} | null = null;

// Continuous background music track URLs (gapless Vorbis primary + MP3 fallback)
const MUSIC_TRACK_OGG = '/assets/audio/astro_cadet_space_theme.ogg';
const MUSIC_TRACK_MP3 = '/assets/audio/astro_cadet_space_theme.mp3';

// Continuous background music engine state (single persistent track across all screens)
let musicEngine: {
  masterGain: GainNode;
  duckGain: GainNode;
  toneFilter: BiquadFilterNode;
  source: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
  isLoading: boolean;
  isPlaying: boolean;
  offsetSeconds: number;
  startedAtCtxTime: number;
} | null = null;

let fallbackHtmlAudio: HTMLAudioElement | null = null;
let useFallbackHtmlAudio = false;

let desiredMusicTrack: MusicTrack = 'off';
let unlockHandlersBound = false;
let hasUserInteracted = false;
let isPageHidden = typeof document !== 'undefined' ? document.hidden : false;
let duckTimeoutId: number | null = null;

export const SOUND_COOLDOWNS_MS: Partial<Record<SoundId, number>> = {
  footstep: 260,
  'op-oxygen': 3000,
  'op-co2': 3000,
  'op-water': 3000,
  'op-greenhouse': 3200,
  'op-solar': 3200,
  'machine-spark': 3800,
  'warn-general': 4500,
  'alarm-critical': 6000,
  'warn-low-o2': 7500,
  'warn-low-battery': 7500,
  'warn-radiation': 7500,
  'warn-solar-damage': 7500,
  'warn-o2-leak': 7500,
  'warn-machine-fail': 5000,
  'repair-tool': 650,
};

export function setAudioConfig(cfg: {
  muted?: boolean;
  volume?: number;
  musicMuted?: boolean;
  musicVolume?: number;
}) {
  if (typeof cfg.muted === 'boolean') masterConfig.muted = cfg.muted;
  if (typeof cfg.volume === 'number') {
    masterConfig.volume = Math.max(0, Math.min(1, cfg.volume));
  }
  if (typeof cfg.musicMuted === 'boolean') masterConfig.musicMuted = cfg.musicMuted;
  if (typeof cfg.musicVolume === 'number') {
    masterConfig.musicVolume = Math.max(0, Math.min(1, cfg.musicVolume));
  }
  updateAmbienceGain();
  updateMusicGain();
}

export function getAudioConfig() {
  return { ...masterConfig };
}

export function canPlaySound(id: SoundId, nowMs = Date.now()): boolean {
  const cd = SOUND_COOLDOWNS_MS[id] ?? 60;
  const prev = lastPlayedAt[id] ?? 0;
  if (nowMs - prev < cd) return false;
  lastPlayedAt[id] = nowMs;
  return true;
}

function getExistingOrNewCtx(allowCreate = true): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx && allowCreate) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
    }
  }
  return audioCtx;
}

function getCtx(): AudioContext | null {
  const ctx = getExistingOrNewCtx(true);
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    // Gentle pink/brownish spectrum so rocket/air sounds are warm, not harsh static
    lastOut = (lastOut + 0.08 * white) / 1.08;
    data[i] = Math.max(-1, Math.min(1, lastOut * 2.8 + white * 0.25));
  }
  noiseBuffer = buf;
  return buf;
}

function updateAmbienceGain() {
  if (!ambienceNodes || !audioCtx) return;
  const target =
    ambienceNodes.active && !masterConfig.muted && !isPageHidden
      ? 0.032 * masterConfig.volume
      : 0.0001;
  try {
    ambienceNodes.gain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.25);
  } catch {
    // Ignore
  }
}

export function syncAmbience(active: boolean, muted?: boolean, volume?: number) {
  if (typeof muted === 'boolean') masterConfig.muted = muted;
  if (typeof volume === 'number') masterConfig.volume = Math.max(0, Math.min(1, volume));

  if (typeof window === 'undefined') return;
  if (!active || masterConfig.muted || masterConfig.volume <= 0.01 || isPageHidden) {
    if (ambienceNodes) {
      ambienceNodes.active = false;
      updateAmbienceGain();
    }
    return;
  }

  const ctx = getCtx();
  if (!ctx) return;

  try {
    if (!ambienceNodes) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(190, ctx.currentTime);
      filter.connect(gain);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(58, ctx.currentTime);
      osc1.connect(filter);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(116, ctx.currentTime);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);

      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      noise.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, ctx.currentTime);
      noise.connect(noiseGain);
      noiseGain.connect(filter);

      osc1.start();
      osc2.start();
      noise.start();

      ambienceNodes = { gain, osc1, osc2, noise, active: true };
    }
    ambienceNodes.active = true;
    updateAmbienceGain();
  } catch {
    // Ignore Web Audio init errors
  }
}

function shouldMusicPlay(): boolean {
  return (
    desiredMusicTrack !== 'off' &&
    !masterConfig.musicMuted &&
    masterConfig.musicVolume > 0.01 &&
    !isPageHidden
  );
}

function getTargetMusicGain(): number {
  if (!shouldMusicPlay()) return 0.0001;
  // Keep music comfortably gentle so mission alerts, voice, and SFX stay clear
  const modeScale = desiredMusicTrack === 'mission' ? 0.24 : 0.32;
  return Math.max(0.0001, masterConfig.musicVolume * modeScale);
}

function updateMusicGain() {
  if (useFallbackHtmlAudio && fallbackHtmlAudio) {
    const playing = shouldMusicPlay();
    fallbackHtmlAudio.volume = playing
      ? Math.max(0, Math.min(1, masterConfig.musicVolume * (desiredMusicTrack === 'mission' ? 0.24 : 0.32)))
      : 0;
    if (playing && hasUserInteracted && fallbackHtmlAudio.paused) {
      fallbackHtmlAudio.play().catch(() => {});
    } else if (!playing && !fallbackHtmlAudio.paused) {
      fallbackHtmlAudio.pause();
    }
    return;
  }

  if (!musicEngine || !audioCtx) return;
  const now = audioCtx.currentTime;
  const playing = shouldMusicPlay();
  const targetMaster = getTargetMusicGain();
  const targetCutoff = desiredMusicTrack === 'mission' ? 3200 : 7500;
  try {
    musicEngine.masterGain.gain.setTargetAtTime(targetMaster, now, playing ? 0.45 : 0.18);
    musicEngine.toneFilter.frequency.setTargetAtTime(targetCutoff, now, 0.5);
  } catch {
    // Ignore gain scheduling errors
  }
}

function duckMusic(durationMs = 1350) {
  if (!shouldMusicPlay()) return;

  if (useFallbackHtmlAudio && fallbackHtmlAudio) {
    const normalVol = Math.max(
      0,
      Math.min(1, masterConfig.musicVolume * (desiredMusicTrack === 'mission' ? 0.24 : 0.32))
    );
    fallbackHtmlAudio.volume = normalVol * 0.35;
    if (duckTimeoutId !== null) window.clearTimeout(duckTimeoutId);
    duckTimeoutId = window.setTimeout(() => {
      duckTimeoutId = null;
      if (fallbackHtmlAudio && shouldMusicPlay()) {
        fallbackHtmlAudio.volume = getTargetMusicGain();
      }
    }, durationMs);
    return;
  }

  if (!musicEngine || !audioCtx) return;
  const now = audioCtx.currentTime;
  try {
    musicEngine.duckGain.gain.cancelScheduledValues(now);
    musicEngine.duckGain.gain.setTargetAtTime(0.32, now, 0.06);
    if (duckTimeoutId !== null) {
      window.clearTimeout(duckTimeoutId);
    }
    duckTimeoutId = window.setTimeout(() => {
      duckTimeoutId = null;
      if (musicEngine && audioCtx) {
        try {
          musicEngine.duckGain.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.45);
        } catch {
          // Ignore
        }
      }
    }, durationMs);
  } catch {
    // Ignore
  }
}

async function fetchAndDecodeMusicBuffer(ctx: AudioContext): Promise<AudioBuffer> {
  const candidates = [MUSIC_TRACK_OGG, MUSIC_TRACK_MP3];
  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const arrayBuf = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      return decoded;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Unable to load background music track');
}

function initFallbackHtmlAudio() {
  if (typeof window === 'undefined' || fallbackHtmlAudio) return;
  useFallbackHtmlAudio = true;
  const audio = new Audio(MUSIC_TRACK_MP3);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = shouldMusicPlay() ? getTargetMusicGain() : 0;
  fallbackHtmlAudio = audio;
  if (shouldMusicPlay() && hasUserInteracted) {
    audio.play().catch(() => {});
  }
}

function startBufferLoop(ctx: AudioContext) {
  const engine = musicEngine;
  if (!engine || !engine.buffer || engine.isPlaying || !shouldMusicPlay()) return;

  const source = ctx.createBufferSource();
  source.buffer = engine.buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = engine.buffer.duration;
  source.connect(engine.toneFilter);

  const offset =
    engine.buffer.duration > 0 ? engine.offsetSeconds % engine.buffer.duration : 0;

  // Gentle fade-in from silence when starting/resuming playback
  engine.masterGain.gain.cancelScheduledValues(ctx.currentTime);
  engine.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);

  source.start(0, offset);
  engine.source = source;
  engine.isPlaying = true;
  engine.startedAtCtxTime = ctx.currentTime - offset;
  updateMusicGain();
}

function pauseBufferLoop() {
  if (useFallbackHtmlAudio && fallbackHtmlAudio) {
    fallbackHtmlAudio.pause();
    return;
  }
  const engine = musicEngine;
  if (!engine || !audioCtx) return;

  if (engine.isPlaying && engine.source && engine.buffer) {
    const elapsed = Math.max(0, audioCtx.currentTime - engine.startedAtCtxTime);
    engine.offsetSeconds = elapsed % engine.buffer.duration;
    try {
      engine.source.stop();
      engine.source.disconnect();
    } catch {
      // Ignore stop errors if already ended
    }
    engine.source = null;
    engine.isPlaying = false;
  }
  updateMusicGain();
}

function ensureMusicEngineRunning() {
  if (typeof window === 'undefined') return;
  if (!shouldMusicPlay()) {
    pauseBufferLoop();
    return;
  }

  if (useFallbackHtmlAudio) {
    initFallbackHtmlAudio();
    updateMusicGain();
    return;
  }

  // Respect browser autoplay restrictions: wait for first user interaction
  if (!hasUserInteracted && (!audioCtx || audioCtx.state === 'suspended')) {
    return;
  }

  const ctx = getExistingOrNewCtx(true);
  if (!ctx) {
    initFallbackHtmlAudio();
    return;
  }

  if (ctx.state === 'suspended') {
    ctx
      .resume()
      .then(() => {
        if (ctx.state === 'running' && shouldMusicPlay()) {
          startOrLoadMusicEngine(ctx);
        }
      })
      .catch(() => {});
    return;
  }

  startOrLoadMusicEngine(ctx);
}

function startOrLoadMusicEngine(ctx: AudioContext) {
  if (!musicEngine) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);

    const duckGain = ctx.createGain();
    duckGain.gain.setValueAtTime(1.0, ctx.currentTime);

    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(desiredMusicTrack === 'mission' ? 3200 : 7500, ctx.currentTime);

    toneFilter.connect(duckGain);
    duckGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    musicEngine = {
      masterGain,
      duckGain,
      toneFilter,
      source: null,
      buffer: null,
      isLoading: false,
      isPlaying: false,
      offsetSeconds: 0,
      startedAtCtxTime: ctx.currentTime,
    };
  }

  if (musicEngine.buffer) {
    if (!musicEngine.isPlaying) {
      startBufferLoop(ctx);
    } else {
      updateMusicGain();
    }
    return;
  }

  if (!musicEngine.isLoading) {
    musicEngine.isLoading = true;
    fetchAndDecodeMusicBuffer(ctx)
      .then((decoded) => {
        if (!musicEngine) return;
        musicEngine.buffer = decoded;
        musicEngine.isLoading = false;
        if (shouldMusicPlay() && ctx.state === 'running') {
          startBufferLoop(ctx);
        }
      })
      .catch(() => {
        if (musicEngine) musicEngine.isLoading = false;
        initFallbackHtmlAudio();
      });
  }
}

export function initAudioUnlockHandlers() {
  if (typeof window === 'undefined' || unlockHandlersBound) return;
  unlockHandlersBound = true;

  const handleUserGesture = () => {
    hasUserInteracted = true;
    if (useFallbackHtmlAudio) {
      updateMusicGain();
      return;
    }
    const ctx = getExistingOrNewCtx(true);
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          if (shouldMusicPlay()) {
            startOrLoadMusicEngine(ctx);
          }
        })
        .catch(() => {});
    } else if (shouldMusicPlay()) {
      startOrLoadMusicEngine(ctx);
    }
  };

  window.addEventListener('pointerdown', handleUserGesture, { passive: true });
  window.addEventListener('keydown', handleUserGesture, { passive: true });

  const handleVisibilityChange = () => {
    isPageHidden = document.hidden;
    if (isPageHidden) {
      pauseBufferLoop();
      updateAmbienceGain();
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend().catch(() => {});
      }
    } else {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx
          .resume()
          .then(() => {
            if (shouldMusicPlay() && audioCtx) {
              startOrLoadMusicEngine(audioCtx);
            }
            updateAmbienceGain();
          })
          .catch(() => {});
      } else if (shouldMusicPlay()) {
        ensureMusicEngineRunning();
        updateAmbienceGain();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', () => {
    pauseBufferLoop();
  });
}

export function syncMusic(
  track: MusicTrack,
  opts?: { musicMuted?: boolean; musicVolume?: number }
) {
  if (typeof opts?.musicMuted === 'boolean') masterConfig.musicMuted = opts.musicMuted;
  if (typeof opts?.musicVolume === 'number') {
    masterConfig.musicVolume = Math.max(0, Math.min(1, opts.musicVolume));
  }

  desiredMusicTrack = track;

  if (typeof window === 'undefined') return;
  initAudioUnlockHandlers();

  if (!shouldMusicPlay()) {
    pauseBufferLoop();
    return;
  }

  if (musicEngine && musicEngine.isPlaying) {
    // Track is already looping continuously — smoothly update gain/tone without restarting
    updateMusicGain();
    return;
  }

  ensureMusicEngineRunning();
}


function playOsc(
  ctx: AudioContext,
  vol: number,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  startOffset: number,
  duration: number,
  peakGain: number
) {
  const t0 = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freqStart), t0);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + duration);
  }
  const g = Math.max(0.001, peakGain * vol);
  gain.gain.setValueAtTime(0.0008, t0);
  gain.gain.linearRampToValueAtTime(g, t0 + Math.min(0.025, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0005, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playNoise(
  ctx: AudioContext,
  vol: number,
  filterType: BiquadFilterType,
  freqStart: number,
  freqEnd: number,
  q: number,
  startOffset: number,
  duration: number,
  peakGain: number
) {
  const t0 = ctx.currentTime + startOffset;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(q, t0);
  filter.frequency.setValueAtTime(Math.max(40, freqStart), t0);
  if (freqEnd !== freqStart) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + duration);
  }

  const gain = ctx.createGain();
  const g = Math.max(0.001, peakGain * vol);
  gain.gain.setValueAtTime(0.0008, t0);
  gain.gain.linearRampToValueAtTime(g, t0 + Math.min(0.06, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0005, t0 + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.03);
}

export function playSound(
  id: SoundId,
  opts?: { muted?: boolean; volume?: number; bypassCooldown?: boolean }
) {
  const isMuted = opts?.muted ?? masterConfig.muted;
  const vol = opts?.volume ?? masterConfig.volume;
  if (isMuted || vol <= 0.01) return;
  if (!opts?.bypassCooldown && !canPlaySound(id)) return;

  const ctx = getCtx();
  if (!ctx) return;

  if (
    id === 'alert' ||
    id === 'alarm-critical' ||
    id === 'emergency-resolved' ||
    id.startsWith('warn-') ||
    id.startsWith('rocket-') ||
    id === 'landing-impact'
  ) {
    duckMusic(id.startsWith('rocket-') ? 1800 : 1200);
  }

  try {
    switch (id) {
      case 'click':
        playOsc(ctx, vol, 'sine', 520, 700, 0, 0.07, 0.06);
        break;
      case 'pickup':
      case 'item-pickup':
        playOsc(ctx, vol, 'triangle', 460, 680, 0, 0.09, 0.09);
        playOsc(ctx, vol, 'triangle', 680, 920, 0.07, 0.11, 0.08);
        break;
      case 'item-drop':
        playOsc(ctx, vol, 'sine', 260, 120, 0, 0.11, 0.09);
        playNoise(ctx, vol, 'lowpass', 600, 220, 1, 0.01, 0.1, 0.06);
        break;
      case 'inventory-open':
        playNoise(ctx, vol, 'bandpass', 600, 1600, 2.2, 0, 0.12, 0.07);
        playOsc(ctx, vol, 'triangle', 420, 640, 0.02, 0.1, 0.05);
        break;
      case 'inventory-close':
        playNoise(ctx, vol, 'bandpass', 1500, 520, 2.2, 0, 0.11, 0.06);
        playOsc(ctx, vol, 'triangle', 540, 360, 0.02, 0.09, 0.05);
        break;
      case 'success':
      case 'repair-success':
        playOsc(ctx, vol, 'triangle', 523.25, 523.25, 0, 0.12, 0.09);
        playOsc(ctx, vol, 'triangle', 659.25, 659.25, 0.08, 0.14, 0.09);
        playOsc(ctx, vol, 'triangle', 783.99, 783.99, 0.16, 0.22, 0.1);
        break;
      case 'emergency-resolved':
        playOsc(ctx, vol, 'triangle', 523.25, 523.25, 0, 0.12, 0.09);
        playOsc(ctx, vol, 'triangle', 659.25, 659.25, 0.09, 0.12, 0.09);
        playOsc(ctx, vol, 'triangle', 783.99, 783.99, 0.18, 0.14, 0.09);
        playOsc(ctx, vol, 'triangle', 1046.5, 1046.5, 0.28, 0.28, 0.1);
        break;
      case 'error':
        playOsc(ctx, vol, 'square', 220, 150, 0, 0.14, 0.045);
        break;
      case 'footstep': {
        const pitch = 105 + Math.random() * 28;
        playOsc(ctx, vol, 'sine', pitch, 55, 0, 0.065, 0.045);
        playNoise(ctx, vol, 'bandpass', 750, 380, 1.5, 0, 0.05, 0.028);
        break;
      }
      case 'door-open':
        playNoise(ctx, vol, 'bandpass', 1800, 700, 1.8, 0, 0.28, 0.08);
        playOsc(ctx, vol, 'sine', 220, 440, 0.06, 0.28, 0.07);
        break;
      case 'door-close':
        playOsc(ctx, vol, 'sine', 380, 160, 0, 0.22, 0.07);
        playOsc(ctx, vol, 'triangle', 110, 52, 0.2, 0.14, 0.1);
        break;
      case 'rocket-ignition':
        playNoise(ctx, vol, 'lowpass', 240, 620, 0.9, 0, 0.95, 0.14);
        playOsc(ctx, vol, 'sawtooth', 68, 95, 0.05, 0.85, 0.06);
        break;
      case 'rocket-launch':
        playNoise(ctx, vol, 'lowpass', 520, 980, 0.7, 0, 1.8, 0.16);
        playOsc(ctx, vol, 'sawtooth', 85, 130, 0, 1.5, 0.055);
        break;
      case 'rocket-shutdown':
        playNoise(ctx, vol, 'lowpass', 720, 140, 1.0, 0, 0.75, 0.11);
        playOsc(ctx, vol, 'triangle', 190, 65, 0, 0.65, 0.065);
        break;
      case 'rocket-landing':
        playNoise(ctx, vol, 'bandpass', 620, 320, 0.9, 0, 1.15, 0.13);
        playOsc(ctx, vol, 'sawtooth', 120, 72, 0, 1.0, 0.05);
        break;
      case 'landing-impact':
        playOsc(ctx, vol, 'sine', 95, 38, 0, 0.26, 0.15);
        playNoise(ctx, vol, 'lowpass', 360, 110, 1.2, 0, 0.22, 0.12);
        playOsc(ctx, vol, 'triangle', 330, 440, 0.18, 0.22, 0.06);
        break;
      case 'machine-on':
        playOsc(ctx, vol, 'triangle', 320, 640, 0, 0.12, 0.08);
        playOsc(ctx, vol, 'sine', 640, 880, 0.08, 0.14, 0.07);
        break;
      case 'machine-off':
        playOsc(ctx, vol, 'triangle', 540, 220, 0, 0.16, 0.075);
        break;
      case 'op-oxygen':
        playOsc(ctx, vol, 'sine', 340, 480, 0, 0.12, 0.05);
        playOsc(ctx, vol, 'sine', 480, 620, 0.12, 0.14, 0.045);
        break;
      case 'op-co2':
        playNoise(ctx, vol, 'bandpass', 520, 960, 1.6, 0, 0.35, 0.06);
        break;
      case 'op-water':
        playOsc(ctx, vol, 'sine', 680, 960, 0, 0.08, 0.05);
        playOsc(ctx, vol, 'sine', 820, 1120, 0.09, 0.08, 0.045);
        break;
      case 'op-greenhouse':
        playOsc(ctx, vol, 'triangle', 587.33, 659.25, 0, 0.16, 0.055);
        playNoise(ctx, vol, 'highpass', 2200, 3200, 1.2, 0.05, 0.16, 0.03);
        break;
      case 'op-solar':
        playOsc(ctx, vol, 'sine', 440, 587, 0, 0.18, 0.055);
        break;
      case 'machine-spark':
        playNoise(ctx, vol, 'highpass', 2400, 4200, 2.5, 0, 0.09, 0.08);
        playOsc(ctx, vol, 'sawtooth', 980, 320, 0.02, 0.08, 0.04);
        break;
      case 'repair-tool':
        playOsc(ctx, vol, 'square', 620, 740, 0, 0.05, 0.045);
        playOsc(ctx, vol, 'square', 740, 860, 0.09, 0.05, 0.045);
        playOsc(ctx, vol, 'triangle', 880, 1020, 0.18, 0.08, 0.05);
        break;
      case 'drink-water':
        playOsc(ctx, vol, 'sine', 380, 660, 0, 0.09, 0.075);
        playOsc(ctx, vol, 'sine', 460, 780, 0.11, 0.09, 0.075);
        playOsc(ctx, vol, 'triangle', 660, 990, 0.22, 0.15, 0.07);
        break;
      case 'eat-food':
        playNoise(ctx, vol, 'bandpass', 1200, 700, 1.5, 0, 0.07, 0.07);
        playNoise(ctx, vol, 'bandpass', 1400, 820, 1.5, 0.11, 0.07, 0.07);
        playOsc(ctx, vol, 'triangle', 520, 680, 0.21, 0.14, 0.065);
        break;
      case 'alert':
      case 'warn-general':
        playOsc(ctx, vol, 'triangle', 480, 440, 0, 0.14, 0.07);
        playOsc(ctx, vol, 'triangle', 480, 440, 0.18, 0.14, 0.07);
        break;
      case 'alarm-critical':
        playOsc(ctx, vol, 'sawtooth', 520, 420, 0, 0.16, 0.055);
        playOsc(ctx, vol, 'sawtooth', 620, 520, 0.2, 0.16, 0.055);
        break;
      case 'warn-low-o2':
        playOsc(ctx, vol, 'sine', 580, 420, 0, 0.18, 0.075);
        playOsc(ctx, vol, 'sine', 520, 360, 0.22, 0.2, 0.07);
        break;
      case 'warn-low-battery':
        playOsc(ctx, vol, 'triangle', 440, 260, 0, 0.18, 0.075);
        playOsc(ctx, vol, 'triangle', 340, 200, 0.2, 0.2, 0.07);
        break;
      case 'warn-radiation':
        playOsc(ctx, vol, 'square', 1100, 1100, 0, 0.025, 0.045);
        playOsc(ctx, vol, 'square', 1250, 1250, 0.07, 0.025, 0.045);
        playOsc(ctx, vol, 'square', 1100, 1100, 0.14, 0.025, 0.045);
        playOsc(ctx, vol, 'triangle', 560, 480, 0.2, 0.18, 0.065);
        break;
      case 'warn-solar-damage':
        playOsc(ctx, vol, 'sawtooth', 390, 260, 0, 0.16, 0.05);
        playOsc(ctx, vol, 'triangle', 520, 440, 0.18, 0.16, 0.07);
        break;
      case 'warn-o2-leak':
        playNoise(ctx, vol, 'highpass', 1800, 2600, 2.0, 0, 0.2, 0.075);
        playOsc(ctx, vol, 'triangle', 540, 400, 0.12, 0.16, 0.07);
        break;
      case 'warn-machine-fail':
        playOsc(ctx, vol, 'sawtooth', 310, 180, 0, 0.15, 0.055);
        playOsc(ctx, vol, 'triangle', 460, 390, 0.16, 0.16, 0.07);
        break;
    }
  } catch {
    // Graceful audio fallback
  }
}

export function playTone(
  type: 'click' | 'pickup' | 'alert' | 'success' | 'error',
  muted?: boolean,
  volume?: number
) {
  playSound(type, { muted, volume });
}
