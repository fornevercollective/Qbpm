/**
 * Grok music node — chain-pluggable prompt handler.
 * Wire: upstream (clock/midi/data) → music.grok → downstream (beatpad/piano/vocal/code)
 */

import { applyAiMusicIntent } from "./music-ai.js";
import { matchPackFromPrompt } from "./music-node-packs.js";
import {
  resolveGenre,
  matchGenreFromText,
  arrangeNotesForGenre,
  genreToTheoryPatch,
  genrePadSteps,
  listGenreTree,
  listGenres,
} from "./genre-presets.js";
import { fetchApiJson, resolveApiUrl } from "./api-bridge.js";

/** Default node data for music.grok */
export function defaultGrokMusicData() {
  return {
    prompt: "",
    mode: "chain",
    autoPack: true,
    autoGenre: true,
    autoArrange: true,
    autoStrudel: true,
    lastResult: null,
    status: "idle",
  };
}

/** Gather upstream chain context for a grok node */
export function buildChainContext(graph, nodeId) {
  const edges = (graph?.edges || []).filter((e) => e.to === nodeId);
  const ctx = {
    nodeId,
    upstream: [],
    midi: null,
    clock: null,
    prompt: "",
    song: null,
    pattern: null,
    bpm: graph?.meta?.cpm || graph?.meta?.theory?.bpm || 120,
  };

  for (const e of edges) {
    const src = graph.nodes?.find((n) => n.id === e.from);
    if (!src) continue;
    const snap = {
      id: src.id,
      type: src.type,
      port: e.port,
      data: src.data || {},
      code: src.code,
    };
    ctx.upstream.push(snap);

    if (e.port === "midi" || src.type?.startsWith("music.")) {
      if (src.data?.pattern) ctx.pattern = src.data.pattern;
      if (src.data?.musica) ctx.prompt += ` ${src.data.musica}`;
      if (src.data?.notes?.length) ctx.song = { notes: src.data.notes, tempo: src.data.bpm || ctx.bpm };
    }
    if (e.port === "clock" || src.type?.includes("clock")) {
      ctx.clock = src.data || src.params;
      if (src.data?.bpm) ctx.bpm = src.data.bpm;
    }
    if (e.port === "data" && src.data?.prompt) ctx.prompt += ` ${src.data.prompt}`;
    if (src.type === "music.notation" && src.data?.notes) ctx.song = { notes: src.data.notes };
    if (src.type === "music.code" && src.data?.code) ctx.prompt += ` ${src.data.code}`;
  }

  const self = graph.nodes?.find((n) => n.id === nodeId);
  if (self?.data?.prompt) ctx.prompt = `${self.data.prompt} ${ctx.prompt}`.trim();
  return ctx;
}

/** Apply grok handler result to downstream chain nodes */
export function emitToDownstream(graph, grokNodeId, result) {
  const edges = (graph?.edges || []).filter((e) => e.from === grokNodeId);
  const patches = [];

  for (const e of edges) {
    const tgt = graph.nodes?.find((n) => n.id === e.to);
    if (!tgt) continue;
    const data = { ...(tgt.data || {}) };

    if (result.genre) {
      data.genre = result.genreId;
      data.bpm = result.genre.bpm;
      if (tgt.type === "music.beatpad" && result.padSteps) {
        data.pattern = { pads: result.padSteps };
      }
      if (tgt.type === "music.piano" || tgt.type === "music.piano") {
        data.voice = result.voice || data.voice;
        data.gmProgram = result.genre?.instruments?.lead ?? data.gmProgram;
      }
      if (tgt.type === "music.code" && result.strudel) {
        data.lang = "strudel";
        data.code = result.strudel;
      }
      if (tgt.type === "music.notation" && result.arrangement) {
        data.arrangement = result.arrangement;
      }
      if (tgt.type?.startsWith("audio.")) {
        data.genre = result.genreId;
        if (tgt.type === "audio.autotune") {
          data.key = result.theory?.key || "C";
        }
      }
    }

    if (result.packId) data.loadedPack = result.packId;
    if (e.port === "midi" && result.musica) data.musica = result.musica;
    if (e.port === "data") data.grokResult = result;

    patches.push({ id: tgt.id, data });
    tgt.data = data;
  }

  return patches;
}

/** Core prompt → music actions (local, no API) */
export async function parseGrokMusicPrompt(prompt, chainCtx = {}, nodeData = {}) {
  const text = [nodeData.prompt, prompt, chainCtx.prompt].filter(Boolean).join(" ").trim();
  const genreId = nodeData.genre || matchGenreFromText(text);
  const packId = nodeData.pack || matchPackFromPrompt(text);
  const genre = resolveGenre(genreId);

  const result = {
    ok: true,
    prompt: text,
    genreId,
    packId,
    genre,
    theory: genreToTheoryPatch(genreId),
    strudel: `setcps(${genre.bpm / 60 / 2})\n${genre.strudel}`,
    padSteps: null,
    arrangement: null,
    musica: chainCtx.pattern?.musica || "",
    voice: text.includes("organ") ? "gm-hammond" : text.includes("rhodes") ? "gm-rhodes" : "salamander",
    actions: [`genre:${genreId}`, `pack:${packId}`],
    source: "local",
  };

  if (chainCtx.song?.notes?.length) {
    result.arrangement = arrangeNotesForGenre(chainCtx.song.notes, genreId);
    result.actions.push("arrange:chain");
  }

  return result;
}

/** Optional API agent pass — merges LLM intent when bridge online */
export async function fetchGrokMusicAgent(prompt, graph, nodeId) {
  const url = resolveApiUrl("api/grok/music");
  if (!url) return null;
  try {
    const data = await fetchApiJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        nodeId,
        genres: listGenres().slice(0, 40),
        tree: listGenreTree(),
        graph: { meta: graph?.meta, nodeCount: graph?.nodes?.length },
      }),
    });
    if (data?.genre) return { ...data, source: "api" };
  } catch (_) {}
  return null;
}

/**
 * Process a music.grok node — plug into chain on run/prompt.
 * Returns { node, patches, result } for graph + runtime consumers.
 */
export async function processGrokMusicNode(graph, nodeId, runtimeCtx = {}) {
  const node = graph?.nodes?.find((n) => n.id === nodeId);
  if (!node || node.type !== "music.grok") return null;

  const data = { ...defaultGrokMusicData(), ...(node.data || {}) };
  const chainCtx = buildChainContext(graph, nodeId);
  data.status = "processing";

  let result = await parseGrokMusicPrompt(data.prompt, chainCtx, data);

  if (data.useApi !== false) {
    const api = await fetchGrokMusicAgent(result.prompt, graph, nodeId);
    if (api?.genre) {
      result = { ...result, ...api, genreId: api.genre, genre: resolveGenre(api.genre) };
      result.actions.push("agent:api");
    }
  }

  if (data.autoGenre !== false && runtimeCtx.core) {
    const { MPC_PADS } = runtimeCtx.core;
    result.padSteps = genrePadSteps(result.genreId, MPC_PADS);
    runtimeCtx.core.setTheory?.(result.theory);
    if (result.padSteps) runtimeCtx.core.setState?.({ padSteps: result.padSteps });
  }

  if (data.autoPack !== false && runtimeCtx.applyPack) {
    runtimeCtx.applyPack(result.packId);
    result.actions.push(`emit:pack:${result.packId}`);
  }

  if (data.autoStrudel !== false && runtimeCtx.strudelPane) {
    try {
      await runtimeCtx.strudelPane.playCode?.(result.strudel);
      result.actions.push("emit:strudel");
    } catch (_) {}
  }

  const aiCtx = {
    ...runtimeCtx,
    song: chainCtx.song || runtimeCtx.song,
  };
  if (data.autoArrange !== false && aiCtx.song?.notes?.length) {
    result.arrangement = arrangeNotesForGenre(aiCtx.song.notes, result.genreId);
  }

  const patches = emitToDownstream(graph, nodeId, result);

  node.data = {
    ...data,
    status: "done",
    lastResult: {
      genreId: result.genreId,
      packId: result.packId,
      actions: result.actions,
      prompt: result.prompt,
      at: Date.now(),
    },
    genre: result.genreId,
    pack: result.packId,
    strudel: result.strudel,
    arrangement: result.arrangement,
  };

  return { node, patches, result, chainCtx };
}

/** Run all music.grok nodes in topological order */
export async function runGrokMusicChain(graph, runtimeCtx = {}) {
  const grokNodes = (graph?.nodes || []).filter((n) => n.type === "music.grok");
  const results = [];
  for (const n of grokNodes) {
    const r = await processGrokMusicNode(graph, n.id, runtimeCtx);
    if (r) results.push(r);
  }
  return results;
}

/** Prompt handler entry — used by terminal, prompt bar, and node inspector */
export async function handleGrokMusicPrompt(prompt, ctx = {}) {
  const text = String(prompt || "").trim();
  if (!text) return null;

  const genreId = matchGenreFromText(text);
  const chainCtx = { prompt: text, bpm: ctx.core?.getBpm?.() || 120, song: ctx.song };

  const result = await parseGrokMusicPrompt(text, chainCtx, { prompt: text, autoGenre: true });

  if (ctx.grokNodeId && ctx.graph) {
    const proc = await processGrokMusicNode(ctx.graph, ctx.grokNodeId, { ...ctx, song: ctx.song });
    if (proc && ctx.setGraph) ctx.setGraph(ctx.graph);
    return proc?.result;
  }

  const ai = await applyAiMusicIntent(text, { ...ctx, song: ctx.song });
  if (ai.graph && ctx.setGraph) ctx.setGraph(ai.graph);
  if (ctx.core) {
    const g = resolveGenre(genreId);
    ctx.core.setTheory?.(genreToTheoryPatch(genreId));
    const pads = genrePadSteps(genreId, ctx.core.MPC_PADS);
    if (pads) ctx.core.setState?.({ padSteps: pads });
  }
  if (ctx.strudelPane && result.strudel) {
    await ctx.strudelPane.playCode?.(result.strudel);
  }

  return { ...result, ...ai, genreId };
}