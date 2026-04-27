// ═══════════════════════════════════════════════════════════════
// ChessWhiz sound effects — synthesized in Web Audio.
// No audio files. No network. No dependencies.
//
// Each cue is a short envelope-shaped chord/burst. Designed for the
// jewel-tone, fantasy aesthetic: warm wood for moves, sparkle for
// promotions, gentle alerts for check, fanfares for aha moments.
//
// Public API:
//   sfx.move(), sfx.capture(), sfx.check(), sfx.castle(),
//   sfx.promotion(), sfx.win(), sfx.lose(), sfx.draw(),
//   sfx.coach(), sfx.aha(), sfx.click(), sfx.unlock(),
//   sfx.error(), sfx.xp()
//
// All cues are silent on the server (no AudioContext) and silent
// before the first user gesture (the AudioContext stays suspended
// until the user interacts with the page — browser autoplay rules).
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "chesswhiz.sfx";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.45;
    masterGain.connect(ctx.destination);
  }
  // Resume on first user interaction (browsers require it)
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    // Default ON
    return v !== "0";
  } catch {
    return true;
  }
}

export function setSfxEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch {}
}

export function getSfxEnabled(): boolean {
  return isEnabled();
}

// ─── Envelope helper ─────────────────────────────────────────────
// Plays an oscillator with a simple ADSR-shaped gain envelope.
function tone(opts: {
  freq: number;
  start?: number;        // seconds from now
  duration?: number;     // total duration including release
  attack?: number;       // attack time
  release?: number;      // release time
  type?: OscillatorType;
  peak?: number;         // peak gain (0..1)
  endFreq?: number;      // optional pitch glide target
  detune?: number;       // cents
}): void {
  const c = ensureContext();
  if (!c || !masterGain) return;
  const start = c.currentTime + (opts.start ?? 0);
  const dur = opts.duration ?? 0.18;
  const attack = opts.attack ?? 0.005;
  const release = opts.release ?? 0.12;
  const peak = opts.peak ?? 0.4;

  const osc = c.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, start);
  if (typeof opts.endFreq === "number") {
    osc.frequency.exponentialRampToValueAtTime(opts.endFreq, start + dur);
  }
  if (typeof opts.detune === "number") osc.detune.value = opts.detune;

  const g = c.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + attack);
  g.gain.setValueAtTime(peak, start + dur - release);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(g);
  g.connect(masterGain);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// Filtered noise burst — for percussion-like cues (move, capture)
function noiseBurst(opts: {
  start?: number;
  duration?: number;
  attack?: number;
  release?: number;
  peak?: number;
  filterFreq?: number;
  filterQ?: number;
  filterType?: BiquadFilterType;
}): void {
  const c = ensureContext();
  if (!c || !masterGain) return;
  const start = c.currentTime + (opts.start ?? 0);
  const dur = opts.duration ?? 0.08;
  const attack = opts.attack ?? 0.001;
  const release = opts.release ?? 0.06;
  const peak = opts.peak ?? 0.35;

  // ~0.2s of white noise is enough for any cue
  const sampleRate = c.sampleRate;
  const len = Math.max(1, Math.floor(sampleRate * Math.min(0.3, dur + 0.02)));
  const buf = c.createBuffer(1, len, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = opts.filterType ?? "bandpass";
  filter.frequency.value = opts.filterFreq ?? 1200;
  filter.Q.value = opts.filterQ ?? 4;

  const g = c.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + attack);
  g.gain.setValueAtTime(peak, start + dur - release);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(start);
  src.stop(start + dur + 0.05);
}

// ─── The 14 cues ──────────────────────────────────────────────────
function move(): void {
  if (!isEnabled()) return;
  // Wooden tap: short bandpass-noise click + a low triangle thud
  noiseBurst({ duration: 0.06, peak: 0.35, filterFreq: 1100, filterQ: 5, attack: 0.001, release: 0.05 });
  tone({ freq: 220, duration: 0.08, type: "triangle", peak: 0.18, release: 0.07 });
}

function capture(): void {
  if (!isEnabled()) return;
  // Heavier impact: low thump + brighter mid burst
  noiseBurst({ duration: 0.12, peak: 0.5, filterFreq: 600, filterQ: 3, attack: 0.001, release: 0.1 });
  tone({ freq: 140, endFreq: 90, duration: 0.16, type: "sawtooth", peak: 0.22, release: 0.13 });
  noiseBurst({ start: 0.005, duration: 0.06, peak: 0.25, filterFreq: 2200, filterQ: 6, attack: 0.001, release: 0.05 });
}

function check(): void {
  if (!isEnabled()) return;
  // Bright two-note alert (perfect fifth) with a touch of urgency
  tone({ freq: 880, duration: 0.14, type: "triangle", peak: 0.32, release: 0.1 });
  tone({ freq: 1320, start: 0.08, duration: 0.16, type: "triangle", peak: 0.26, release: 0.12 });
}

function castle(): void {
  if (!isEnabled()) return;
  // Two thuds — king + rook landing
  noiseBurst({ duration: 0.07, peak: 0.4, filterFreq: 800, filterQ: 4, release: 0.06 });
  tone({ freq: 180, duration: 0.1, type: "triangle", peak: 0.2, release: 0.08 });
  noiseBurst({ start: 0.13, duration: 0.07, peak: 0.4, filterFreq: 1000, filterQ: 4, release: 0.06 });
  tone({ start: 0.13, freq: 240, duration: 0.1, type: "triangle", peak: 0.2, release: 0.08 });
}

function promotion(): void {
  if (!isEnabled()) return;
  // Sparkle: ascending arpeggio with a shimmer on top
  const notes = [659.25, 783.99, 987.77, 1318.51]; // E5 G5 B5 E6
  notes.forEach((f, i) => {
    tone({ freq: f, start: i * 0.06, duration: 0.18, type: "sine", peak: 0.32, release: 0.14 });
    tone({ freq: f * 2, start: i * 0.06 + 0.01, duration: 0.16, type: "triangle", peak: 0.12, release: 0.13 });
  });
}

function win(): void {
  if (!isEnabled()) return;
  // Major-triad arpeggio + flourish
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
  notes.forEach((f, i) => {
    tone({ freq: f, start: i * 0.09, duration: 0.32, type: "triangle", peak: 0.35, release: 0.22 });
  });
  tone({ freq: 1567.98, start: 0.4, duration: 0.5, type: "sine", peak: 0.3, release: 0.4 });
}

function lose(): void {
  if (!isEnabled()) return;
  // Gentle descending three-note phrase (minor)
  const notes = [523.25, 466.16, 415.30]; // C5 A♯4 G♯4
  notes.forEach((f, i) => {
    tone({ freq: f, start: i * 0.18, duration: 0.45, type: "sine", peak: 0.28, release: 0.32 });
  });
}

function draw(): void {
  if (!isEnabled()) return;
  // Two-note neutral resolve
  tone({ freq: 587.33, duration: 0.28, type: "triangle", peak: 0.28, release: 0.22 });
  tone({ freq: 739.99, start: 0.18, duration: 0.36, type: "triangle", peak: 0.26, release: 0.28 });
}

function coach(): void {
  if (!isEnabled()) return;
  // Soft chime: bell-like sine with overtone, gentle attack
  tone({ freq: 880, duration: 0.45, attack: 0.01, type: "sine", peak: 0.22, release: 0.4 });
  tone({ freq: 1760, start: 0.005, duration: 0.4, attack: 0.01, type: "sine", peak: 0.08, release: 0.38 });
}

function aha(): void {
  if (!isEnabled()) return;
  // Fanfare — major sixth + perfect fifth + octave with sparkle
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 E5 G5 C6 E6
  notes.forEach((f, i) => {
    tone({ freq: f, start: i * 0.07, duration: 0.4, type: "triangle", peak: 0.36, release: 0.28 });
  });
  // Sparkle tail
  for (let i = 0; i < 3; i++) {
    tone({ freq: 2093 + i * 280, start: 0.45 + i * 0.05, duration: 0.18, type: "sine", peak: 0.18, release: 0.16 });
  }
}

function click(): void {
  if (!isEnabled()) return;
  // Short UI tick
  tone({ freq: 1200, duration: 0.04, type: "square", peak: 0.18, release: 0.035 });
}

function unlock(): void {
  if (!isEnabled()) return;
  // Lock-opens flourish
  tone({ freq: 392, duration: 0.12, type: "triangle", peak: 0.3, release: 0.1 });
  tone({ freq: 587.33, start: 0.08, duration: 0.18, type: "triangle", peak: 0.32, release: 0.14 });
  tone({ freq: 783.99, start: 0.18, duration: 0.32, type: "sine", peak: 0.34, release: 0.26 });
  tone({ freq: 1567.98, start: 0.22, duration: 0.32, type: "sine", peak: 0.18, release: 0.28 });
}

function error(): void {
  if (!isEnabled()) return;
  // Low minor-second buzz
  tone({ freq: 220, duration: 0.18, type: "sawtooth", peak: 0.22, release: 0.14 });
  tone({ freq: 207.65, start: 0.02, duration: 0.18, type: "sawtooth", peak: 0.22, release: 0.14, detune: -10 });
}

function xp(): void {
  if (!isEnabled()) return;
  // Coin-pickup chirp
  tone({ freq: 988, duration: 0.07, type: "square", peak: 0.22, release: 0.06 });
  tone({ freq: 1318.51, start: 0.05, duration: 0.12, type: "square", peak: 0.22, release: 0.1 });
}

export const sfx = {
  move, capture, check, castle, promotion,
  win, lose, draw,
  coach, aha,
  click, unlock, error, xp,
};
