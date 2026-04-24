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
  /** Gamın karakterini, kullanım alanlarını ve müzikteki yerini açıklayan metin */
  description?: string;
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
    description:
      "Batı müziğinin temel yapı taşı. Neşeli ve parlak karakteriyle pop, rock ve folk müziğinde en sık kullanılan gamdır. Gitarda Do majör, sol majör gibi açık akor pozisyonları bu gamın doğal konumlarıdır. Şarkı yazarlığında 'güvenli liman' olarak bilinir; çoğu kulağa tanıdık gelen ezgi bu gamdan türer.",
  },
  {
    id: "maj-dorian",
    name: "Dorian",
    tonalType: "dorian",
    subtitle: "Formül: 1 - 2 - b3 - 4 - 5 - 6 - b7",
    formula: "1 - 2 - b3 - 4 - 5 - 6 - b7",
    triadsExample: "Cm — Dm — Eb — F — Gm — Adim — Bb",
    seventhsExample: "Cm7 — Dm7 — Ebmaj7 — F7 — Gm7 — Am7b5 — Bbmaj7",
    description:
      "Minör karakterli olmakla birlikte parlak 6. derecesi sayesinde enerjik ve umut dolu bir his verir. Santana ve Carlos Jobim gibi isimlerin sıkça başvurduğu bu mod; rock, funk ve Latin müziğinde im ve vi minör akorları üzerinde çok etkilidir. Doğal minörden tek farkı yükseltilmiş 6. derecesidir.",
  },
  {
    id: "maj-phrygian",
    name: "Phrygian",
    tonalType: "phrygian",
    subtitle: "Formül: 1 - b2 - b3 - 4 - 5 - b6 - b7",
    formula: "1 - b2 - b3 - 4 - 5 - b6 - b7",
    triadsExample: "Cm — Db — Eb — Fm — Gdim — Ab — Bbm",
    seventhsExample: "Cm7 — Dbmaj7 — Eb7 — Fm7 — Gm7b5 — Abmaj7 — Bbm7",
    description:
      "Koyu, gizemli ve egzotik karakteriyle flamenco ile metal müziğinin vazgeçilmez modudur. b2 derecesi, İspanyol müziğine özgü o gerilimli tınıyı yaratır. Metallica, Megadeth ve Sepultura gibi grupların ağır rifflerinde sıkça karşılaşılır. Mi minör pozisyonunda gitarda çok doğal bir duruş sergiler.",
  },
  {
    id: "maj-lydian",
    name: "Lydian",
    tonalType: "lydian",
    subtitle: "Formül: 1 - 2 - 3 - #4 - 5 - 6 - 7",
    formula: "1 - 2 - 3 - #4 - 5 - 6 - 7",
    triadsExample: "C — D — Em — F#dim — G — Am — Bm",
    seventhsExample: "Cmaj7 — D7 — Em7 — F#m7b5 — Gmaj7 — Am7 — Bm7",
    description:
      "#4 derecesi sayesinde parlak, uçuşkan ve rüyamsı bir karakter taşır. Film müziği bestecilerinin ve caz gitarcılarının sevdiği bu mod; majör tonun en aydınlık halidir. Joe Satriani'nin 'Flying in a Blue Dream' parçası Lydian modun nasıl kullanılacağının en iyi örneğidir. IV. derece majör akor yerine II. derece majör akor karakteristik harekettir.",
  },
  {
    id: "maj-mixolydian",
    name: "Mixolydian",
    tonalType: "mixolydian",
    subtitle: "Formül: 1 - 2 - 3 - 4 - 5 - 6 - b7",
    formula: "1 - 2 - 3 - 4 - 5 - 6 - b7",
    triadsExample: "C — Dm — Edim — F — Gm — Am — Bb",
    seventhsExample: "C7 — Dm7 — Em7b5 — Fmaj7 — Gm7 — Am7 — Bbmaj7",
    description:
      "Majör gamdan tek farkı b7 derecesidir; bu küçük fark bluesy ve rock bir his katar. Dominant 7 akorları (G7, A7, D7) üzerinde çalmak için doğal tercih budur. Blues-rock, country, Celtic ve funk müziğinin temel gamlarından biridir. 'Sweet Home Alabama' ve 'La Grange' gibi klasiklerin akor yapısı Mixolydian mantığı taşır.",
  },
  {
    id: "maj-aeolian",
    name: "Aeolian (Natural Minor)",
    tonalType: "aeolian",
    subtitle: "Formül: 1 - 2 - b3 - 4 - 5 - b6 - b7",
    formula: "1 - 2 - b3 - 4 - 5 - b6 - b7",
    triadsExample: "Cm — Ddim — Eb — Fm — Gm — Ab — Bb",
    seventhsExample: "Cm7 — Dm7b5 — Ebmaj7 — Fm7 — Gm7 — Abmaj7 — Bb7",
    description:
      "Doğal minör olarak da bilinen bu mod, melankoli, hüzün ve derinlik verir. La minör ve Mi minör pozisyonlarında gitarda boş telleri kullanarak çok pratik yerleşimler sunar. Türk pop, rock ve arabesk müziğinin de sıkça başvurduğu bu gam, evrensel bir duygusallık dili taşır. Majör gamla aynı notaları paylaşır; yalnızca başlangıç noktası farklıdır.",
  },
  {
    id: "maj-locrian",
    name: "Locrian",
    tonalType: "locrian",
    subtitle: "Formül: 1 - b2 - b3 - 4 - b5 - b6 - b7",
    formula: "1 - b2 - b3 - 4 - b5 - b6 - b7",
    triadsExample: "Cdim — Db — Ebm — Fm — Gb — Ab — Bbm",
    seventhsExample: "Cm7b5 — Dbmaj7 — Ebm7 — Fm7 — Gbmaj7 — Ab7 — Bbm7",
    description:
      "Yedi modun en karanlık ve en az kullanılanı. b2 ve b5 dereceleri birlikte gamı oldukça istikrarsız kılar; bu yüzden melodik merkez olarak nadiren kullanılır. Caz müziğinde yarım azalmış (m7b5) akorlar üzerinde kısa geçişlerde görülür. İleri düzey armoni çalışmalarında teorik referans olarak önemlidir.",
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

const NM_DESCRIPTIONS: Partial<Record<string, string>> = {
  "nm-aeolian":
    "Doğal minör perspektifin merkezindeki Aeolian modudur; yani standart doğal minör gam. Majör ailedeki Aeolian ile aynı notaları paylaşır; fark yalnızca odak noktasındadır. Minör tonaliteye hakim olmak için başlangıç noktasıdır.",
  "nm-dorian":
    "Doğal minör ailesinin Dorian perspektifi. Minör karakterini korurken parlak 6. derece sayesinde daha umut dolu bir his verir. ii. derece minör akor (örneğin Am üzerinde Bm7) üzerinde canlı bir renk sunar.",
  "nm-phrygian":
    "Doğal minör ailesinin Phrygian perspektifi. b2 derecesi flamenko ve metal karakterini kazandırır. iii. derece minör üzerinde egzotik bir renk için kullanılır.",
  "nm-lydian":
    "Doğal minör ailesinin Lydian perspektifi. iv. derece majör akor yerine II. derece majör akor ortaya çıkar; bu da #4 derecesinin parlak Lydian rengini minör bağlamına taşır.",
  "nm-mixolydian":
    "Doğal minör ailesinin Mixolydian perspektifi. v. derece üzerinde b7 ile dominant 7 akor oluşur. Bluesy bir minör rengi arayanlar için ilginç bir bakış açısıdır.",
  "nm-ionian":
    "Doğal minör ailesinin Ionian (majör) perspektifi. iii. derece üzerindeki paralel majör gam; minör tonun bağıl majörüne geçişte kullanılan köprüdür.",
  "nm-locrian":
    "Doğal minör ailesinin Locrian perspektifi. vii. derece üzerinde en karanlık rengi üretir; dim akorlar üzerindeki kısa geçişler için teorik referans noktasıdır.",
};

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
      description: NM_DESCRIPTIONS[id],
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
    description:
      "Doğal minörden tek farkı yükseltilmiş 7. derecesidir; bu değişiklik gamı dramatik biçimde farklılaştırır. b6 ile 7 arasındaki artık ikili aralık, Orta Doğu, flamenko ve neo-klasik müziğinin karakteristik egzotik tınısını verir. Harmonik minördeki V. derece dominant 7 akoruna (G7) dönüşür; bu da minör tona güçlü bir çözüm hareketi sağlar.",
  },
  {
    id: "hm-locrian6",
    name: "Locrian ♮6",
    tonalType: "locrian 6",
    subtitle: "Formül: 1 - b2 - b3 - 4 - b5 - 6 - b7",
    formula: "1 - b2 - b3 - 4 - b5 - 6 - b7",
    triadsExample: "Cdim — Db+ — Ebm — F — Gb — Adim — Bbm",
    seventhsExample: "Cm7b5 — Dbmaj7#5 — Ebm7 — F7 — Gbmaj7 — Adim7 — BbmM7",
    description:
      "Harmonik minör ailesinin 2. modu. Locrian'ın doğal 6. derece ile hafifletilmiş hali; m7b5 akorları üzerinde gerilimli renk geçişleri için kullanılır. İleri caz armonisinde karşılaşılan nadir bir moddur.",
  },
  {
    id: "hm-ionian-aug",
    name: "Ionian Augmented (Ionian #5)",
    tonalType: "major augmented",
    subtitle: "Formül: 1 - 2 - 3 - 4 - #5 - 6 - 7",
    formula: "1 - 2 - 3 - 4 - #5 - 6 - 7",
    triadsExample: "C+ — Dm — E — F — G#dim — Am — Bdim",
    seventhsExample: "Cmaj7#5 — Dm7 — E7 — Fmaj7 — G#dim7 — AmM7 — Bm7b5",
    description:
      "Harmonik minör ailesinin 3. modu; majör gamın artık (augmented) 5. derece ile değiştirilmiş hali. maj7#5 akorları üzerinde gergin ve tuhaf bir renk katar. Neo-klasik ve sinematik müzikte özel efekt için kullanılır.",
  },
  {
    id: "hm-dorian-sharp4",
    name: "Dorian #4 (Ukrainian Dorian)",
    tonalType: "dorian #4",
    subtitle: "Formül: 1 - 2 - b3 - #4 - 5 - 6 - b7",
    formula: "1 - 2 - b3 - #4 - 5 - 6 - b7",
    triadsExample: "Cm — D — Eb — F#dim — Gm — Adim — Bb+",
    seventhsExample: "Cm7 — D7 — Ebmaj7 — F#dim7 — GmM7 — Am7b5 — Bbmaj7#5",
    description:
      "Ukrayna ve Doğu Avrupa halk müziğinde sıkça karşılaşılan bu mod, Dorian'a #4 eklenerek elde edilir. Dorian'ın enerjisini taşırken egzotik bir renk katar. Yahudi klezmer müziğinin de karakteristik gamlarından biridir.",
  },
  {
    id: "hm-phrygian-dom",
    name: "Phrygian Dominant",
    tonalType: "phrygian dominant",
    subtitle: "Formül: 1 - b2 - 3 - 4 - 5 - b6 - b7",
    formula: "1 - b2 - 3 - 4 - 5 - b6 - b7",
    triadsExample: "C — Db — Edim — Fm — Gdim — Ab+ — Bbm",
    seventhsExample: "C7 — Dbmaj7 — Edim7 — FmM7 — Gm7b5 — Abmaj7#5 — Bbm7",
    description:
      "Türk ve Orta Doğu müziğinin en karakteristik gamlarından biri. Majör 3. derece ile b2 derecesinin bir arada bulunması, o tanıdık egzotik ve dramatik tınıyı üretir. Flamenco gitarında dominant akor üzerinde çalarken, Türkçe pop ve arabesk repertuarında ise minör tondaki köprülerde ve geçişlerde sıkça kullanılır.",
  },
  {
    id: "hm-lydian-sharp2",
    name: "Lydian #2",
    tonalType: "lydian #9",
    subtitle: "Formül: 1 - #2 - 3 - #4 - 5 - 6 - 7",
    formula: "1 - #2 - 3 - #4 - 5 - 6 - 7",
    triadsExample: "C — D#dim — Em — F#dim — G+ — Am — B",
    seventhsExample: "Cmaj7 — D#dim7 — EmM7 — F#m7b5 — Gmaj7#5 — Am7 — B7",
    description:
      "Harmonik minör ailesinin 6. modu; hem #2 hem de #4 derecesi taşıdığı için oldukça keskin ve egzotik bir renk verir. Sinematik ve neo-klasik müzikte büyük akor üzerinde gerilim yaratmak için kullanılır.",
  },
  {
    id: "hm-ultralocrian",
    name: "Super Locrian bb7 (Altered Diminished)",
    tonalType: "ultralocrian",
    subtitle: "Formül: 1 - b2 - b3 - b4 - b5 - b6 - bb7",
    formula: "1 - b2 - b3 - b4 - b5 - b6 - bb7",
    triadsExample: "Cdim — Dbm — Ebdim — E+ — Gbm — Ab — A",
    seventhsExample: "Cdim7 — DbmM7 — Ebm7b5 — Emaj7#5 — Gbm7 — Ab7 — Amaj7",
    description:
      "Harmonik minör ailesinin en karanlık ve karmaşık modu. Azalmış yedinci derece dahil hemen her aralık düşürülmüştür. Pratikte dim7 akorları üzerinde geçici bir renk olarak kullanılır; teorik analiz için referans değeri taşır.",
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
    description:
      "Caz armonisinin temel gamlarından biri. Doğal minörden yalnızca 6. ve 7. derecelerin yükseltilmesiyle elde edilir; bu sayede hem minör hissi hem de majöre benzer çıkış hareketi sağlanır. Caz gitarında minör maj7 akorları üzerinde akıcı solo fikirleri üretmek için kullanılır.",
  },
  {
    id: "mm-dorian-b2",
    name: "Dorian b2",
    tonalType: "dorian b2",
    subtitle: "Formül: 1 - b2 - b3 - 4 - 5 - 6 - b7",
    formula: "1 - b2 - b3 - 4 - 5 - 6 - b7",
    triadsExample: "Cm — Db+ — Eb — F — Gdim — Adim — Bbm",
    seventhsExample: "Cm7 — Dbmaj7#5 — Eb7 — F7 — Gm7b5 — Am7b5 — BbmM7",
    description:
      "Melodik minörün 2. modu; Phrygian'ın doğal 6. derece ile yumuşatılmış hali. Caz'da sus (sus4) akorları ve 7b9 akorları üzerinde gerilimli renk geçişleri için tercih edilir.",
  },
  {
    id: "mm-lydian-aug",
    name: "Lydian Augmented (Lydian #5)",
    tonalType: "lydian augmented",
    subtitle: "Formül: 1 - 2 - 3 - #4 - #5 - 6 - 7",
    formula: "1 - 2 - 3 - #4 - #5 - 6 - 7",
    triadsExample: "C+ — D — E — F#dim — G#dim — Am — Bm",
    seventhsExample: "Cmaj7#5 — D7 — E7 — F#m7b5 — G#m7b5 — AmM7 — Bm7",
    description:
      "Lydian'ın artık beşinci derece ile birleşimi; parlak Lydian rengine yüzen ve kararsız bir his katar. maj7#5 akorları üzerinde sinematik ve rüyamsı solo için kullanılır. John Coltrane ve Wayne Shorter'ın bestelerinde izlerine rastlanır.",
  },
  {
    id: "mm-lydian-dom",
    name: "Lydian Dominant (Lydian b7)",
    tonalType: "lydian dominant",
    subtitle: "Formül: 1 - 2 - 3 - #4 - 5 - 6 - b7",
    formula: "1 - 2 - 3 - #4 - 5 - 6 - b7",
    triadsExample: "C — D — Edim — F#dim — Gm — Am — Bb+",
    seventhsExample: "C7 — D7 — Em7b5 — F#m7b5 — GmM7 — Am7 — Bbmaj7#5",
    description:
      "Caz gitarının en sık başvurduğu renkli gamlardan biri. Lydian'ın parlaklığını Mixolydian'ın bluesy b7'siyle birleştirir. Dominant 7 akorları (#11 ile işaretlenenler) üzerinde uçuşkan ve gerilimli solo fikirler üretmek için mükemmeldir.",
  },
  {
    id: "mm-mixolydian-b6",
    name: "Mixolydian b6 (Melodic Major)",
    tonalType: "mixolydian b6",
    subtitle: "Formül: 1 - 2 - 3 - 4 - 5 - b6 - b7",
    formula: "1 - 2 - 3 - 4 - 5 - b6 - b7",
    triadsExample: "C — Ddim — Edim — Fm — Gm — Ab+ — Bb",
    seventhsExample: "C7 — Dm7b5 — Em7b5 — FmM7 — Gm7 — Abmaj7#5 — Bb7",
    description:
      "Majör gamın b6 ve b7 ile birleşimi; hem majör hem de minör renkleri aynı anda taşır. Dominant 7 akorları üzerinde Hindustan ve Flamenco müziğinde de karşılaşılan bu gam, egzotik bir dominant rengi arayanlar için ilginç bir seçenektir.",
  },
  {
    id: "mm-locrian-nat2",
    name: "Locrian ♮2",
    tonalType: "locrian #2",
    subtitle: "Formül: 1 - 2 - b3 - 4 - b5 - b6 - b7",
    formula: "1 - 2 - b3 - 4 - b5 - b6 - b7",
    triadsExample: "Cdim — Ddim — Ebm — Fm — Gb+ — Ab — Bb",
    seventhsExample: "Cm7b5 — Dm7b5 — EbmM7 — Fm7 — Gbmaj7#5 — Ab7 — Bb7",
    description:
      "Locrian modun doğal 2. derece ile hafifletilmiş versiyonu. m7b5 (yarım azalmış) akorları üzerinde Locrian'dan biraz daha akıcı ve az gerilimli bir seçenek sunar. Caz'da ii-V-i geçişlerinde yarım azalmış akor üzerinde tercih edilir.",
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
    description:
      "Caz gitarının en güçlü silahlarından biri. Dominant 7 akorları üzerinde maksimum gerilim yaratır; b9, #9, b5 ve #5 tüm altere dereceler bir arada bulunur. ii-V-i geçişinin V7 akorunda kullanıldığında çarpıcı bir çözüm hareketi elde edilir. Miles Davis ve John Coltrane çevresinin vazgeçilmez rengidir.",
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
    description:
      "Gitar soloculuğunun dünya genelinde en çok öğrenilen başlangıç gamı. Yalnızca 5 nota içerir ve bu notalar hemen hemen her müzikal bağlamda 'yanlış' hissettirmez. Rock, blues, R&B ve pop solocularının temel silahıdır. La minör pozisyonunda (5. perde) çalmak, gitarda en pratik ve doğal konuma karşılık gelir.",
  },
  {
    id: "blues-maj-pent",
    name: "Major Pentatonic (Majör Pentatonik)",
    tonalType: "major pentatonic",
    subtitle: "Country, Soul ve neşeli Pop melodilerinin temeli.",
    formula: "1 - 2 - 3 - 5 - 6 (5 nota)",
    triadsExample: "C, C6, Cmaj7",
    description:
      "Minör pentatoniğin neşeli kardeşi. Country, gospel, soul ve pop melodilerinin temelini oluşturur. Majör tonalitede çalarken 'doğru' hissettiren notaları içerir; parmak pozisyonları minör pentatonikle çok benzerdir, sadece başlangıç noktası farklıdır. 'Sweet Home Alabama' gibi klasik riflerin melodisi bu gamdan gelir.",
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
    description:
      "Minör pentatoniğe 'blue note' (b5) eklenmiş altı notalu gam. O karakteristik kirli, hüzünlü ve tutkulu blues tınısının sırrı bu ekstra notadadır. SRV, BB King ve Jimi Hendrix'in ikonik soloları bu gamın üzerine inşa edilmiştir. Dominant 7 akorları üzerinde minör blues gamı çalmak, blues armonisinin en büyük paradoksal zevkini sunar.",
  },
  {
    id: "blues-major-blues",
    name: "Major Blues Scale (Majör Blues Gamı)",
    tonalType: "major blues",
    subtitle:
      "Majör pentatoniğin içine minör 3'lü (b3) eklenmiş halidir. Country-Blues ve Rockabilly hissiyatı verir.",
    formula: "1 - 2 - b3 - 3 - 5 - 6 (6 nota)",
    triadsExample: "C, C7",
    description:
      "Majör pentatoniğe geçici b3 (blue note) eklenmiş hali. Country-blues, rockabilly ve southern rock'ın o hafif kirli ama neşeli karakterini verir. Majör tonalitede dominant 7 akorları üzerinde çalarken hem parlak hem de blues rengini aynı anda yakalar. Chuck Berry ve Elvis Presley repertuarının temel yapı taşıdır.",
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
