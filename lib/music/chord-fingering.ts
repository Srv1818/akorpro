import { Chord } from "tonal";
import {
  getGuitarChord,
  GUITAR_QUALITY_OPTIONS,
  type GuitarChordDef,
  type GuitarQualitySuffix,
  type GuitarRootDbKey,
} from "@/lib/chords-db/guitar";
import { noteNameToPitchClass } from "@/lib/music/note-utils";

const DB_KEY_BY_PC: Record<number, GuitarRootDbKey> = {
  0: "C",
  1: "Csharp",
  2: "D",
  3: "Eb",
  4: "E",
  5: "F",
  6: "Fsharp",
  7: "G",
  8: "Ab",
  9: "A",
  10: "Bb",
  11: "B",
};

const SUPPORTED_SUFFIXES = new Set<string>(GUITAR_QUALITY_OPTIONS.map((q) => q.suffix));

function normalizeAliasToDbSuffix(alias: string): string {
  const a = alias.trim();
  if (a === "" || a === "M" || a === "^" || a.toLowerCase() === "maj") return "major";
  if (a === "m" || a.toLowerCase() === "min" || a === "-") return "minor";
  return a;
}

function qualityFallbackSuffix(quality: string): GuitarQualitySuffix {
  if (quality === "Minor") return "minor";
  if (quality === "Augmented") return "aug";
  if (quality === "Diminished") return "dim";
  return "major";
}

function tonicToDbKey(tonic: string): GuitarRootDbKey | null {
  const pc = noteNameToPitchClass(tonic);
  if (pc === null) return null;
  return DB_KEY_BY_PC[pc] ?? null;
}

export type ResolvedChordFingering = {
  token: string;
  dbKey: GuitarRootDbKey | null;
  suffix: string | null;
  chord: GuitarChordDef | null;
};

export function resolveChordTokenToFingering(token: string): ResolvedChordFingering {
  const symbol = token.split("/")[0]?.trim() ?? token.trim();
  const parsed = Chord.get(symbol);
  if (parsed.empty || !parsed.tonic) {
    return { token, dbKey: null, suffix: null, chord: null };
  }

  const dbKey = tonicToDbKey(parsed.tonic);
  if (!dbKey) return { token, dbKey: null, suffix: null, chord: null };

  const candidates = [
    ...new Set(
      parsed.aliases
        .map(normalizeAliasToDbSuffix)
        .filter((s) => s.length > 0),
    ),
  ];

  for (const suffix of candidates) {
    if (!SUPPORTED_SUFFIXES.has(suffix)) continue;
    const chord = getGuitarChord(dbKey, suffix);
    if (chord) return { token, dbKey, suffix, chord };
  }

  const fallback = qualityFallbackSuffix(parsed.quality);
  const fallbackChord = getGuitarChord(dbKey, fallback) ?? null;
  return { token, dbKey, suffix: fallback, chord: fallbackChord };
}
