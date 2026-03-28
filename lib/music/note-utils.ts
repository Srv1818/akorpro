/** Pitch class 0 = C … 11 = B */

export const PC_TO_NAME: Record<number, string> = {
  0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
};

const NAME_TO_PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  DB: 1,
  D: 2,
  "D#": 3,
  EB: 3,
  E: 4,
  F: 5,
  "F#": 6,
  GB: 6,
  G: 7,
  "G#": 8,
  AB: 8,
  A: 9,
  "A#": 10,
  BB: 10,
  B: 11,
};

export function noteNameToPitchClass(note: string): number | null {
  const n = note.trim().toUpperCase().replace(/\s/g, "");
  if (n in NAME_TO_PC) return NAME_TO_PC[n];
  return null;
}

/** Saat yönü, üstte C — müzikte 5’li daire sırası */
export const CO5_PITCH_CLASSES = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5] as const;

export const CO5_LABELS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"] as const;

/** Tel 1 (ince E) üstte → tel 6 (kalın E) altta — açık perdelerin pitch class’ı */
export const OPEN_STRING_PC_TOP_FIRST = [4, 11, 7, 2, 9, 4] as const;

export function scalePitchClassesInKey(scaleNotesC: readonly string[], keyPc: number): Set<number> {
  const out = new Set<number>();
  for (const name of scaleNotesC) {
    const pc = noteNameToPitchClass(name);
    if (pc !== null) out.add((pc + keyPc) % 12);
  }
  return out;
}

export function majorTriadPitchClasses(rootPc: number): Set<number> {
  return new Set<number>([rootPc % 12, (rootPc + 4) % 12, (rootPc + 7) % 12]);
}
