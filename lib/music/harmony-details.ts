import { Chord, Key } from "tonal";

import type { KeyMode } from "@/lib/types/content";
import { PC_TO_NAME, noteNameToPitchClass } from "@/lib/music/note-utils";

const ROMAN_MAJ = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const ROMAN_NAT = ["i", "ii°", "III", "iv", "v", "VI", "VII"] as const;
const ROMAN_HAR = ["i", "ii°", "III+", "iv", "V", "VI", "vii°"] as const;
const ROMAN_MEL = ["i", "ii", "III+", "IV", "V", "vi°7", "vii°7"] as const;

function triadsAndRomans(tonicPc: number, mode: KeyMode): { triads: string[]; romans: readonly string[] } {
  const tonicName = PC_TO_NAME[(tonicPc + 12) % 12];
  if (mode === "major") {
    const k = Key.majorKey(tonicName);
    return { triads: [...k.triads], romans: ROMAN_MAJ };
  }
  const mk = Key.minorKey(tonicName);
  if (mode === "natural") return { triads: [...mk.natural.triads], romans: ROMAN_NAT };
  if (mode === "harmonic") return { triads: [...mk.harmonic.triads], romans: ROMAN_HAR };
  return { triads: [...mk.melodic.triads], romans: ROMAN_MEL };
}

function chordRootPitchClass(token: string): number | null {
  const base = token.split("/")[0]?.trim() ?? token.trim();
  const c = Chord.get(base);
  if (c.empty || !c.tonic) return null;
  return noteNameToPitchClass(c.tonic);
}

/**
 * Seçilen ton ve moda göre akor kökü diyatonik bir dereceye denk geliyorsa Roma rakamını döndürür;
 * aksi halde null (kromatik / özel renk).
 */
export function romanNumeralForChordInKey(
  token: string,
  tonicPc: number,
  mode: KeyMode,
): string | null {
  const rootPc = chordRootPitchClass(token);
  if (rootPc === null) return null;
  const { triads, romans } = triadsAndRomans(tonicPc, mode);
  for (let i = 0; i < triads.length; i++) {
    const tr = Chord.get(triads[i]);
    if (tr.empty || !tr.tonic) continue;
    const tPc = noteNameToPitchClass(tr.tonic);
    if (tPc === rootPc) return romans[i] ?? null;
  }
  return null;
}
