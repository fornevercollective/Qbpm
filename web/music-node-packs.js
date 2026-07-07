/** AI-loadable node packs — instruments, beat pads, vocal chains, genre sessions */

import { GENRE_PRESETS, matchGenreFromText } from "./genre-presets.js";

function edge(from, to, port = "audio", fromPort = "main", toPort = "main") {
  return { from, to, port, fromPort, toPort };
}

function node(id, type, x, y, owner, data = {}, section = "music") {
  return { id, type, pos: [x, y], owner, section, params: { in: 1, out: 1 }, data };
}

export const MUSIC_NODE_PACKS = {
  "gm-keys": {
    id: "gm-keys",
    label: "GM Piano + Organ keys",
    description: "Piano, beatpad, notation with GM instrument map",
    genre: null,
    build(owner = "local") {
      const nodes = [
        node("pack-clock", "music.clock", 120, 200, owner),
        node("pack-piano", "music.piano", 300, 200, owner, { voice: "gm-grand", gmProgram: 0 }),
        node("pack-beat", "music.beatpad", 480, 200, owner, {
          pattern: { pads: { main: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] } },
        }),
        node("pack-notation", "music.notation", 660, 200, owner),
        node("pack-code", "music.code", 840, 200, owner, {
          lang: "strudel",
          code: 'n("c4 e4 g4").sound("piano")\n// organ: .sound("gm_church_organ")',
        }),
        node("pack-organ", "music.piano", 300, 340, owner, { voice: "gm-church", gmProgram: 19, label: "Organ" }),
      ];
      const edges = [
        edge("pack-clock", "pack-piano", "midi"),
        edge("pack-clock", "pack-beat", "clock"),
        edge("pack-piano", "pack-notation", "midi"),
        edge("pack-code", "pack-beat", "midi"),
        edge("pack-clock", "pack-organ", "midi"),
      ];
      return { nodes, edges, meta: { pack: "gm-keys" } };
    },
  },

  "billboard-vocal": {
    id: "billboard-vocal",
    label: "Billboard vocal chain",
    description: "LocalVQE clean → gate → EQ → comp → de-ess → autotune → reverb",
    genre: "rnb",
    build(owner = "local") {
      const y = 200;
      const nodes = [
        node("vox-mic", "audio.mic", 80, y, owner, { mic: "vocal", gain: 0, label: "Vocal mic" }, "vocal"),
        node("vox-localvqe", "audio.localvqe", 240, y, owner, { model: "v1.3", mode: "aec+ns+dereverb" }, "vocal"),
        node("vox-gate", "audio.gate", 400, y, owner, { threshold: -42, release: 80 }, "vocal"),
        node("vox-eq", "music.eq", 560, y, owner, { bands: { low: -2, mid: 1, high: 3 } }, "vocal"),
        node("vox-comp", "audio.comp", 720, y, owner, { ratio: 3, attack: 8, release: 120 }, "vocal"),
        node("vox-deess", "audio.deess", 880, y, owner, { freq: 6500, amount: 0.45 }, "vocal"),
        node("vox-autotune", "audio.autotune", 1040, y, owner, { speed: 12, key: "C", scale: "major" }, "vocal"),
        node("vox-mod", "audio.vocal", 1200, y, owner, { preset: "pop-lead", doubler: 0.15, width: 0.4 }, "vocal"),
        node("vox-reverb", "audio.reverb", 1360, y, owner, { room: 0.28, preDelay: 22 }, "vocal"),
        node("vox-out", "core.output", 1520, y, owner, {}, "vocal"),
      ];
      const edges = [
        edge("vox-mic", "vox-localvqe"),
        edge("vox-localvqe", "vox-gate"),
        edge("vox-gate", "vox-eq"),
        edge("vox-eq", "vox-comp"),
        edge("vox-comp", "vox-deess"),
        edge("vox-deess", "vox-autotune"),
        edge("vox-autotune", "vox-mod"),
        edge("vox-mod", "vox-reverb"),
        edge("vox-reverb", "vox-out"),
      ];
      return { nodes, edges, meta: { pack: "billboard-vocal", vocalChain: true } };
    },
  },

  "trap-beat": {
    id: "trap-beat",
    label: "Trap beat pad session",
    genre: "trap",
    build(owner = "local") {
      const g = GENRE_PRESETS.trap;
      return {
        nodes: [
          node("trap-clock", "music.clock", 120, 200, owner),
          node("trap-beat", "music.beatpad", 300, 200, owner, { pattern: { pads: g.padPattern } }),
          node("trap-code", "music.code", 480, 200, owner, { lang: "strudel", code: g.strudel }),
          node("trap-bass", "music.piano", 660, 200, owner, { voice: "gm-hammond", gmProgram: 38, label: "Sub" }),
        ],
        edges: [
          edge("trap-clock", "trap-beat", "clock"),
          edge("trap-code", "trap-beat", "midi"),
        ],
        meta: { pack: "trap-beat", genre: "trap", bpm: g.bpm },
      };
    },
  },

  "grok-chain": {
    id: "grok-chain",
    label: "Grok music chain",
    description: "clock → music.grok prompt handler → beatpad → piano → notation → code",
    genre: null,
    build(owner = "local") {
      const nodes = [
        node("grok-clock", "music.clock", 80, 200, owner),
        node("grok-handler", "music.grok", 280, 200, owner, {
          prompt: "suggest genre from song · load pack · arrange GM",
          mode: "chain",
          autoPack: true,
          autoGenre: true,
          autoArrange: true,
        }),
        node("grok-beat", "music.beatpad", 500, 200, owner),
        node("grok-piano", "music.piano", 500, 340, owner, { voice: "salamander" }),
        node("grok-notation", "music.notation", 720, 200, owner),
        node("grok-code", "music.code", 940, 200, owner, { lang: "strudel", code: 'n("c4").sound("piano")' }),
        node("grok-out", "core.output", 1120, 200, owner, {}, "music"),
      ];
      const edges = [
        edge("grok-clock", "grok-handler", "clock"),
        edge("grok-handler", "grok-beat", "midi"),
        edge("grok-handler", "grok-piano", "midi"),
        edge("grok-handler", "grok-notation", "data"),
        edge("grok-handler", "grok-code", "data"),
        edge("grok-beat", "grok-out", "audio"),
        edge("grok-piano", "grok-out", "audio"),
      ];
      return { nodes, edges, meta: { pack: "grok-chain", grokHandler: true } };
    },
  },

  "gospel-organ": {
    id: "gospel-organ",
    label: "Gospel organ + piano",
    genre: "gospel",
    build(owner = "local") {
      const g = GENRE_PRESETS.gospel;
      return {
        nodes: [
          node("gos-clock", "music.clock", 120, 200, owner),
          node("gos-organ", "music.piano", 300, 200, owner, { voice: "gm-hammond", gmProgram: 16 }),
          node("gos-piano", "music.piano", 300, 340, owner, { voice: "salamander", gmProgram: 0 }),
          node("gos-beat", "music.beatpad", 480, 200, owner, { pattern: { pads: g.padPattern } }),
          node("gos-code", "music.code", 660, 200, owner, { lang: "strudel", code: g.strudel }),
        ],
        edges: [
          edge("gos-clock", "gos-organ", "midi"),
          edge("gos-clock", "gos-piano", "midi"),
          edge("gos-clock", "gos-beat", "clock"),
          edge("gos-code", "gos-beat", "midi"),
        ],
        meta: { pack: "gospel-organ", genre: "gospel", bpm: g.bpm },
      };
    },
  },
};

export function listMusicNodePacks() {
  return Object.values(MUSIC_NODE_PACKS).map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    genre: p.genre,
  }));
}

export function buildMusicNodePack(packId, owner = "local") {
  const pack = MUSIC_NODE_PACKS[packId];
  if (!pack) throw new Error(`unknown music pack: ${packId}`);
  return pack.build(owner);
}

export function matchPackFromPrompt(text) {
  const low = String(text || "").toLowerCase();
  if (/vocal|autotune|billboard|studio|chain|localvqe|aec|noise/.test(low)) return "billboard-vocal";
  if (/trap|808|hip.?hop|drill/.test(low)) return "trap-beat";
  if (/gospel|organ|church|hammond/.test(low)) return "gospel-organ";
  if (/grok|chain|handler|prompt/.test(low)) return "grok-chain";
  if (/piano|organ|gm|keys|instrument/.test(low)) return "gm-keys";
  if (/beat|pad|sequenc|drum/.test(low)) return "trap-beat";
  return "gm-keys";
}

export function matchGenreFromPrompt(text) {
  return matchGenreFromText(text);
}