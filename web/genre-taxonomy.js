/** Full genre + sub-genre taxonomy — GM maps, beats, Strudel, tags */

const KICK_SNARE = { 0: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], 1: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] };
const TRAP_HAT = { 2: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], 12: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0] };
const FOUR_FLOOR = { 0: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] };
const ORGAN_PAD = { 8: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] };

function g(overrides) {
  return {
    theory: { timeSignature: [4, 4], swing: 0, structure: "verse" },
    instruments: { lead: 0, chords: 4, bass: 33, pad: 48, organ: null },
    padPattern: {},
    tags: [],
    aliases: [],
    ...overrides,
  };
}

/** Parent genre defaults */
export const GENRE_PARENTS = {
  pop: g({ label: "Pop", bpm: 118, strudel: 'stack(n("c4 e4 g4").sound("gm_epiano1"), s("bd*4, ~ sd*2").bank("RolandTR808"))', tags: ["billboard", "radio"] }),
  rock: g({ label: "Rock", bpm: 132, instruments: { lead: 29, chords: 0, bass: 33, pad: 48, organ: 18 }, padPattern: KICK_SNARE, strudel: 'stack(s("bd*4, sd*2"), n("e2").sound("gm_electric_bass_finger"))', tags: ["guitar"] }),
  hiphop: g({ label: "Hip-Hop", bpm: 92, theory: { timeSignature: [4, 4], swing: 18, structure: "verse" }, instruments: { lead: 80, chords: 4, bass: 38, pad: 89, organ: null }, tags: ["rap", "808"] }),
  rnb: g({ label: "R&B / Soul", bpm: 96, theory: { swing: 14 }, instruments: { lead: 4, chords: 5, bass: 33, pad: 50, organ: 16 }, strudel: 'stack(n("c4").sound("gm_epiano1"), n("c3").sound("gm_drawbar_organ").gain(0.25))', tags: ["soul", "vocal", "billboard"] }),
  electronic: g({ label: "Electronic", bpm: 128, instruments: { lead: 81, chords: 88, bass: 38, pad: 89, organ: null }, padPattern: FOUR_FLOOR, strudel: 'stack(s("bd*4").gain(1.2), n("c2").sound("gm_synth_bass_1"))', tags: ["edm", "synth"] }),
  jazz: g({ label: "Jazz", bpm: 128, theory: { swing: 28, structure: "solo" }, instruments: { lead: 65, chords: 0, bass: 32, pad: 73, organ: 18 }, strudel: 'stack(n("c4").sound("gm_vibraphone"), s("bd ~ sd ~").gain(0.6))', tags: ["swing"] }),
  gospel: g({ label: "Gospel", bpm: 92, theory: { swing: 8, structure: "chorus" }, instruments: { lead: 0, chords: 4, bass: 32, pad: 52, organ: 16 }, padPattern: ORGAN_PAD, strudel: 'stack(n("c3 g3").sound("gm_drawbar_organ"), n("c4 e4 g4").sound("piano"))', tags: ["organ", "choir"] }),
  country: g({ label: "Country", bpm: 112, instruments: { lead: 25, chords: 0, bass: 32, pad: 48, organ: null }, strudel: 'n("c4 g4").sound("gm_acoustic_guitar_steel")', tags: ["americana", "twang"] }),
  latin: g({ label: "Latin", bpm: 100, theory: { swing: 10 }, instruments: { lead: 73, chords: 0, bass: 33, pad: 48, organ: null }, tags: ["reggaeton", "salsa"] }),
  classical: g({ label: "Classical", bpm: 88, instruments: { lead: 0, chords: 48, bass: 43, pad: 46, organ: 19 }, strudel: 'n("c4 e4 g4 b4").sound("piano").slow(2)', tags: ["orchestra"] }),
  metal: g({ label: "Metal", bpm: 150, instruments: { lead: 30, chords: 29, bass: 34, pad: 48, organ: null }, padPattern: { 0: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] }, strudel: 'stack(s("bd*8").gain(1.3), n("e1").sound("gm_distortion_guitar"))', tags: ["heavy"] }),
  blues: g({ label: "Blues", bpm: 84, theory: { swing: 22 }, instruments: { lead: 29, chords: 0, bass: 32, pad: 73, organ: 18 }, tags: ["12-bar"] }),
  reggae: g({ label: "Reggae / Dub", bpm: 76, theory: { swing: 6 }, instruments: { lead: 76, chords: 24, bass: 33, pad: 48, organ: 18 }, strudel: 's("~ bd ~ bd").gain(0.8)', tags: ["ska", "dub"] }),
  funk: g({ label: "Funk / Disco", bpm: 118, theory: { swing: 12 }, instruments: { lead: 4, chords: 4, bass: 33, pad: 50, organ: 16 }, padPattern: FOUR_FLOOR, tags: ["disco", "groove"] }),
  folk: g({ label: "Folk / World", bpm: 100, instruments: { lead: 24, chords: 0, bass: 32, pad: 48, organ: null }, tags: ["acoustic", "world"] }),
  ambient: g({ label: "Ambient", bpm: 72, theory: { structure: "ambient" }, instruments: { lead: 88, chords: 89, bass: 38, pad: 90, organ: 19 }, strudel: 'n("c4").sound("gm_pad_warm").slow(4)', tags: ["atmospheric", "drone"] }),
};

/** Sub-genres — inherit parent, override specifics */
export const GENRE_SUBGENRES = {
  // Pop
  "synth-pop": g({ parent: "pop", label: "Synth-Pop", bpm: 120, instruments: { lead: 81, chords: 88, bass: 38, pad: 89, organ: null }, aliases: ["synthpop", "new-wave"] }),
  "dance-pop": g({ parent: "pop", label: "Dance-Pop", bpm: 124, padPattern: FOUR_FLOOR, aliases: ["dance pop"] }),
  "indie-pop": g({ parent: "pop", label: "Indie-Pop", bpm: 110, instruments: { lead: 24, chords: 0, bass: 32, pad: 48, organ: null }, aliases: ["indie pop"] }),
  "k-pop": g({ parent: "pop", label: "K-Pop", bpm: 128, padPattern: FOUR_FLOOR, tags: ["korean", "billboard"] }),
  "art-pop": g({ parent: "pop", label: "Art-Pop", bpm: 105, theory: { swing: 8 }, aliases: ["experimental pop"] }),

  // Rock
  "classic-rock": g({ parent: "rock", label: "Classic Rock", bpm: 126, instruments: { lead: 29, chords: 0, bass: 33, pad: 48, organ: 18 } }),
  punk: g({ parent: "rock", label: "Punk", bpm: 168, padPattern: { 0: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, aliases: ["punk-rock"] }),
  grunge: g({ parent: "rock", label: "Grunge", bpm: 118, instruments: { lead: 30, chords: 29, bass: 34, pad: 48, organ: null } }),
  "indie-rock": g({ parent: "rock", label: "Indie Rock", bpm: 122, aliases: ["indie rock"] }),
  "prog-rock": g({ parent: "rock", label: "Prog Rock", bpm: 132, theory: { timeSignature: [7, 8], structure: "bridge" }, aliases: ["progressive"] }),
  shoegaze: g({ parent: "rock", label: "Shoegaze", bpm: 95, instruments: { lead: 89, chords: 88, bass: 38, pad: 90, organ: null } }),
  alternative: g({ parent: "rock", label: "Alternative", bpm: 128, aliases: ["alt-rock", "alt rock"] }),

  // Hip-Hop
  trap: g({ parent: "hiphop", label: "Trap", bpm: 140, theory: { swing: 12, structure: "drop" }, padPattern: { ...FOUR_FLOOR, ...TRAP_HAT }, strudel: 'stack(s("bd*4").gain(1.1), s("~ sd").gain(0.9), n("c2").sound("gm_synth_bass_1"))', tags: ["808", "billboard"] }),
  drill: g({ parent: "hiphop", label: "Drill", bpm: 142, theory: { swing: 8 }, padPattern: TRAP_HAT, aliases: ["uk-drill", "ny-drill"] }),
  "boom-bap": g({ parent: "hiphop", label: "Boom Bap", bpm: 94, theory: { swing: 20 }, padPattern: KICK_SNARE, aliases: ["boombap", "golden-age"] }),
  "lo-fi-hip-hop": g({ parent: "hiphop", label: "Lo-Fi Hip-Hop", bpm: 78, theory: { swing: 16 }, instruments: { lead: 4, chords: 5, bass: 33, pad: 89, organ: null }, aliases: ["lofi", "lo-fi", "chill-hop"] }),
  "cloud-rap": g({ parent: "hiphop", label: "Cloud Rap", bpm: 130, instruments: { lead: 89, chords: 88, bass: 38, pad: 90, organ: null } }),

  // R&B
  "neo-soul": g({ parent: "rnb", label: "Neo-Soul", bpm: 88, theory: { swing: 18 }, aliases: ["neosoul"] }),
  "funk-soul": g({ parent: "rnb", label: "Funk Soul", bpm: 112, padPattern: FOUR_FLOOR, aliases: ["p-funk", "funk-rnb"] }),
  motown: g({ parent: "rnb", label: "Motown", bpm: 104, theory: { swing: 10 }, instruments: { lead: 48, chords: 0, bass: 32, pad: 52, organ: null } }),
  "quiet-storm": g({ parent: "rnb", label: "Quiet Storm", bpm: 72, theory: { swing: 12, structure: "bridge" } }),

  // Electronic
  house: g({ parent: "electronic", label: "House", bpm: 124, padPattern: FOUR_FLOOR, strudel: 'stack(s("bd*4").gain(1.1), n("c2").sound("gm_synth_bass_1"))', aliases: ["deep-house", "tech-house"] }),
  techno: g({ parent: "electronic", label: "Techno", bpm: 130, padPattern: FOUR_FLOOR, aliases: ["minimal-techno"] }),
  trance: g({ parent: "electronic", label: "Trance", bpm: 138, instruments: { lead: 81, chords: 88, bass: 38, pad: 89, organ: null } }),
  dubstep: g({ parent: "electronic", label: "Dubstep", bpm: 140, theory: { structure: "drop" }, padPattern: { 0: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] } }),
  dnb: g({ parent: "electronic", label: "Drum & Bass", bpm: 174, aliases: ["drum-and-bass", "jungle"] }),
  synthwave: g({ parent: "electronic", label: "Synthwave", bpm: 118, instruments: { lead: 81, chords: 88, bass: 38, pad: 89, organ: null }, aliases: ["retrowave", "outrun"] }),
  vaporwave: g({ parent: "electronic", label: "Vaporwave", bpm: 85, theory: { swing: 0, structure: "ambient" } }),
  edm: g({ parent: "electronic", label: "EDM", bpm: 128, theory: { structure: "drop" }, aliases: ["big-room", "festival"] }),

  // Jazz
  bebop: g({ parent: "jazz", label: "Bebop", bpm: 180, theory: { swing: 32 } }),
  "smooth-jazz": g({ parent: "jazz", label: "Smooth Jazz", bpm: 96, theory: { swing: 14 }, aliases: ["smooth jazz"] }),
  fusion: g({ parent: "jazz", label: "Fusion", bpm: 120, instruments: { lead: 81, chords: 0, bass: 33, pad: 73, organ: 18 } }),
  "bossa-nova": g({ parent: "jazz", label: "Bossa Nova", bpm: 120, theory: { swing: 8 }, aliases: ["bossa"] }),
  swing: g({ parent: "jazz", label: "Swing", bpm: 140, theory: { swing: 35 } }),

  // Gospel
  worship: g({ parent: "gospel", label: "Worship", bpm: 72, theory: { structure: "chorus" }, aliases: ["ccm", "contemporary-worship"] }),
  "southern-gospel": g({ parent: "gospel", label: "Southern Gospel", bpm: 88, instruments: { lead: 0, chords: 4, bass: 32, pad: 52, organ: 19 } }),

  // Country
  "country-pop": g({ parent: "country", label: "Country Pop", bpm: 116, aliases: ["country pop"] }),
  bluegrass: g({ parent: "country", label: "Bluegrass", bpm: 140, instruments: { lead: 24, chords: 0, bass: 32, pad: 48, organ: null } }),
  americana: g({ parent: "country", label: "Americana", bpm: 108 }),

  // Latin
  reggaeton: g({ parent: "latin", label: "Reggaeton", bpm: 95, padPattern: FOUR_FLOOR, aliases: ["dembow"] }),
  salsa: g({ parent: "latin", label: "Salsa", bpm: 180, theory: { swing: 15 } }),
  bachata: g({ parent: "latin", label: "Bachata", bpm: 130 }),
  cumbia: g({ parent: "latin", label: "Cumbia", bpm: 100 }),
  brazilian: g({ parent: "latin", label: "Brazilian", bpm: 120, aliases: ["bossa", "samba", "mpb"] }),

  // Classical
  baroque: g({ parent: "classical", label: "Baroque", bpm: 80, instruments: { lead: 6, chords: 48, bass: 43, pad: 46, organ: 19 } }),
  romantic: g({ parent: "classical", label: "Romantic", bpm: 76 }),
  cinematic: g({ parent: "classical", label: "Cinematic", bpm: 90, instruments: { lead: 48, chords: 48, bass: 43, pad: 89, organ: 19 }, aliases: ["film-score", "soundtrack"] }),

  // Metal
  "heavy-metal": g({ parent: "metal", label: "Heavy Metal", bpm: 145, aliases: ["metal"] }),
  metalcore: g({ parent: "metal", label: "Metalcore", bpm: 155 }),
  "black-metal": g({ parent: "metal", label: "Black Metal", bpm: 180 }),

  // Blues
  "delta-blues": g({ parent: "blues", label: "Delta Blues", bpm: 72 }),
  "blues-rock": g({ parent: "blues", label: "Blues Rock", bpm: 110 }),

  // Reggae
  ska: g({ parent: "reggae", label: "Ska", bpm: 150, aliases: ["ska-punk"] }),
  dancehall: g({ parent: "reggae", label: "Dancehall", bpm: 98 }),

  // Funk/Disco
  disco: g({ parent: "funk", label: "Disco", bpm: 120, padPattern: FOUR_FLOOR, strudel: 'stack(s("bd*4"), n("c3").sound("gm_drawbar_organ"))' }),

  // Folk
  celtic: g({ parent: "folk", label: "Celtic", bpm: 120, instruments: { lead: 24, chords: 0, bass: 32, pad: 48, organ: null } }),
  flamenco: g({ parent: "folk", label: "Flamenco", bpm: 120, theory: { timeSignature: [12, 8] } }),

  // Ambient sub
  drone: g({ parent: "ambient", label: "Drone", bpm: 60, theory: { structure: "ambient" } }),
  "dark-ambient": g({ parent: "ambient", label: "Dark Ambient", bpm: 65 }),
};

/** Flatten parent + sub into runtime presets */
export function buildGenrePresets() {
  const out = {};
  for (const [pid, parent] of Object.entries(GENRE_PARENTS)) {
    out[pid] = { id: pid, parent: null, ...parent };
  }
  for (const [sid, sub] of Object.entries(GENRE_SUBGENRES)) {
    const parent = GENRE_PARENTS[sub.parent] || {};
    out[sid] = {
      id: sid,
      parent: sub.parent,
      label: sub.label || sid,
      bpm: sub.bpm ?? parent.bpm ?? 120,
      theory: { ...parent.theory, ...sub.theory },
      instruments: { ...parent.instruments, ...sub.instruments },
      padPattern: Object.keys(sub.padPattern || {}).length ? sub.padPattern : parent.padPattern || {},
      strudel: sub.strudel || parent.strudel || 'n("c4").sound("piano")',
      tags: [...(parent.tags || []), ...(sub.tags || [])],
      aliases: sub.aliases || [],
    };
  }
  return out;
}