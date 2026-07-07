/** Minimal Standard MIDI File parser → qbpm note events */

function readVarLen(data, pos) {
  let v = 0;
  while (pos.i < data.length) {
    const b = data[pos.i++];
    v = (v << 7) | (b & 0x7f);
    if (!(b & 0x80)) break;
  }
  return v;
}

function parseTrack(data, pos, tpq) {
  const events = [];
  let tick = 0;
  const notes = new Map();
  while (pos.i < data.length) {
    const statusByte = data[pos.i];
    let status;
    if (statusByte & 0x80) {
      status = statusByte;
      pos.i++;
    } else {
      status = pos.lastStatus;
    }
    pos.lastStatus = status;
    const type = status & 0xf0;
    const ch = status & 0x0f;

    if (type === 0x80 || type === 0x90) {
      const note = data[pos.i++];
      const vel = data[pos.i++];
      if (type === 0x90 && vel > 0) {
        notes.set(`${ch}:${note}`, { tick, vel });
      } else {
        const on = notes.get(`${ch}:${note}`);
        if (on) {
          events.push({ midi: note, tick: on.tick, durationTicks: tick - on.tick, vel: on.vel, ch });
          notes.delete(`${ch}:${note}`);
        }
      }
    } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
      pos.i += 2;
    } else if (type === 0xc0 || type === 0xd0) {
      pos.i += 1;
    } else if (status === 0xff) {
      const meta = data[pos.i++];
      const len = readVarLen(data, pos);
      if (meta === 0x51 && len === 3) {
        const us = (data[pos.i] << 16) | (data[pos.i + 1] << 8) | data[pos.i + 2];
        events._tempo = us;
      }
      pos.i += len;
    } else if (status === 0xf0 || status === 0xf7) {
      const len = readVarLen(data, pos);
      pos.i += len;
    } else {
      const delta = readVarLen(data, pos);
      tick += delta;
      continue;
    }
    const delta = readVarLen(data, pos);
    tick += delta;
  }
  for (const [key, on] of notes) {
    const [ch, note] = key.split(":").map(Number);
    events.push({ midi: note, tick: on.tick, durationTicks: tpq, vel: on.vel, ch });
  }
  return events;
}

export function parseMidiArrayBuffer(buf) {
  const data = new Uint8Array(buf);
  if (data[0] !== 0x4d || data[1] !== 0x54 || data[2] !== 0x68 || data[3] !== 0x64) {
    throw new Error("not a MIDI file");
  }
  const headerLen = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
  let pos = { i: 8 + headerLen, lastStatus: 0 };
  const fmt = (data[8] << 8) | data[9];
  const ntrks = (data[10] << 8) | data[11];
  const tpq = (data[12] << 8) | data[13];
  const all = [];
  let tempo = 500000;
  for (let t = 0; t < ntrks; t++) {
    if (data[pos.i] !== 0x4d || data[pos.i + 1] !== 0x54 || data[pos.i + 2] !== 0x72 || data[pos.i + 3] !== 0x6b) break;
    pos.i += 4;
    const len = (data[pos.i] << 24) | (data[pos.i + 1] << 16) | (data[pos.i + 2] << 8) | data[pos.i + 3];
    pos.i += 4;
    const end = pos.i + len;
    const trk = parseTrack(data.slice(pos.i, end), { i: 0, lastStatus: 0 }, tpq);
    if (trk._tempo) tempo = trk._tempo;
    all.push(...trk.filter((e) => typeof e.midi === "number"));
    pos.i = end;
  }
  const secPerTick = tempo / 1e6 / tpq;
  const notes = all
    .map((e) => ({
      midi: e.midi,
      beat: e.tick * secPerTick * (120 / 60),
      duration: Math.max(0.125, e.durationTicks * secPerTick * (120 / 60)),
      vel: e.vel,
      ch: e.ch,
    }))
    .sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  return { format: fmt, tracks: ntrks, tpq, tempo, notes };
}

export function midiToQbpmSong(notes, meta = {}) {
  const bpm = meta.bpm || 120;
  const scale = 120 / bpm;
  return {
    id: meta.id || `import-${Date.now()}`,
    title: meta.title || "Imported MIDI",
    albumId: meta.albumId || "practice",
    emoji: "🎹",
    author: meta.author || "MIDI import",
    tempo: bpm,
    timeSignature: meta.timeSignature || "4/4",
    status: "ready",
    notes: notes.map((n) => ({
      midi: n.midi,
      beat: n.beat * scale,
      duration: n.duration * scale,
    })),
  };
}

export function midiToSequencer(notes, keys) {
  const noteSteps = {};
  for (const k of keys) noteSteps[k.n] = Array(16).fill(false);
  for (const n of notes) {
    const oct = Math.floor(n.midi / 12) - 1;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const name = `${names[n.midi % 12]}${oct}`;
    if (!noteSteps[name]) continue;
    const step = Math.min(15, Math.max(0, Math.round(n.beat * 4) % 16));
    noteSteps[name][step] = true;
  }
  return noteSteps;
}

export async function loadMidiFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`midi fetch ${res.status}`);
  return parseMidiArrayBuffer(await res.arrayBuffer());
}

export async function loadMidiFromFile(file) {
  return parseMidiArrayBuffer(await file.arrayBuffer());
}