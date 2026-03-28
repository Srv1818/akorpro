import type { MockChordShape } from "@/lib/types/content";

/** Akor kütüphanesi — varyasyon şeması örneği (mock) */
export const mockChordShapes: MockChordShape[] = [
  { id: "c1", name: "C maj (açık)", fingering: "x32010", root: "C", quality: "maj" },
  { id: "c2", name: "G maj (açık)", fingering: "320003", root: "G", quality: "maj" },
  { id: "c3", name: "Am (açık)", fingering: "x02210", root: "A", quality: "min" },
  { id: "c4", name: "F maj (barre)", fingering: "133211", root: "F", quality: "maj" },
  { id: "c5", name: "Dm7", fingering: "xx0211", root: "D", quality: "m7" },
  { id: "c6", name: "Esus4", fingering: "022200", root: "E", quality: "sus4" },
];
