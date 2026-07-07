/** Piano + organ MIDI/synth pack registry for Q BPM piano */

const REPO_URL = new URL('./instrument-repo.json', import.meta.url);

let cache = null;

export async function loadInstrumentRepo() {
  if (cache) return cache;
  const res = await fetch(REPO_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`instrument-repo: ${res.status}`);
  cache = await res.json();
  return cache;
}

/** Packs that include piano and/or organ timbres. Set `both: true` to require both. */
export function filterKeyboardPacks(
  repo,
  { piano = true, organ = true, both = false, recommendedOnly = false } = {},
) {
  const all = [
    ...(repo.samplePacks || []),
    ...(repo.soundfonts || []),
    ...(repo.midiSources || []),
  ];
  return all.filter((p) => {
    if (recommendedOnly && !p.recommended) return false;
    if (both) return p.hasPiano && p.hasOrgan;
    if (piano && organ) return p.hasPiano || p.hasOrgan;
    if (piano) return p.hasPiano;
    if (organ) return p.hasOrgan;
    return p.hasPiano || p.hasOrgan;
  });
}

/** Everything with at least one of piano or organ. */
export function allKeyboardAssets(repo) {
  return filterKeyboardPacks(repo, { piano: false, organ: false }).filter(
    (p) => p.hasPiano || p.hasOrgan,
  );
}

export function gmPianoPrograms(repo) {
  return repo.gmPrograms?.piano || [];
}

export function gmOrganPrograms(repo) {
  return repo.gmPrograms?.organ || [];
}

export function strudelSoundForGm(program, family = 'piano') {
  const map = {
    0: 'gm_piano',
    1: 'gm_bright_acoustic_piano',
    2: 'gm_electric_grand_piano',
    3: 'gm_honky_tonk_piano',
    4: 'gm_epiano1',
    5: 'gm_epiano2',
    6: 'gm_harpsichord',
    7: 'gm_clavinet',
    16: 'gm_drawbar_organ',
    17: 'gm_percussive_organ',
    18: 'gm_rock_organ',
    19: 'gm_church_organ',
    20: 'gm_reed_organ',
    21: 'gm_accordion',
    22: 'gm_harmonica',
    23: 'gm_bandoneon',
  };
  if (program != null && map[program]) return map[program];
  return family === 'organ' ? 'gm_church_organ' : 'piano';
}

export const DEFAULT_VOICES = [
  { id: 'salamander', label: 'Grand Piano (Salamander)', type: 'sample', strudel: 'piano', pack: 'dough-piano' },
  { id: 'gm-grand', label: 'GM Acoustic Grand', type: 'soundfont', strudel: 'gm_piano', gm: 0 },
  { id: 'gm-rhodes', label: 'GM Electric Piano', type: 'soundfont', strudel: 'gm_epiano1', gm: 4 },
  { id: 'gm-hammond', label: 'GM Drawbar Organ', type: 'soundfont', strudel: 'gm_drawbar_organ', gm: 16 },
  { id: 'gm-church', label: 'GM Church Organ', type: 'soundfont', strudel: 'gm_church_organ', gm: 19 },
  { id: 'gm-reed', label: 'GM Reed Organ', type: 'soundfont', strudel: 'gm_reed_organ', gm: 20 },
  { id: 'synth', label: 'Synth Guide (oscillator)', type: 'builtin', strudel: null },
];

export async function getDefaultVoices() {
  return DEFAULT_VOICES;
}