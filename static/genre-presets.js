/** Genre/style presets — GM instrument map, beat patterns, theory, Strudel */

import { GENRE_PARENTS, GENRE_SUBGENRES, buildGenrePresets } from "./genre-taxonomy.js";

export const GM_PIANO = [
  { program: 0, id: "grand", label: "Acoustic Grand", strudel: "gm_piano" },
  { program: 1, id: "bright", label: "Bright Grand", strudel: "gm_bright_acoustic_piano" },
  { program: 4, id: "rhodes", label: "Electric Piano", strudel: "gm_epiano1" },
  { program: 5, id: "chorus-ep", label: "Chorused EP", strudel: "gm_epiano2" },
  { program: 6, id: "harpsichord", label: "Harpsichord", strudel: "gm_harpsichord" },
];

export const GM_ORGAN = [
  { program: 16, id: "drawbar", label: "Drawbar/Hammond", strudel: "gm_drawbar_organ" },
  { program: 17, id: "perc-organ", label: "Percussive Organ", strudel: "gm_percussive_organ" },
  { program: 18, id: "rock-organ", label: "Rock Organ", strudel: "gm_rock_organ" },
  { program: 19, id: "church", label: "Church/Pipe", strudel: "gm_church_organ" },
  { program: 20, id: "reed", label: "Reed/Harmonium", strudel: "gm_reed_organ" },
];

export const GENRE_PRESETS = buildGenrePresets();

export function resolveGenre(id) {
  if (!id) return GENRE_PRESETS.pop;
  const direct = GENRE_PRESETS[id];
  if (direct) return direct;
  const norm = id.toLowerCase().replace(/\s+/g, "-");
  if (GENRE_PRESETS[norm]) return GENRE_PRESETS[norm];
  for (const g of Object.values(GENRE_PRESETS)) {
    if (g.aliases?.some((a) => a.toLowerCase() === norm)) return g;
    if (g.tags?.some((t) => t.toLowerCase() === norm)) return g;
  }
  return GENRE_PRESETS.pop;
}

export function listGenres() {
  return Object.values(GENRE_PRESETS).map((g) => ({
    id: g.id,
    label: g.label,
    parent: g.parent,
    bpm: g.bpm,
    tags: g.tags,
  }));
}

export function listGenreTree() {
  return Object.entries(GENRE_PARENTS).map(([id, p]) => ({
    id,
    label: p.label,
    subgenres: Object.entries(GENRE_SUBGENRES)
      .filter(([, s]) => s.parent === id)
      .map(([sid, s]) => ({ id: sid, label: s.label || sid, bpm: s.bpm ?? p.bpm })),
  }));
}

export function matchGenreFromText(text) {
  const low = String(text || "").toLowerCase();
  const tokens = low.split(/[\s,./+|]+/).filter(Boolean);

  for (const g of Object.values(GENRE_PRESETS)) {
    if (low.includes(g.id) || low.includes(g.label?.toLowerCase())) return g.id;
    if (g.parent && low.includes(g.parent)) return g.id;
    for (const a of g.aliases || []) {
      if (low.includes(a.toLowerCase())) return g.id;
    }
    for (const t of g.tags || []) {
      if (tokens.includes(t.toLowerCase())) return g.id;
    }
  }

  const hints = [
    ["drill", "drill"], ["boom-bap", "boom-bap"], ["lo-fi", "lo-fi-hip-hop"], ["lofi", "lo-fi-hip-hop"],
    ["reggaeton", "reggaeton"], ["house", "house"], ["techno", "techno"], ["dubstep", "dubstep"],
    ["metal", "heavy-metal"], ["punk", "punk"], ["disco", "disco"], ["worship", "worship"],
    ["cinematic", "cinematic"], ["synthwave", "synthwave"], ["neo-soul", "neo-soul"],
    ["country", "country"], ["bluegrass", "bluegrass"], ["ska", "ska"], ["ambient", "ambient"],
    ["gospel", "gospel"], ["organ", "gospel"], ["hammond", "gospel"], ["jazz", "jazz"],
    ["trap", "trap"], ["808", "trap"], ["rnb", "rnb"], ["r&b", "rnb"], ["pop", "pop"],
    ["rock", "rock"], ["edm", "edm"], ["classical", "classical"], ["folk", "folk"],
  ];
  for (const [needle, id] of hints) {
    if (low.includes(needle)) return id;
  }
  return "pop";
}

export function suggestGenreFromSong(song) {
  const tempo = song?.tempo || 120;
  const title = (song?.title || "").toLowerCase();
  const album = (song?.albumId || "").toLowerCase();
  if (title.includes("witch") || title.includes("halloween") || album.includes("halloween")) return resolveGenre("pop");
  if (tempo >= 170) return resolveGenre("dnb");
  if (tempo >= 155) return resolveGenre("metalcore");
  if (tempo >= 140) return resolveGenre("trap");
  if (tempo >= 130) return resolveGenre("rock");
  if (tempo >= 125) return resolveGenre("edm");
  if (tempo <= 78) return resolveGenre("ambient");
  if (tempo <= 95) return resolveGenre("gospel");
  if (tempo <= 100) return resolveGenre("rnb");
  return resolveGenre("pop");
}

export function arrangeNotesForGenre(notes, genreId = "pop") {
  const genre = resolveGenre(genreId);
  const tracks = { lead: [], chords: [], bass: [], organ: [], pad: [] };
  for (const n of notes || []) {
    const midi = n.midi;
    if (midi < 48) tracks.bass.push({ ...n, gm: genre.instruments.bass });
    else if (midi >= 72) tracks.lead.push({ ...n, gm: genre.instruments.lead });
    else if (genre.instruments.organ && midi % 12 === 0) tracks.organ.push({ ...n, gm: genre.instruments.organ });
    else tracks.chords.push({ ...n, gm: genre.instruments.chords });
  }
  return { genre, tracks, gmPiano: GM_PIANO, gmOrgan: GM_ORGAN };
}

export function genreToTheoryPatch(genreId) {
  const g = resolveGenre(genreId);
  if (!g) return null;
  return {
    bpm: g.bpm,
    timeSignature: g.theory.timeSignature,
    swing: g.theory.swing,
    structure: g.theory.structure,
    genre: g.id,
    genreParent: g.parent,
  };
}

export function genrePadSteps(genreId, mpcPads) {
  const g = resolveGenre(genreId);
  if (!g?.padPattern || !Object.keys(g.padPattern).length) return null;
  const out = {};
  for (const pad of mpcPads) {
    out[pad.id] = g.padPattern[pad.id] ? [...g.padPattern[pad.id]] : Array(16).fill(false);
  }
  return out;
}