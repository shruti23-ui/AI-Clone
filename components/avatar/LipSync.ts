/**
 * Lip sync engine — maps phonemes/text to visemes, drives avatar morph targets.
 *
 * Viseme set compatible with Ready Player Me / Oculus OVR / standard ARKit:
 * sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U
 */

// Viseme → morph target name mapping (matches Ready Player Me / standard blendshape names)
export const VISEME_MAP: Record<string, string[]> = {
  sil: ['viseme_sil'],
  PP:  ['viseme_PP'],
  FF:  ['viseme_FF'],
  TH:  ['viseme_TH'],
  DD:  ['viseme_DD'],
  kk:  ['viseme_kk'],
  CH:  ['viseme_CH'],
  SS:  ['viseme_SS'],
  nn:  ['viseme_nn'],
  RR:  ['viseme_RR'],
  aa:  ['viseme_aa'],
  E:   ['viseme_E'],
  I:   ['viseme_I'],
  O:   ['viseme_O'],
  U:   ['viseme_U'],
};

// Phoneme → viseme mapping (IPA-ish approximation)
export const PHONEME_TO_VISEME: Record<string, string> = {
  // Bilabials
  p: 'PP', b: 'PP', m: 'PP',
  // Labiodentals
  f: 'FF', v: 'FF',
  // Dentals
  θ: 'TH', ð: 'TH',
  // Alveolars
  t: 'DD', d: 'DD', l: 'nn', n: 'nn',
  // Velars
  k: 'kk', g: 'kk',
  // Post-alveolars
  ʃ: 'CH', ʒ: 'CH', tʃ: 'CH', dʒ: 'CH',
  // Sibilants
  s: 'SS', z: 'SS',
  // Rhotics
  r: 'RR',
  // Vowels
  æ: 'aa', a: 'aa', ɑ: 'aa', ʌ: 'aa',
  e: 'E', ɛ: 'E',
  i: 'I', ɪ: 'I',
  o: 'O', ɔ: 'O',
  u: 'U', ʊ: 'U',
};

// Simple letter-based viseme extraction (fallback — no phonemizer)
export function textToVisemes(text: string): Array<{ viseme: string; duration: number }> {
  const visemes: Array<{ viseme: string; duration: number }> = [];
  const lower = text.toLowerCase();

  // Average speaking rate: ~150 words/min → ~80ms per phoneme
  const PHONEME_DURATION = 80; // ms

  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const pair = lower.slice(i, i + 2);

    if (pair === 'th') {
      visemes.push({ viseme: 'TH', duration: PHONEME_DURATION });
      i++;
    } else if (pair === 'sh' || pair === 'ch') {
      visemes.push({ viseme: 'CH', duration: PHONEME_DURATION });
      i++;
    } else if (pair === 'ss' || pair === 'zz') {
      visemes.push({ viseme: 'SS', duration: PHONEME_DURATION });
      i++;
    } else if ('pb m'.includes(ch)) {
      visemes.push({ viseme: 'PP', duration: PHONEME_DURATION });
    } else if ('fv'.includes(ch)) {
      visemes.push({ viseme: 'FF', duration: PHONEME_DURATION });
    } else if ('td nl'.includes(ch)) {
      visemes.push({ viseme: 'DD', duration: PHONEME_DURATION });
    } else if ('kg'.includes(ch)) {
      visemes.push({ viseme: 'kk', duration: PHONEME_DURATION });
    } else if ('sz'.includes(ch)) {
      visemes.push({ viseme: 'SS', duration: PHONEME_DURATION });
    } else if (ch === 'r') {
      visemes.push({ viseme: 'RR', duration: PHONEME_DURATION });
    } else if ('aă'.includes(ch)) {
      visemes.push({ viseme: 'aa', duration: PHONEME_DURATION });
    } else if ('eé'.includes(ch)) {
      visemes.push({ viseme: 'E', duration: PHONEME_DURATION });
    } else if ('iíy'.includes(ch)) {
      visemes.push({ viseme: 'I', duration: PHONEME_DURATION });
    } else if ('oó'.includes(ch)) {
      visemes.push({ viseme: 'O', duration: PHONEME_DURATION });
    } else if ('uú'.includes(ch)) {
      visemes.push({ viseme: 'U', duration: PHONEME_DURATION });
    } else if (ch === ' ') {
      visemes.push({ viseme: 'sil', duration: PHONEME_DURATION / 2 });
    }
  }

  return visemes;
}

/**
 * LipSyncController — drives viseme playback on a timeline.
 * Usage:
 *   const ctrl = new LipSyncController(visemes, (v) => setViseme(v));
 *   ctrl.start();
 */
export class LipSyncController {
  private visemes: Array<{ viseme: string; duration: number }>;
  private onVisemeChange: (viseme: string | null) => void;
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private isRunning = false;

  constructor(
    visemes: Array<{ viseme: string; duration: number }>,
    onVisemeChange: (viseme: string | null) => void
  ) {
    this.visemes = visemes;
    this.onVisemeChange = onVisemeChange;
  }

  start() {
    this.isRunning = true;
    let elapsed = 0;

    for (const { viseme, duration } of this.visemes) {
      const id = setTimeout(() => {
        if (this.isRunning) this.onVisemeChange(viseme);
      }, elapsed);
      this.timeoutIds.push(id);
      elapsed += duration;
    }

    // End with silence
    const endId = setTimeout(() => {
      if (this.isRunning) this.onVisemeChange(null);
    }, elapsed + 100);
    this.timeoutIds.push(endId);
  }

  stop() {
    this.isRunning = false;
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
    this.onVisemeChange(null);
  }

  get totalDuration(): number {
    return this.visemes.reduce((sum, v) => sum + v.duration, 0);
  }
}
