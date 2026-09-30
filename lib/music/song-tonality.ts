import { Scale } from "tonal";
import { gamlarScaleById } from "../../data/gamlar-scale-catalog";
import type { KeyMode } from "../types/content";
import { resolveSongGamlarScaleId } from "./key-mode-gamlar";
import { parseTonicFromOriginalKey } from "./transpose";

export type SongTonality = {
  tonic: string;
  /** "C# Doğal Minör" gibi; meta açıklaması ve başlık satırı bunu kullanıyor. */
  label: string;
  /** Yalnız nitelik: "Doğal Minör", "Majör"… */
  quality: string;
  isMinor: boolean;
  scaleName: string;
  scaleNotes: string[];
  /**
   * Gam tonun kendi gamı mı (doğal minörde Aeolian, majörde Ionian…)?
   * Öyleyse metinde ikinci kez adı geçmiyor: "G# Doğal Minör tonunda,
   * solo için G# Aeolian" aynı şeyi iki kez söylüyordu.
   */
  scaleIsKeyScale: boolean;
  /** Gam zaten pentatonik/blues ise ya da hesaplanamazsa yok. */
  pentatonic?: { name: string; notes: string[] };
};

/** Nitelik → o tonun kendi gamının tonal adı. */
const KEY_SCALE_TYPE: Record<string, string> = {
  Majör: "ionian",
  "Doğal Minör": "aeolian",
  "Harmonik Minör": "harmonic minor",
  "Melodik Minör": "melodic minor",
};

const EXPLICIT_MINOR_LABELS: Partial<Record<KeyMode, string>> = {
  natural: "Doğal Minör",
  harmonic: "Harmonik Minör",
  melodic: "Melodik Minör",
};

/**
 * Şarkının tonunu gamdan türetir.
 *
 * Kayıtların çoğu `keyMode: "major"` + `maj-aeolian` biçiminde: "major"
 * burada gamın ait olduğu aileyi söylüyor, şarkının majör olduğunu değil.
 * C# üzerinde Aeolian = C# minör. Eskiden etiket yalnız `keyMode`'a
 * bakıyordu ve bu şarkılar "C# Majör" diye yayınlanıyordu (2026-09-29'da
 * .com.tr'de 105 şarkının 75'i). Artık üçlü aralığa bakıyoruz.
 */
export function songTonality(
  originalKey: string,
  keyMode: KeyMode | undefined,
  storedScaleId: string | undefined,
): SongTonality | null {
  const tonic = parseTonicFromOriginalKey(originalKey);
  const entry = gamlarScaleById(resolveSongGamlarScaleId(keyMode, storedScaleId));
  if (!tonic || !entry) return null;

  const scale = Scale.get([tonic, entry.tonalType]);
  if (scale.empty || !scale.notes.length) return null;

  const isMinor = scale.intervals.includes("3m");
  const quality =
    (keyMode && EXPLICIT_MINOR_LABELS[keyMode]) ??
    (isMinor ? (entry.tonalType === "aeolian" ? "Doğal Minör" : "Minör") : "Majör");

  const isPentatonicAlready = entry.category === "blues";
  const pentaType = isMinor ? "minor pentatonic" : "major pentatonic";
  const penta = isPentatonicAlready ? null : Scale.get([tonic, pentaType]);

  return {
    tonic,
    label: `${tonic} ${quality}`,
    quality,
    isMinor,
    scaleName: entry.name,
    scaleNotes: scale.notes,
    scaleIsKeyScale: KEY_SCALE_TYPE[quality] === entry.tonalType,
    ...(penta && !penta.empty
      ? {
          pentatonic: {
            name: isMinor ? "Minör Pentatonik" : "Majör Pentatonik",
            notes: penta.notes,
          },
        }
      : {}),
  };
}
