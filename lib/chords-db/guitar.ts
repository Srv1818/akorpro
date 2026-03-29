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
  { dbKey: "Eb", label: "Eb" },
  { dbKey: "E", label: "E" },
  { dbKey: "F", label: "F" },
  { dbKey: "Fsharp", label: "F#" },
  { dbKey: "G", label: "G" },
  { dbKey: "Ab", label: "Ab" },
  { dbKey: "A", label: "A" },
  { dbKey: "Bb", label: "Bb" },
  { dbKey: "B", label: "B" },
] as const;

export type GuitarRootDbKey = (typeof GUITAR_ROOT_ENTRIES)[number]["dbKey"];

/** Arayüz etiketi → chords-db suffix */
export const GUITAR_QUALITY_OPTIONS = [
  { label: "Major", suffix: "major" },
  { label: "Minor", suffix: "minor" },
  { label: "7", suffix: "7" },
  { label: "m7", suffix: "m7" },
  { label: "maj7", suffix: "maj7" },
  { label: "dim", suffix: "dim" },
  { label: "dim7", suffix: "dim7" },
  { label: "aug", suffix: "aug" },
  { label: "sus2", suffix: "sus2" },
  { label: "sus4", suffix: "sus4" },
  { label: "6", suffix: "6" },
  { label: "m6", suffix: "m6" },
  { label: "6/9", suffix: "69" },
  { label: "9", suffix: "9" },
  { label: "m9", suffix: "m9" },
  { label: "add9", suffix: "add9" },
  { label: "madd9", suffix: "madd9" },
  { label: "7sus4", suffix: "7sus4" },
  { label: "m7b5", suffix: "m7b5" },
  { label: "7#9", suffix: "7#9" },
  { label: "7b9", suffix: "7b9" },
  { label: "9b5", suffix: "9b5" },
  { label: "9#11", suffix: "9#11" },
  { label: "13", suffix: "13" },
  { label: "maj9", suffix: "maj9" },
  { label: "m11", suffix: "m11" },
  { label: "11", suffix: "11" },
  { label: "maj11", suffix: "maj11" },
  { label: "maj13", suffix: "maj13" },
  { label: "m69", suffix: "m69" },
  { label: "aug7", suffix: "aug7" },
  { label: "7b5", suffix: "7b5" },
  { label: "maj7#5", suffix: "maj7#5" },
  { label: "maj7b5", suffix: "maj7b5" },
  { label: "mmaj7", suffix: "mmaj7" },
  { label: "mmaj7b5", suffix: "mmaj7b5" },
  { label: "mmaj9", suffix: "mmaj9" },
  { label: "mmaj11", suffix: "mmaj11" },
  { label: "aug9", suffix: "aug9" },
  { label: "alt", suffix: "alt" },
  { label: "7sg", suffix: "7sg" },
] as const;

export type GuitarQualitySuffix = (typeof GUITAR_QUALITY_OPTIONS)[number]["suffix"];

export function getGuitarChord(dbKey: GuitarRootDbKey, suffix: string): GuitarChordDef | null {
  const list = chords[dbKey];
  if (!list?.length) return null;
  return list.find((c) => c.suffix === suffix) ?? null;
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
