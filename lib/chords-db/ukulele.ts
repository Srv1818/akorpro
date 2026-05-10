// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — no declaration file for chords-db sub-path
import ukuleleDb from "@tombatossals/chords-db/src/db/ukulele/index.js";
import { noteNameToPitchClass } from "@/lib/music/note-utils";

export type UkuleleChordPosition = {
  frets: string;
  fingers: string;
  barres?: number;
  capo?: boolean;
};

export type UkuleleChordDef = {
  key: string;
  suffix: string;
  positions: UkuleleChordPosition[];
};

type UkuleleChordsBucket = Record<string, UkuleleChordDef[]>;

const chords = ukuleleDb.chords as UkuleleChordsBucket;

export const UKULELE_ROOT_ENTRIES = [
  { dbKey: "C",      label: "C"  },
  { dbKey: "Csharp", label: "C#" },
  { dbKey: "D",      label: "D"  },
  { dbKey: "Eb",     label: "D#" },
  { dbKey: "E",      label: "E"  },
  { dbKey: "F",      label: "F"  },
  { dbKey: "Fsharp", label: "F#" },
  { dbKey: "G",      label: "G"  },
  { dbKey: "Ab",     label: "G#" },
  { dbKey: "A",      label: "A"  },
  { dbKey: "Bb",     label: "Bb" },
  { dbKey: "B",      label: "B"  },
] as const;

export type UkuleleRootDbKey = (typeof UKULELE_ROOT_ENTRIES)[number]["dbKey"];

const DB_KEY_BY_PC: Record<number, UkuleleRootDbKey> = {
  0: "C", 1: "Csharp", 2: "D", 3: "Eb", 4: "E", 5: "F",
  6: "Fsharp", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B",
};

export function getUkuleleChord(dbKey: UkuleleRootDbKey, suffix: string): UkuleleChordDef | null {
  const list = chords[dbKey];
  if (!list?.length) return null;
  return list.find((c) => c.suffix === suffix) ?? null;
}

export function resolveUkuleleChord(token: string): { chord: UkuleleChordDef | null } {
  const clean = token.split("/")[0]?.trim() ?? token.trim();
  const m = clean.match(/^([A-G](?:#|b)?)(.*)/);
  if (!m) return { chord: null };

  const root = m[1]!;
  let rawSuffix = (m[2] ?? "").trim();

  const pc = noteNameToPitchClass(root);
  if (pc === null) return { chord: null };
  const dbKey = DB_KEY_BY_PC[pc];
  if (!dbKey) return { chord: null };

  if (rawSuffix === "" || rawSuffix === "M" || rawSuffix.toLowerCase() === "maj") rawSuffix = "major";
  else if (rawSuffix === "m" || rawSuffix.toLowerCase() === "min") rawSuffix = "minor";
  else rawSuffix = rawSuffix.toLowerCase();

  const direct = getUkuleleChord(dbKey, rawSuffix);
  if (direct) return { chord: direct };

  const fallback = getUkuleleChord(dbKey, rawSuffix.startsWith("m") ? "minor" : "major");
  return { chord: fallback ?? null };
}

export const STRING_COUNT_UKULELE = 4;

export function parseUkuleleFretChar(c: string): "open" | "mute" | number {
  const ch = c.trim().toLowerCase();
  if (ch === "x") return "mute";
  if (ch === "0") return "open";
  const n = parseInt(ch, 16);
  if (Number.isNaN(n) || n < 0) return "mute";
  return n;
}
