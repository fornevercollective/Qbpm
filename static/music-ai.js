/** AI music pack loader — graph nodes, sequencer, genre arrangement */

import { buildMusicNodePack, matchPackFromPrompt, matchGenreFromPrompt, listMusicNodePacks } from "./music-node-packs.js";
import {
  GENRE_PRESETS,
  suggestGenreFromSong,
  arrangeNotesForGenre,
  genreToTheoryPatch,
  genrePadSteps,
  listGenres,
  listGenreTree,
  matchGenreFromText,
} from "./genre-presets.js";
import { midiToSequencer, loadMidiFromFile, midiToQbpmSong } from "./midi-import.js";
import { DEFAULT_VOICES } from "./piano/instrument-repo.js";

let uid = 0;
function uniq(prefix) {
  uid += 1;
  return `${prefix}-${uid}`;
}

/** Merge pack nodes into graph (prefix ids to avoid collisions) */
export function applyMusicPackToGraph(graph, packId, owner = "local") {
  const built = buildMusicNodePack(packId, owner);
  const idMap = new Map();
  const nodes = built.nodes.map((n) => {
    const newId = uniq(n.id);
    idMap.set(n.id, newId);
    return { ...n, id: newId };
  });
  const edges = built.edges.map((e) => ({
    ...e,
    from: idMap.get(e.from) || e.from,
    to: idMap.get(e.to) || e.to,
  }));
  return {
    ...graph,
    meta: { ...graph.meta, ...built.meta, musicPacks: [...(graph.meta?.musicPacks || []), packId] },
    nodes: [...(graph.nodes || []), ...nodes],
    edges: [...(graph.edges || []), ...edges],
  };
}

/** Apply genre to music core + optional strudel */
export function applyGenreToCore(core, genreId, opts = {}) {
  const g = GENRE_PRESETS[genreId];
  if (!g || !core) return null;
  const theory = genreToTheoryPatch(genreId);
  core.setTheory?.({ ...theory, genre: genreId });
  const pads = genrePadSteps(genreId, core.MPC_PADS);
  if (pads) core.setState?.({ padSteps: pads });
  return { genre: g, theory, strudel: g.strudel, instruments: g.instruments };
}

export async function applyAiMusicIntent(prompt, ctx = {}) {
  const { graph, owner = "local", core, strudelPane, song } = ctx;
  const packId = matchPackFromPrompt(prompt);
  const genreId = matchGenreFromText(prompt) || matchGenreFromPrompt(prompt);
  const out = { packId, genreId, actions: [] };

  if (graph) {
    const next = applyMusicPackToGraph(graph, packId, owner);
    out.graph = next;
    out.actions.push(`pack:${packId}`);
  }

  if (core) {
    const applied = applyGenreToCore(core, genreId);
    out.genre = applied;
    out.actions.push(`genre:${genreId}`);
  }

  if (strudelPane && GENRE_PRESETS[genreId]?.strudel) {
    try {
      await strudelPane.playCode?.(`setcps(${GENRE_PRESETS[genreId].bpm / 60 / 2})\n${GENRE_PRESETS[genreId].strudel}`);
      out.actions.push("strudel:play");
    } catch (_) {}
  }

  if (song?.notes?.length) {
    out.arrangement = arrangeNotesForGenre(song.notes, genreId);
    out.suggestedGenre = suggestGenreFromSong(song);
    out.actions.push("arrange:song");
  }

  return out;
}

export async function importMidiToCore(file, core) {
  const parsed = await loadMidiFromFile(file);
  const song = midiToQbpmSong(parsed.notes, { bpm: 120 });
  const noteSteps = midiToSequencer(parsed.notes, core?.PIANO_KEYS || []);
  core?.setState?.({ noteSteps });
  return { parsed, song, noteSteps };
}

export function getMusicAiCatalog() {
  return {
    packs: listMusicNodePacks(),
    genres: listGenres(),
    tree: listGenreTree(),
    voices: DEFAULT_VOICES,
    gm: { piano: "0-7", organ: "16-23" },
  };
}