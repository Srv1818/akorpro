/**
 * Gamlar sayfası — Tonal.js `Scale.get([tonic, tonalType])` ile eşleşen tipler.
 * Görünen isimler kullanıcı referans listesine uygundur.
 */
export type GamlarScaleCatalogEntry = {
  id: string;
  name: string;
  /** Scale.get ikinci bileşeni (örn. "major", "half-whole diminished") */
  tonalType: string;
  category: string;
  description?: string;
  sortOrder: number;
};

export const GAMLAR_SCALE_CATALOG: readonly GamlarScaleCatalogEntry[] = [
  {
    id: "major",
    name: "Major",
    tonalType: "major",
    category: "Majör, minör, pentatonik",
    sortOrder: 1,
  },
  {
    id: "harmonic-minor",
    name: "Harmonic Minor",
    tonalType: "harmonic minor",
    category: "Majör, minör, pentatonik",
    sortOrder: 2,
  },
  {
    id: "melodic-minor",
    name: "Melodic Minor",
    tonalType: "melodic minor",
    category: "Majör, minör, pentatonik",
    sortOrder: 3,
  },
  {
    id: "natural-minor",
    name: "Natural Minor",
    tonalType: "minor",
    category: "Majör, minör, pentatonik",
    sortOrder: 4,
  },
  {
    id: "pentatonic-major",
    name: "Pentatonic Major",
    tonalType: "major pentatonic",
    category: "Majör, minör, pentatonik",
    sortOrder: 5,
  },
  {
    id: "pentatonic-minor",
    name: "Pentatonic Minor",
    tonalType: "minor pentatonic",
    category: "Majör, minör, pentatonik",
    sortOrder: 6,
  },
  {
    id: "pentatonic-blues",
    name: "Pentatonic Blues",
    tonalType: "blues",
    category: "Majör, minör, pentatonik",
    sortOrder: 7,
  },
  {
    id: "pentatonic-neutral",
    name: "Pentatonic Neutral",
    tonalType: "ritusen",
    category: "Majör, minör, pentatonik",
    description: "Tonal: ritusen (1–2–4–5–6)",
    sortOrder: 8,
  },
  {
    id: "ionian",
    name: "Ionian",
    tonalType: "ionian",
    category: "Modlar",
    sortOrder: 9,
  },
  {
    id: "dorian",
    name: "Dorian",
    tonalType: "dorian",
    category: "Modlar",
    sortOrder: 10,
  },
  {
    id: "phrygian",
    name: "Phrygian",
    tonalType: "phrygian",
    category: "Modlar",
    sortOrder: 11,
  },
  {
    id: "lydian",
    name: "Lydian",
    tonalType: "lydian",
    category: "Modlar",
    sortOrder: 12,
  },
  {
    id: "mixolydian",
    name: "Mixolydian",
    tonalType: "mixolydian",
    category: "Modlar",
    sortOrder: 13,
  },
  {
    id: "aeolian",
    name: "Aeolian",
    tonalType: "aeolian",
    category: "Modlar",
    sortOrder: 14,
  },
  {
    id: "locrian",
    name: "Locrian",
    tonalType: "locrian",
    category: "Modlar",
    sortOrder: 15,
  },
  {
    id: "diatonic",
    name: "Diatonic",
    tonalType: "major",
    category: "Simetrik & altered",
    description: "Majör / İyonik ile aynı dizi",
    sortOrder: 16,
  },
  {
    id: "diminished",
    name: "Diminished",
    tonalType: "diminished",
    category: "Simetrik & altered",
    description: "Sekizlik (tam–yarım), Tonal: diminished",
    sortOrder: 17,
  },
  {
    id: "diminished-half-whole",
    name: "Diminished, Half",
    tonalType: "half-whole diminished",
    category: "Simetrik & altered",
    description: "Yarım–tam sekizlik",
    sortOrder: 18,
  },
  {
    id: "diminished-whole",
    name: "Diminished, Whole",
    tonalType: "diminished",
    category: "Simetrik & altered",
    description: "Üstteki Diminished ile aynı dizi (farklı adlandırma)",
    sortOrder: 19,
  },
  {
    id: "diminished-whole-tone",
    name: "Diminished Whole Tone",
    tonalType: "leading whole tone",
    category: "Simetrik & altered",
    sortOrder: 20,
  },
  {
    id: "dominant-7th",
    name: "Dominant 7th",
    tonalType: "dominant",
    category: "Simetrik & altered",
    description: "Miksolidyen ile aynı yedili dizi (Tonal: dominant)",
    sortOrder: 21,
  },
  {
    id: "lydian-augmented",
    name: "Lydian Augmented",
    tonalType: "lydian augmented",
    category: "Simetrik & altered",
    sortOrder: 22,
  },
  {
    id: "lydian-minor",
    name: "Lydian Minor",
    tonalType: "lydian minor",
    category: "Simetrik & altered",
    sortOrder: 23,
  },
  {
    id: "lydian-diminished",
    name: "Lydian Diminished",
    tonalType: "lydian diminished",
    category: "Simetrik & altered",
    sortOrder: 24,
  },
];

const byId = new Map(GAMLAR_SCALE_CATALOG.map((e) => [e.id, e]));

export function gamlarScaleById(id: string | null | undefined): GamlarScaleCatalogEntry | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export function defaultGamlarScaleId(): string {
  return GAMLAR_SCALE_CATALOG[0]?.id ?? "major";
}
