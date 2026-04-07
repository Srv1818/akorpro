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

/**
 * Tonal alias → chords-db suffix. Tonal aliasları büyük/küçük harf karışık
 * gelebilir (ör. "mMaj7"); DB tamamen küçük harf kullanır ("mmaj7").
 */
function normalizeAliasToDbSuffix(alias: string): string {
  const a = alias.trim();
  if (a === "" || a === "M" || a === "^" || a.toLowerCase() === "maj") return "major";
  if (a === "m" || a.toLowerCase() === "min" || a === "-") return "minor";
  const lower = a.toLowerCase();
  if (SUPPORTED_SUFFIXES.has(lower)) return lower;
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

/* ------------------------------------------------------------------ */
/* Doğrudan regex tabanlı lookup — tonal'ın tanımadığı tokenler için   */
/* ------------------------------------------------------------------ */
const TOKEN_RE = /^([A-G](?:#|b)?)((?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*)$/i;

const DIRECT_SUFFIX_MAP: Record<string, string> = {
  "": "major",
  "M": "major",
  "maj": "major",
  "m": "minor",
  "min": "minor",
  "min6": "m6",
  "min7": "m7",
  "min9": "m9",
  "min11": "m11",
  "min13": "m13",
};

function tryDirectLookup(token: string): ResolvedChordFingering | null {
  const clean = token.split("/")[0]?.trim() ?? token.trim();
  const m = clean.match(TOKEN_RE);
  if (!m) return null;

  const root = m[1]!;
  const rawSuffix = (m[2] ?? "").toLowerCase();
  const dbKey = tonicToDbKey(root);
  if (!dbKey) return null;

  const suffix = DIRECT_SUFFIX_MAP[rawSuffix] ?? rawSuffix;
  if (!SUPPORTED_SUFFIXES.has(suffix)) return null;

  const result = getGuitarChord(dbKey, suffix);
  if (!result) return null;

  return { token, dbKey, suffix, chord: result.chord };
}

export type ResolvedChordFingering = {
  token: string;
  dbKey: GuitarRootDbKey | null;
  suffix: string | null;
  chord: GuitarChordDef | null;
};

export function resolveChordTokenToFingering(token: string): ResolvedChordFingering {
  const direct = tryDirectLookup(token);
  if (direct) return direct;

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
    const result = getGuitarChord(dbKey, suffix);
    if (result) return { token, dbKey, suffix, chord: result.chord };
  }

  const fallback = qualityFallbackSuffix(parsed.quality);
  const fallbackResult = getGuitarChord(dbKey, fallback);
  return { token, dbKey, suffix: fallback, chord: fallbackResult?.chord ?? null };
}
