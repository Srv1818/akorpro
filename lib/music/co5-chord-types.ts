/** 5'li çember panelleri ve akor satırı — `circle-of-fifths` ile paylaşılır */

export type ChordQuality = "major" | "minor" | "diminished" | "augmented" | "dominant" | "half-dim";

export type Co5ChordPanel = "major" | "minor" | "dim";

export type Co5ChordEntry = {
  degree: number;
  roman: string;
  symbol: string;
  quality: ChordQuality;
  panel: Co5ChordPanel;
  alteration?: string;
};
