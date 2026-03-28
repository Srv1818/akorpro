import type { MockScale } from "@/lib/types/content";

/** Gam → nota eşlemesi (C merkezli örnek) — ARCHITECTURE Faz 1 mock */
export const mockScales: MockScale[] = [
  { id: "ionian", name: "Iyonik (Majör)", notesC: ["C", "D", "E", "F", "G", "A", "B"] },
  { id: "aeolian", name: "Eol (Doğal minör)", notesC: ["C", "D", "Eb", "F", "G", "Ab", "Bb"] },
  { id: "dorian", name: "Dorik", notesC: ["C", "D", "Eb", "F", "G", "A", "Bb"] },
  { id: "mixolydian", name: "Miksolidyen", notesC: ["C", "D", "E", "F", "G", "A", "Bb"] },
  { id: "pent-major", name: "Majör pentatonik", notesC: ["C", "D", "E", "G", "A"] },
  { id: "pent-minor", name: "Minör pentatonik", notesC: ["C", "Eb", "F", "G", "Bb"] },
];
