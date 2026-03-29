import { Note, Scale } from "tonal";
import { defaultGamlarScaleId, gamlarScaleById } from "@/data/gamlar-scale-catalog";
import { OPEN_STRING_PC_TOP_FIRST, PC_TO_NAME } from "@/lib/music/note-utils";

/**
 * Fretboard SVG satır indeksi: 0 = üstteki tel (ince E), 5 = alttaki tel (kalın E).
 * `components/tools/fretboard.tsx` içindeki `sIdx` ile aynı.
 */
export type FretboardStringIndexTopFirst = 0 | 1 | 2 | 3 | 4 | 5;

export type FretboardNotePosition = {
  stringIndexTopFirst: number;
  /** 0 = nut (açık tel) */
  fret: number;
  pitchClass: number;
};

/** Mevcut fretboard etiketi: `6 - sIdx` (ince E satırı → "6") */
export function stringIndexToFretboardLabel(stringIndexTopFirst: number): number {
  return 6 - stringIndexTopFirst;
}

/**
 * Tonal `Scale.get(...).notes` gibi bir nota adı listesini pitch class kümesine çevirir.
 * `Fretboard` scale modu doğrudan bu küme ile perdeleri boyar.
 */
export function scaleNoteNamesToPitchClassSet(notes: readonly string[]): Set<number> {
  const out = new Set<number>();
  for (const name of notes) {
    const c = Note.chroma(name);
    if (typeof c === "number" && !Number.isNaN(c)) out.add(c);
  }
  return out;
}

/** `fretboard.tsx` içindeki `pitchClassAtFret` ile aynı matematik */
export function pitchClassAtStringFret(
  stringIndexTopFirst: number,
  fret: number,
  openStringPcs: readonly number[] = OPEN_STRING_PC_TOP_FIRST
): number {
  const open = openStringPcs[stringIndexTopFirst];
  if (open === undefined) return 0;
  return (open + fret) % 12;
}

/**
 * Verilen pitch class kümesi için 0…maxFret aralığında tüm (tel, perde) eşleşmeleri listeler.
 * Çiftler, ekranda gösterilen fretboard ızgarası ile birebir uyumludur.
 */
export function enumerateFretboardPositionsForPitchClasses(
  activePitchClasses: ReadonlySet<number>,
  options: { maxFret?: number; openStringPcs?: readonly number[] } = {}
): FretboardNotePosition[] {
  const maxFret = options.maxFret ?? 12;
  const openStringPcs = options.openStringPcs ?? OPEN_STRING_PC_TOP_FIRST;
  const out: FretboardNotePosition[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const pc = pitchClassAtStringFret(s, f, openStringPcs);
      if (activePitchClasses.has(pc)) {
        out.push({ stringIndexTopFirst: s, fret: f, pitchClass: pc });
      }
    }
  }
  return out;
}

/**
 * Gamlar kataloğu + tonal merkez (0–11) → mevcut `Fretboard` scale modunun boyadığı pitch class kümesi.
 */
export function gamlarCatalogAndTonicToPitchClassSet(
  tonicPitchClass: number,
  scaleCatalogId: string | null | undefined
): Set<number> {
  const entry = gamlarScaleById(scaleCatalogId) ?? gamlarScaleById(defaultGamlarScaleId());
  if (!entry) return new Set<number>();
  const tonic = PC_TO_NAME[((tonicPitchClass % 12) + 12) % 12] ?? "C";
  const sc = Scale.get([tonic, entry.tonalType]);
  if (!sc.notes?.length) return new Set<number>();
  return scaleNoteNamesToPitchClassSet(sc.notes);
}
