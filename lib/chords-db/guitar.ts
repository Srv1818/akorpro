/** @tombatossals/chords-db kök `index.js` yayınlamıyor; gitar verisi `src/db/guitar` altında. */
import guitarDb from "@tombatossals/chords-db/src/db/guitar/index.js";

export type GuitarChordPosition = {
  frets: string;
  fingers: string;
  barres?: number;
  capo?: boolean;
};

export type GuitarChordDef = {
  key: string;
  suffix: string;
  positions: GuitarChordPosition[];
};

type GuitarChordsBucket = Record<string, GuitarChordDef[]>;

const chords = guitarDb.chords as GuitarChordsBucket;

/** Kütüphanedeki anahtar isimleri (C#, F# → Csharp, Fsharp) */
export const GUITAR_ROOT_ENTRIES = [
  { dbKey: "C", label: "C" },
  { dbKey: "Csharp", label: "C#" },
  { dbKey: "D", label: "D" },
  { dbKey: "Eb", label: "D#" },
  { dbKey: "E", label: "E" },
  { dbKey: "F", label: "F" },
  { dbKey: "Fsharp", label: "F#" },
  { dbKey: "G", label: "G" },
  { dbKey: "Ab", label: "G#" },
  { dbKey: "A", label: "A" },
  { dbKey: "Bb", label: "Bb" },
  { dbKey: "B", label: "B" },
] as const;

export type GuitarRootDbKey = (typeof GUITAR_ROOT_ENTRIES)[number]["dbKey"];

/** Ekteki 50 akor kalitesi — 5 satır × 10 sütun, birebir sırayla. */
export const GUITAR_QUALITY_OPTIONS = [
  // Satır 1
  { label: "Major", suffix: "major" },
  { label: "Minor", suffix: "minor" },
  { label: "7", suffix: "7" },
  { label: "5", suffix: "5" },
  { label: "dim", suffix: "dim" },
  { label: "dim7", suffix: "dim7" },
  { label: "aug", suffix: "aug" },
  { label: "sus2", suffix: "sus2" },
  { label: "sus4", suffix: "sus4" },
  { label: "maj7", suffix: "maj7" },
  // Satır 2
  { label: "m7", suffix: "m7" },
  { label: "7sus4", suffix: "7sus4" },
  { label: "maj9", suffix: "maj9" },
  { label: "maj11", suffix: "maj11" },
  { label: "maj13", suffix: "maj13" },
  { label: "maj9#11", suffix: "maj9#11" },
  { label: "maj13#11", suffix: "maj13#11" },
  { label: "add9", suffix: "add9" },
  { label: "6add9", suffix: "69" },
  { label: "maj7b5", suffix: "maj7b5" },
  // Satır 3
  { label: "maj7#5", suffix: "maj7#5" },
  { label: "m6", suffix: "m6" },
  { label: "m9", suffix: "m9" },
  { label: "m11", suffix: "m11" },
  { label: "m13", suffix: "m13" },
  { label: "madd9", suffix: "madd9" },
  { label: "m6add9", suffix: "m69" },
  { label: "mmaj7", suffix: "mmaj7" },
  { label: "mmaj9", suffix: "mmaj9" },
  { label: "m7b5", suffix: "m7b5" },
  // Satır 4
  { label: "m7#5", suffix: "m7#5" },
  { label: "6", suffix: "6" },
  { label: "9", suffix: "9" },
  { label: "11", suffix: "11" },
  { label: "13", suffix: "13" },
  { label: "7b5", suffix: "7b5" },
  { label: "7#5", suffix: "aug7" },
  { label: "7b9", suffix: "7b9" },
  { label: "7#9", suffix: "7#9" },
  { label: "7(b5,b9)", suffix: "7(b5,b9)" },
  // Satır 5
  { label: "7(b5,#9)", suffix: "7(b5,#9)" },
  { label: "7(#5,b9)", suffix: "7(#5,b9)" },
  { label: "7(#5,#9)", suffix: "7(#5,#9)" },
  { label: "9b5", suffix: "9b5" },
  { label: "9#5", suffix: "aug9" },
  { label: "13#11", suffix: "13#11" },
  { label: "13b9", suffix: "13b9" },
  { label: "11b9", suffix: "11b9" },
  { label: "sus2sus4", suffix: "sus2sus4" },
  { label: "-5", suffix: "-5" },
] as const;

export type GuitarQualitySuffix = (typeof GUITAR_QUALITY_OPTIONS)[number]["suffix"];

/**
 * UI suffix'i → chords-db'de denenecek alternatif suffix sırası.
 * Birincil suffix bulunamazsa sırayla denenir.
 */
const SUFFIX_FALLBACKS: Record<string, string[]> = {
  "7(b5,b9)":  ["alt"],
  "7(b5,#9)":  ["alt"],
  "7(#5,b9)":  ["aug7"],
  "7(#5,#9)":  ["aug7"],
  "m7#5":      ["mmaj7"],
  "m13":       ["m11"],
  "13#11":     ["9#11"],
  "13b9":      ["7b9"],
  "11b9":      ["7b9"],
};

export type GuitarChordResult = {
  chord: GuitarChordDef;
  /** Fallback suffix kullanıldıysa orijinal DB suffix'i, yoksa null. */
  fallbackSuffix: string | null;
};

export function getGuitarChord(dbKey: GuitarRootDbKey, suffix: string): GuitarChordResult | null {
  const list = chords[dbKey];
  if (!list?.length) return null;

  const direct = list.find((c) => c.suffix === suffix);
  if (direct) return { chord: direct, fallbackSuffix: null };

  const fallbacks = SUFFIX_FALLBACKS[suffix];
  if (fallbacks) {
    for (const fb of fallbacks) {
      const hit = list.find((c) => c.suffix === fb);
      if (hit) return { chord: hit, fallbackSuffix: fb };
    }
  }
  return null;
}

/** Tel 6 (kalın) … tel 1 (ince) — frets dizisi aynı sıra */
export function parseFretChar(c: string): "open" | "mute" | number {
  const ch = c.trim().toLowerCase();
  if (ch === "x") return "mute";
  if (ch === "0") return "open";
  const n = parseInt(ch, 16);
  if (Number.isNaN(n) || n < 0) return "mute";
  return n;
}
