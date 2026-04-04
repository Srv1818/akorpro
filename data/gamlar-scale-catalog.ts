/**
 * Gamlar — Tonal.js `Scale.get([tonic, tonalType])` ile eşleşen modlar.
 * Aileler: Majör, Doğal minör, Harmonik minör, Melodik minör, Blues (pentatonik & blues).
 */

export type GamlarFamilyId =
  | "major"
  | "natural-minor"
  | "harmonic-minor"
  | "melodic-minor"
  | "blues";

export type GamlarScaleCatalogEntry = {
  id: string;
  name: string;
  /** Scale.get ikinci bileşeni */
  tonalType: string;
  /** Gruplama: aile kimliği */
  category: GamlarFamilyId;
  sortOrder: number;
  /** Kısa alt başlık (ör. formül) */
  subtitle?: string;
  /** C üzerinden örnek — kullanıcı referansı */
  formula?: string;
  triadsExample?: string;
  seventhsExample?: string;
};

/** Alt seçim sırası */
export const GAMLAR_FAMILY_ORDER: readonly GamlarFamilyId[] = [
  "major",
  "natural-minor",
  "harmonic-minor",
  "melodic-minor",
  "blues",
];

export const GAMLAR_FAMILY_LABELS: Record<
  GamlarFamilyId,
  { title: string; shortTab: string; blurb: string }
> = {
  major: {
    title: "Majör ailesi",
    shortTab: "Majör",
    blurb: "Pop, rock ve standart armoni — MAJOR SCALE MODES.",
  },
  "natural-minor": {
    title: "Doğal minör ailesi",
    shortTab: "Doğal minör",
    blurb: "Diyatonik dizi (doğal minör merkezli mod sırası).",
  },
  "harmonic-minor": {
    title: "Harmonik minör ailesi",
    shortTab: "Harmonik minör",
    blurb: "Egzotik, karanlık, Orta Doğu / flamenko ve neo-klasik armoni.",
  },
  "melodic-minor": {
    title: "Melodik minör ailesi",
    shortTab: "Melodik minör",
    blurb: "Caz armonisi ve modern gerilim / çözülme.",
  },
  blues: {
    title: "Blues & pentatonik",
    shortTab: "Blues",
    blurb: "Pentatonik ve blues dizileri — solo ve hedef akorlar.",
  },
};

const MAJOR_MODES: readonly Omit<GamlarScaleCatalogEntry, "category" | "sortOrder">[] = [
  {
    id: "maj-ionian",
    name: "Ionian (Major)",
    tonalType: "ionian",
    subtitle: "Formül: 1 - 2 - 3 - 4 - 5 - 6 - 7",
    formula: "1 - 2 - 3 - 4 - 5 - 6 - 7",
    triadsExample: "C — Dm — Em — F — G — Am — Bdim",
    seventhsExample: "Cmaj7 — Dm7 — Em7 — Fmaj7 — G7 — Am7 — Bm7b5",
  },
  {
    id: "maj-dorian",
    name: "Dorian",
    tonalType: "dorian",
    subtitle: "Formül: 1 - 2 - b3 - 4 - 5 - 6 - b7",
    formula: "1 - 2 - b3 - 4 - 5 - 6 - b7",
    triadsExample: "Cm — Dm — Eb — F — Gm — Adim — Bb",
    seventhsExample: "Cm7 — Dm7 — Ebmaj7 — F7 — Gm7 — Am7b5 — Bbmaj7",
  },
  {
    id: "maj-phrygian",
    name: "Phrygian",
    tonalType: "phrygian",
    subtitle: "Formül: 1 - b2 - b3 - 4 - 5 - b6 - b7",
    formula: "1 - b2 - b3 - 4 - 5 - b6 - b7",
    triadsExample: "Cm — Db — Eb — Fm — Gdim — Ab — Bbm",
    seventhsExample: "Cm7 — Dbmaj7 — Eb7 — Fm7 — Gm7b5 — Abmaj7 — Bbm7",
  },
  {
    id: "maj-lydian",
    name: "Lydian",
    tonalType: "lydian",
    subtitle: "Formül: 1 - 2 - 3 - #4 - 5 - 6 - 7",
    formula: "1 - 2 - 3 - #4 - 5 - 6 - 7",
    triadsExample: "C — D — Em — F#dim — G — Am — Bm",
    seventhsExample: "Cmaj7 — D7 — Em7 — F#m7b5 — Gmaj7 — Am7 — Bm7",
  },
  {
    id: "maj-mixolydian",
    name: "Mixolydian",
    tonalType: "mixolydian",
    subtitle: "Formül: 1 - 2 - 3 - 4 - 5 - 6 - b7",
    formula: "1 - 2 - 3 - 4 - 5 - 6 - b7",
    triadsExample: "C — Dm — Edim — F — Gm — Am — Bb",
    seventhsExample: "C7 — Dm7 — Em7b5 — Fmaj7 — Gm7 — Am7 — Bbmaj7",
  },
  {
    id: "maj-aeolian",
    name: "Aeolian (Natural Minor)",
    tonalType: "aeolian",
    subtitle: "Formül: 1 - 2 - b3 - 4 - 5 - b6 - b7",
    formula: "1 - 2 - b3 - 4 - 5 - b6 - b7",
    triadsExample: "Cm — Ddim — Eb — Fm — Gm — Ab — Bb",
    seventhsExample: "Cm7 — Dm7b5 — Ebmaj7 — Fm7 — Gm7 — Abmaj7 — Bb7",
  },
  {
    id: "maj-locrian",
    name: "Locrian",
    tonalType: "locrian",
    subtitle: "Formül: 1 - b2 - b3 - 4 - b5 - b6 - b7",
    formula: "1 - b2 - b3 - 4 - b5 - b6 - b7",
    triadsExample: "Cdim — Db — Ebm — Fm — Gb — Ab — Bbm",
    seventhsExample: "Cm7b5 — Dbmaj7 — Ebm7 — Fm7 — Gbmaj7 — Ab7 — Bbm7",
  },
];

/** Doğal minör üzerinden mod sırası (paralel kök C); tonal tipler majör ailesiyle aynı, sıra farklı. */
const NATURAL_MINOR_ORDER = [
  "nm-aeolian",
  "nm-locrian",
  "nm-ionian",
  "nm-dorian",
  "nm-phrygian",
  "nm-lydian",
  "nm-mixolydian",
] as const;

const NM_TYPES = ["aeolian", "locrian", "ionian", "dorian", "phrygian", "lydian", "mixolydian"] as const;

const NM_NAMES = [
  "Aeolian (Natural Minor)",
  "Locrian",
  "Ionian",
  "Dorian",
  "Phrygian",
  "Lydian",
  "Mixolydian",
] as const;

function naturalMinorModes(): GamlarScaleCatalogEntry[] {
  return NATURAL_MINOR_ORDER.map((id, i) => {
    const base = MAJOR_MODES.find((m) => m.tonalType === NM_TYPES[i]);
    return {
      id,
      name: NM_NAMES[i],
      tonalType: NM_TYPES[i],
      category: "natural-minor" as const,
      sortOrder: 100 + i,
      subtitle: base?.subtitle,
      formula: base?.formula,
      triadsExample: base?.triadsExample,
      seventhsExample: base?.seventhsExample,
    };
  });
}

const HARMONIC_MINOR_MODES: readonly Omit<GamlarScaleCatalogEntry, "category" | "sortOrder">[] = [
  {
    id: "hm-harmonic",
    name: "Harmonic Minor",
    tonalType: "harmonic minor",
    subtitle: "Formül: 1 - 2 - b3 - 4 - 5 - b6 - 7",
    formula: "1 - 2 - b3 - 4 - 5 - b6 - 7",
    triadsExample: "Cm — Ddim — Eb+ — Fm — G — Ab — Bdim",
    seventhsExample: "CmM7 — Dm7b5 — Ebmaj7#5 — Fm7 — G7 — Abmaj7 — Bdim7",
  },
  {
    id: "hm-locrian6",
    name: "Locrian ♮6",
    tonalType: "locrian 6",
    subtitle: "Formül: 1 - b2 - b3 - 4 - b5 - 6 - b7",
    formula: "1 - b2 - b3 - 4 - b5 - 6 - b7",
    triadsExample: "Cdim — Db+ — Ebm — F — Gb — Adim — Bbm",
    seventhsExample: "Cm7b5 — Dbmaj7#5 — Ebm7 — F7 — Gbmaj7 — Adim7 — BbmM7",
  },
  {
    id: "hm-ionian-aug",
    name: "Ionian Augmented (Ionian #5)",
    tonalType: "major augmented",
    subtitle: "Formül: 1 - 2 - 3 - 4 - #5 - 6 - 7",
    formula: "1 - 2 - 3 - 4 - #5 - 6 - 7",
    triadsExample: "C+ — Dm — E — F — G#dim — Am — Bdim",
    seventhsExample: "Cmaj7#5 — Dm7 — E7 — Fmaj7 — G#dim7 — AmM7 — Bm7b5",
  },
  {
    id: "hm-dorian-sharp4",
    name: "Dorian #4 (Ukrainian Dorian)",
    tonalType: "dorian #4",
    subtitle: "Formül: 1 - 2 - b3 - #4 - 5 - 6 - b7",
    formula: "1 - 2 - b3 - #4 - 5 - 6 - b7",
    triadsExample: "Cm — D — Eb — F#dim — Gm — Adim — Bb+",
    seventhsExample: "Cm7 — D7 — Ebmaj7 — F#dim7 — GmM7 — Am7b5 — Bbmaj7#5",
  },
  {
    id: "hm-phrygian-dom",
    name: "Phrygian Dominant",
    tonalType: "phrygian dominant",
    subtitle: "Formül: 1 - b2 - 3 - 4 - 5 - b6 - b7",
    formula: "1 - b2 - 3 - 4 - 5 - b6 - b7",
    triadsExample: "C — Db — Edim — Fm — Gdim — Ab+ — Bbm",
    seventhsExample: "C7 — Dbmaj7 — Edim7 — FmM7 — Gm7b5 — Abmaj7#5 — Bbm7",
  },
  {
    id: "hm-lydian-sharp2",
    name: "Lydian #2",
    tonalType: "lydian #9",
    subtitle: "Formül: 1 - #2 - 3 - #4 - 5 - 6 - 7",
    formula: "1 - #2 - 3 - #4 - 5 - 6 - 7",
    triadsExample: "C — D#dim — Em — F#dim — G+ — Am — B",
    seventhsExample: "Cmaj7 — D#dim7 — EmM7 — F#m7b5 — Gmaj7#5 — Am7 — B7",
  },
  {
    id: "hm-ultralocrian",
    name: "Super Locrian bb7 (Altered Diminished)",
    tonalType: "ultralocrian",
    subtitle: "Formül: 1 - b2 - b3 - b4 - b5 - b6 - bb7",
    formula: "1 - b2 - b3 - b4 - b5 - b6 - bb7",
    triadsExample: "Cdim — Dbm — Ebdim — E+ — Gbm — Ab — A",
    seventhsExample: "Cdim7 — DbmM7 — Ebm7b5 — Emaj7#5 — Gbm7 — Ab7 — Amaj7",
  },
];

const MELODIC_MINOR_MODES: readonly Omit<GamlarScaleCatalogEntry, "category" | "sortOrder">[] = [
  {
    id: "mm-melodic",
    name: "Melodic Minor (Jazz Minor)",
    tonalType: "melodic minor",
    subtitle: "Formül: 1 - 2 - b3 - 4 - 5 - 6 - 7",
    formula: "1 - 2 - b3 - 4 - 5 - 6 - 7",
    triadsExample: "Cm — Dm — Eb+ — F — G — Adim — Bdim",
    seventhsExample: "CmM7 — Dm7 — Ebmaj7#5 — F7 — G7 — Am7b5 — Bm7b5",
  },
  {
    id: "mm-dorian-b2",
    name: "Dorian b2",
    tonalType: "dorian b2",
    subtitle: "Formül: 1 - b2 - b3 - 4 - 5 - 6 - b7",
    formula: "1 - b2 - b3 - 4 - 5 - 6 - b7",
    triadsExample: "Cm — Db+ — Eb — F — Gdim — Adim — Bbm",
    seventhsExample: "Cm7 — Dbmaj7#5 — Eb7 — F7 — Gm7b5 — Am7b5 — BbmM7",
  },
  {
    id: "mm-lydian-aug",
    name: "Lydian Augmented (Lydian #5)",
    tonalType: "lydian augmented",
    subtitle: "Formül: 1 - 2 - 3 - #4 - #5 - 6 - 7",
    formula: "1 - 2 - 3 - #4 - #5 - 6 - 7",
    triadsExample: "C+ — D — E — F#dim — G#dim — Am — Bm",
    seventhsExample: "Cmaj7#5 — D7 — E7 — F#m7b5 — G#m7b5 — AmM7 — Bm7",
  },
  {
    id: "mm-lydian-dom",
    name: "Lydian Dominant (Lydian b7)",
    tonalType: "lydian dominant",
    subtitle: "Formül: 1 - 2 - 3 - #4 - 5 - 6 - b7",
    formula: "1 - 2 - 3 - #4 - 5 - 6 - b7",
    triadsExample: "C — D — Edim — F#dim — Gm — Am — Bb+",
    seventhsExample: "C7 — D7 — Em7b5 — F#m7b5 — GmM7 — Am7 — Bbmaj7#5",
  },
  {
    id: "mm-mixolydian-b6",
    name: "Mixolydian b6 (Melodic Major)",
    tonalType: "mixolydian b6",
    subtitle: "Formül: 1 - 2 - 3 - 4 - 5 - b6 - b7",
    formula: "1 - 2 - 3 - 4 - 5 - b6 - b7",
    triadsExample: "C — Ddim — Edim — Fm — Gm — Ab+ — Bb",
    seventhsExample: "C7 — Dm7b5 — Em7b5 — FmM7 — Gm7 — Abmaj7#5 — Bb7",
  },
  {
    id: "mm-locrian-nat2",
    name: "Locrian ♮2",
    tonalType: "locrian #2",
    subtitle: "Formül: 1 - 2 - b3 - 4 - b5 - b6 - b7",
    formula: "1 - 2 - b3 - 4 - b5 - b6 - b7",
    triadsExample: "Cdim — Ddim — Ebm — Fm — Gb+ — Ab — Bb",
    seventhsExample: "Cm7b5 — Dm7b5 — EbmM7 — Fm7 — Gbmaj7#5 — Ab7 — Bb7",
  },
  {
    id: "mm-altered",
    name: "Altered Scale (Super Locrian)",
    tonalType: "altered",
    subtitle: "Formül: 1 - b2 - #2 - 3 - b5 - #5 - b7",
    formula: "1 - b2 - #2 - 3 - b5 - #5 - b7",
    triadsExample: "Cdim — Dbm — Ebm — E+ — Gb — Ab — Bbm",
    seventhsExample:
      "Cm7b5 — DbmM7 — Ebm7 — (Fbmaj7#5) — Gb7 — Ab7 — Bbm7b5 · Pratik: C7alt veya C7#9",
  },
];

const BLUES_MODES: readonly Omit<GamlarScaleCatalogEntry, "category" | "sortOrder">[] = [
  {
    id: "blues-min-pent",
    name: "Minor Pentatonic (Minör Pentatonik)",
    tonalType: "minor pentatonic",
    subtitle:
      "Müzikteki en popüler solo gamı. İçinde sakınılacak yarım ses aralıkları yoktur.",
    formula: "1 - b3 - 4 - 5 - b7 (5 nota)",
    triadsExample: "Cm, Cm7",
  },
  {
    id: "blues-maj-pent",
    name: "Major Pentatonic (Majör Pentatonik)",
    tonalType: "major pentatonic",
    subtitle: "Country, Soul ve neşeli Pop melodilerinin temeli.",
    formula: "1 - 2 - 3 - 5 - 6 (5 nota)",
    triadsExample: "C, C6, Cmaj7",
  },
  {
    id: "blues-minor-blues",
    name: "Minor Blues Scale (Klasik Minör Blues Gamı)",
    tonalType: "blues",
    subtitle:
      "Minör pentatoniğin içine \"Blue Note\" (b5 / #4) eklenmiş halidir. O meşhur kirli ve hüzünlü blues tınısını veren nota budur.",
    formula: "1 - b3 - 4 - b5 - 5 - b7 (6 nota)",
    triadsExample: "C7, Cm7",
    seventhsExample:
      "Blues armonisinin en büyük sırrı şudur: Altyapıda C7 gibi Majör/Dominant bir akor çalarken, üzerine C Minör Blues gamı çalınır. Majör 3'lü ile gamdaki Minör 3'lünün çarpışması o efsanevi blues hissini yaratır.",
  },
  {
    id: "blues-major-blues",
    name: "Major Blues Scale (Majör Blues Gamı)",
    tonalType: "major blues",
    subtitle:
      "Majör pentatoniğin içine minör 3'lü (b3) eklenmiş halidir. Country-Blues ve Rockabilly hissiyatı verir.",
    formula: "1 - 2 - b3 - 3 - 5 - 6 (6 nota)",
    triadsExample: "C, C7",
  },
];

function withCategory(
  modes: readonly Omit<GamlarScaleCatalogEntry, "category" | "sortOrder">[],
  family: GamlarFamilyId,
  baseOrder: number
): GamlarScaleCatalogEntry[] {
  return modes.map((m, i) => ({
    ...m,
    category: family,
    sortOrder: baseOrder + i,
  }));
}

export const GAMLAR_SCALE_CATALOG: readonly GamlarScaleCatalogEntry[] = [
  ...withCategory(MAJOR_MODES, "major", 0),
  ...naturalMinorModes(),
  ...withCategory(HARMONIC_MINOR_MODES, "harmonic-minor", 200),
  ...withCategory(MELODIC_MINOR_MODES, "melodic-minor", 300),
  ...withCategory(BLUES_MODES, "blues", 400),
];

const byId = new Map(GAMLAR_SCALE_CATALOG.map((e) => [e.id, e]));

/** Eski kayıtlar ve kısayollar */
const LEGACY_SCALE_ID_ALIASES: Record<string, string> = {
  major: "maj-ionian",
  minor: "maj-aeolian",
  ionian: "maj-ionian",
  dorian: "maj-dorian",
  phrygian: "maj-phrygian",
  lydian: "maj-lydian",
  mixolydian: "maj-mixolydian",
  aeolian: "maj-aeolian",
  locrian: "maj-locrian",
  "natural-minor": "nm-aeolian",
  "harmonic-minor": "hm-harmonic",
  "melodic-minor": "mm-melodic",
  "pentatonic-major": "blues-maj-pent",
  "pentatonic-minor": "blues-min-pent",
  "pentatonic-blues": "blues-minor-blues",
  "pentatonic-neutral": "maj-ionian",
  diatonic: "maj-ionian",
  diminished: "maj-locrian",
  "diminished-half-whole": "mm-altered",
  "diminished-whole": "maj-locrian",
  "diminished-whole-tone": "hm-ultralocrian",
  "dominant-7th": "maj-mixolydian",
  "lydian-augmented": "mm-lydian-aug",
  "lydian-minor": "maj-lydian",
  "lydian-diminished": "hm-dorian-sharp4",
};

export function normalizeGamlarScaleId(id: string | null | undefined): string | null {
  if (id == null || id === "") return null;
  const mapped = LEGACY_SCALE_ID_ALIASES[id] ?? id;
  return byId.has(mapped) ? mapped : null;
}

export function gamlarScaleById(id: string | null | undefined): GamlarScaleCatalogEntry | undefined {
  if (!id) return undefined;
  const normalized = normalizeGamlarScaleId(id);
  if (!normalized) return undefined;
  return byId.get(normalized);
}

export function defaultGamlarScaleId(): string {
  return "maj-ionian";
}

export function gamlarModesForFamily(familyId: GamlarFamilyId): readonly GamlarScaleCatalogEntry[] {
  return GAMLAR_SCALE_CATALOG.filter((e) => e.category === familyId).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}
