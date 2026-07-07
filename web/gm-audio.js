/** GM instrument playback — WebAudioFont presets + synth fallback */

const WAF_PLAYER = "https://surikov.github.io/webaudiofont/npm/technosax.min.js";
const WAF_BASE = "https://surikov.github.io/webaudiofontdata/sound/FluidR3_GM/";

const PRESET_BY_GM = {
  0: "0000_FluidR3_GM_sf2_file",
  1: "0010_FluidR3_GM_sf2_file",
  2: "0020_FluidR3_GM_sf2_file",
  3: "0030_FluidR3_GM_sf2_file",
  4: "0040_FluidR3_GM_sf2_file",
  5: "0050_FluidR3_GM_sf2_file",
  6: "0060_FluidR3_GM_sf2_file",
  7: "0070_FluidR3_GM_sf2_file",
  16: "0160_FluidR3_GM_sf2_file",
  17: "0170_FluidR3_GM_sf2_file",
  18: "0180_FluidR3_GM_sf2_file",
  19: "0190_FluidR3_GM_sf2_file",
  20: "0200_FluidR3_GM_sf2_file",
  21: "0210_FluidR3_GM_sf2_file",
  22: "0220_FluidR3_GM_sf2_file",
  23: "0230_FluidR3_GM_sf2_file",
};

const VOICE_GM = {
  salamander: 0,
  synth: null,
  "gm-grand": 0,
  "gm-rhodes": 4,
  "gm-hammond": 16,
  "gm-church": 19,
  "gm-reed": 20,
  "gm-rock-organ": 18,
  "gm-epiano2": 5,
  "gm-harpsichord": 6,
};

let playerPromise = null;
const presetCache = new Map();

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`script ${src}`));
    document.head.appendChild(s);
  });
}

async function ensurePlayer() {
  if (window.WebAudioFontPlayer) return window.WebAudioFontPlayer;
  if (!playerPromise) {
    playerPromise = loadScript(WAF_PLAYER).then(() => {
      if (!window.WebAudioFontPlayer) throw new Error("WebAudioFontPlayer missing");
      return window.WebAudioFontPlayer;
    });
  }
  return playerPromise;
}

function loadPresetScript(file) {
  if (presetCache.has(file)) return presetCache.get(file);
  const p = loadScript(`${WAF_BASE}${file}.js`).then(() => {
    const key = `_tone_${file}`;
    if (!window[key]) throw new Error(`preset ${file}`);
    return window[key];
  });
  presetCache.set(file, p);
  return p;
}

function synthFallback(ctx, dest, midi, dur, voiceId) {
  const t = ctx.currentTime;
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const g = ctx.createGain();
  g.connect(dest);
  const organ = voiceId?.includes("organ") || voiceId?.includes("hammond") || voiceId?.includes("church");
  const rhodes = voiceId?.includes("rhodes") || voiceId?.includes("epiano");
  if (organ) {
    [1, 2, 3, 4].forEach((h, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sawtooth" : "square";
      o.frequency.value = freq * (i + 1) * 0.5;
      const og = ctx.createGain();
      og.gain.value = 0.04 / (i + 1);
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur);
    });
  } else if (rhodes) {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    o.connect(g);
    o2.connect(g);
    o.start(t);
    o2.start(t);
    o.stop(t + dur);
    o2.stop(t + dur);
  } else {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    o.start(t);
    o.stop(t + dur);
  }
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
}

export function gmProgramForVoice(voiceId) {
  return VOICE_GM[voiceId] ?? VOICE_GM["gm-grand"];
}

export async function playGmNote(ctx, dest, midi, dur = 0.35, voiceId = "gm-grand") {
  if (!ctx || voiceId === "synth") {
    synthFallback(ctx, dest || ctx.destination, midi, dur, voiceId);
    return;
  }
  const gm = gmProgramForVoice(voiceId);
  const file = PRESET_BY_GM[gm] || PRESET_BY_GM[0];
  try {
    const Player = await ensurePlayer();
    const preset = await loadPresetScript(file);
    const player = new Player();
    player.loader.startPreset(ctx, preset, 0);
    player.queueWaveTable(ctx, dest || ctx.destination, preset, 0, midi, dur, 0.35);
  } catch (_) {
    synthFallback(ctx, dest || ctx.destination, midi, dur, voiceId);
  }
}

export { PRESET_BY_GM, VOICE_GM };