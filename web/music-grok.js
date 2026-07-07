/** Grok / terminal / prompt music command router */

import { applyAiMusicIntent, applyGenreToCore, applyMusicPackToGraph, getMusicAiCatalog } from "./music-ai.js";
import {
  listGenres,
  listGenreTree,
  suggestGenreFromSong,
  arrangeNotesForGenre,
  resolveGenre,
  matchGenreFromText,
} from "./genre-presets.js";
import { listMusicNodePacks, matchPackFromPrompt } from "./music-node-packs.js";
import { loadMidiFromUrl, midiToQbpmSong } from "./midi-import.js";
import {
  handleGrokMusicPrompt,
  processGrokMusicNode,
  runGrokMusicChain,
  buildChainContext,
} from "./grok-music-handler.js";

function log(ctx, msg) {
  ctx.onLog?.(msg);
  return msg;
}

export async function handleMusicCommand(line, ctx = {}) {
  const raw = line.trim();
  const low = raw.toLowerCase();
  if (
    !low.startsWith("music ")
    && !low.startsWith("grok ")
    && !low.startsWith("voice ")
    && !low.startsWith("genre ")
    && !low.startsWith("pack ")
    && low !== "seq play"
    && low !== "seq stop"
  ) {
    return null;
  }

  const parts = raw.split(/\s+/);
  const sub = parts[1]?.toLowerCase();
  const rest = parts.slice(2).join(" ");

  if (low === "seq play") {
    ctx.core?.startSeq?.();
    return log(ctx, "seq · play");
  }
  if (low === "seq stop") {
    ctx.core?.stopSeq?.();
    return log(ctx, "seq · stop");
  }

  if (low.startsWith("grok ")) {
    const prompt = parts.slice(1).join(" ");
    const result = await handleGrokMusicPrompt(prompt, ctx);
    return log(ctx, `grok · ${result?.genreId || "—"} · ${result?.actions?.join(" · ") || "ok"}`);
  }

  if (low.startsWith("voice ")) {
    const id = parts[1] || "gm-grand";
    localStorage.setItem("qbpm-piano-voice", id);
    localStorage.setItem("qbpm-music-voice", id);
    try {
      const bc = new BroadcastChannel("piano-buddy-state");
      bc.postMessage({ type: "voice", voice: id });
      bc.close();
    } catch (_) {}
    return log(ctx, `voice · ${id}`);
  }

  if (low.startsWith("genre ")) {
    const id = matchGenreFromText(parts.slice(1).join(" "));
    applyGenreToCore(ctx.core, id);
    if (ctx.graph && ctx.setGraph) {
      ctx.setGraph({ ...ctx.graph, meta: { ...ctx.graph.meta, genre: id } });
    }
    const g = resolveGenre(id);
    if (ctx.strudelPane && g?.strudel) {
      await ctx.strudelPane.playCode?.(`setcps(${g.bpm / 60 / 2})\n${g.strudel}`);
    }
    return log(ctx, `genre · ${id} · ${g?.label || id}`);
  }

  if (low.startsWith("pack ")) {
    const id = parts[1] || matchPackFromPrompt(rest);
    if (!ctx.graph || !ctx.setGraph) return log(ctx, "pack · no graph");
    const before = ctx.graph.nodes.length;
    const next = applyMusicPackToGraph(ctx.graph, id, ctx.owner);
    ctx.setGraph(next);
    if (next.meta?.genre) applyGenreToCore(ctx.core, next.meta.genre);
    return log(ctx, `pack · ${id} · +${next.nodes.length - before} nodes`);
  }

  if (!low.startsWith("music ")) return null;

  switch (sub) {
    case "help":
      return log(ctx, "music genre|pack|voice|bpm|seq|import|suggest|arrange|catalog|grok|chain|strudel|tree");

    case "tree": {
      const tree = listGenreTree();
      return log(ctx, `tree · ${tree.length} parents · ${listGenres().length} total`);
    }

    case "catalog": {
      const cat = getMusicAiCatalog();
      return log(ctx, `catalog · ${cat.packs.length} packs · ${cat.genres.length} genres`);
    }

    case "bpm": {
      const bpm = parseInt(parts[2], 10) || 120;
      ctx.core?.setTheory?.({ bpm, locked: { bpm: true } });
      if (ctx.graph?.meta) {
        ctx.setGraph?.({ ...ctx.graph, meta: { ...ctx.graph.meta, cpm: bpm, theory: { ...ctx.graph.meta.theory, bpm } } });
      }
      return log(ctx, `music · bpm ${bpm}`);
    }

    case "voice": {
      const id = parts[2] || "gm-grand";
      localStorage.setItem("qbpm-piano-voice", id);
      localStorage.setItem("qbpm-music-voice", id);
      return log(ctx, `music · voice ${id}`);
    }

    case "genre": {
      const id = matchGenreFromText(parts.slice(2).join(" ") || "pop");
      applyGenreToCore(ctx.core, id);
      return log(ctx, `music · genre ${id}`);
    }

    case "pack": {
      const id = parts[2] || "gm-keys";
      if (!ctx.setGraph) return log(ctx, "music · pack · no graph");
      const before = ctx.graph.nodes.length;
      const next = applyMusicPackToGraph(ctx.graph, id, ctx.owner);
      ctx.setGraph(next);
      return log(ctx, `music · pack ${id} · +${next.nodes.length - before} nodes`);
    }

    case "chain": {
      if (!ctx.graph) return log(ctx, "music · chain · no graph");
      const results = await runGrokMusicChain(ctx.graph, {
        core: ctx.core,
        strudelPane: ctx.strudelPane,
        song: ctx.song,
        applyPack: (pid) => {
          const next = applyMusicPackToGraph(ctx.graph, pid, ctx.owner);
          ctx.setGraph(next);
        },
      });
      if (ctx.setGraph) ctx.setGraph(ctx.graph);
      return log(ctx, `music · chain · ${results.length} grok node(s)`);
    }

    case "grok":
    case "ai": {
      const result = await handleGrokMusicPrompt(rest || "pop vocal piano", ctx);
      return log(ctx, `music · grok · ${result?.genreId} · ${result?.actions?.join(" · ") || ""}`);
    }

    case "node": {
      const nodeId = parts[2];
      const prompt = parts.slice(3).join(" ");
      if (!nodeId || !ctx.graph) return log(ctx, "music · node <id> <prompt>");
      const n = ctx.graph.nodes.find((x) => x.id === nodeId);
      if (n?.type === "music.grok") n.data = { ...n.data, prompt };
      const proc = await processGrokMusicNode(ctx.graph, nodeId, {
        core: ctx.core,
        strudelPane: ctx.strudelPane,
        song: ctx.song,
      });
      if (ctx.setGraph) ctx.setGraph(ctx.graph);
      return log(ctx, `music · node ${nodeId} · ${proc?.result?.genreId} · ${proc?.patches?.length || 0} patches`);
    }

    case "seq":
      if (parts[2] === "play") { ctx.core?.startSeq?.(); return log(ctx, "music · seq play"); }
      if (parts[2] === "stop") { ctx.core?.stopSeq?.(); return log(ctx, "music · seq stop"); }
      return log(ctx, "music · seq play|stop");

    case "import": {
      if (parts[2] === "midi" && parts[3]) {
        const parsed = await loadMidiFromUrl(parts[3]);
        const song = midiToQbpmSong(parsed.notes);
        return log(ctx, `music · import ${song.notes.length} notes`);
      }
      return log(ctx, "music · import midi <url>");
    }

    case "suggest": {
      const song = ctx.song || { tempo: ctx.core?.getBpm?.() || 120 };
      const g = suggestGenreFromSong(song);
      return log(ctx, `music · suggest ${g.id} (${g.label})`);
    }

    case "arrange": {
      const genreId = matchGenreFromText(parts.slice(2).join(" ") || "pop");
      const notes = ctx.song?.notes || [];
      const arr = arrangeNotesForGenre(notes, genreId);
      return log(ctx, `music · arrange ${genreId} · lead ${arr.tracks.lead.length} chord ${arr.tracks.chords.length}`);
    }

    case "strudel": {
      const code = rest || 'n("c4").sound("piano")';
      await ctx.strudelPane?.playCode?.(code);
      return log(ctx, `music · strudel · ${code.slice(0, 60)}`);
    }

    case "list": {
      const tree = listGenreTree().map((p) => `${p.id}(${p.subgenres.length})`).join(", ");
      return log(ctx, `genres: ${tree}`);
    }

    default:
      return log(ctx, "music help · unknown subcommand");
  }
}

export async function handleMusicPrompt(q, ctx) {
  const low = q.toLowerCase().trim();
  if (
    low.startsWith("music ")
    || low.startsWith("grok ")
    || low.startsWith("genre ")
    || low.startsWith("pack ")
    || low === "seq play"
    || low === "seq stop"
    || low.startsWith("voice ")
  ) {
    return handleMusicCommand(q, ctx);
  }
  if (/^(bpm|tempo)\s+\d+/i.test(low)) {
    const bpm = parseInt(low.match(/\d+/)?.[0], 10);
    return handleMusicCommand(`music bpm ${bpm}`, ctx);
  }
  if (/vocal|autotune|billboard|localvqe|organ|piano|beat pack|load pack|grok|chain|drill|house|dnb|reggaeton|worship|metal|blues|folk|ambient/i.test(low)) {
    return handleMusicCommand(`music grok ${q}`, ctx);
  }
  for (const g of listGenres()) {
    if (low === g.id || low.startsWith(`${g.id} `)) {
      return handleMusicCommand(`music genre ${g.id}`, ctx);
    }
  }
  return null;
}

export { handleGrokMusicPrompt, processGrokMusicNode, runGrokMusicChain, buildChainContext };
