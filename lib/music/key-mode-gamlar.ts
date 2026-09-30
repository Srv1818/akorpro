import { Scale } from "tonal";
import type { GamlarFamilyId } from "../../data/gamlar-scale-catalog";
import {
  GAMLAR_FAMILY_LABELS,
  GAMLAR_FAMILY_ORDER,
  gamlarModesForFamily,
  gamlarScaleById,
  normalizeGamlarScaleId,
} from "../../data/gamlar-scale-catalog";
import type { KeyMode } from "../types/content";

/** Orijinal ton metninden (ör. Am, Em) ton modu tahmini — API ve geriye dönük uyumluluk. */
export function inferKeyModeFromOriginalKey(originalKey: string): KeyMode {
  const k = originalKey.trim().toLowerCase();
  if (k.endsWith("maj")) return "major";
  if (k.endsWith("m")) return "natural";
  return "major";
}

/** `keyMode` → gamlar kataloğu aile kimliği (blues hariç). */
export function keyModeToGamlarFamily(mode: KeyMode | undefined): GamlarFamilyId {
  if (mode === "harmonic") return "harmonic-minor";
  if (mode === "melodic") return "melodic-minor";
  if (mode === "natural") return "natural-minor";
  return "major";
}

/** Şarkı `keyMode` → gamlar kataloğu kimliği (varsayılan alt mod). */
export function keyModeToGamlarCatalogScaleId(mode: KeyMode | undefined): string {
  if (mode === "harmonic") return "hm-harmonic";
  if (mode === "melodic") return "mm-melodic";
  if (mode === "natural") return "nm-aeolian";
  return "maj-ionian";
}

/**
 * Kayıtlı `gamlarScaleId` geçerliyse onu önceliklendirir;
 * geçersizse `keyMode` için varsayılan katalog kimliğini döndürür.
 */
export function resolveSongGamlarScaleId(
  keyMode: KeyMode | undefined,
  storedScaleId: string | undefined,
): string {
  const fallback = keyModeToGamlarCatalogScaleId(keyMode);
  const raw = typeof storedScaleId === "string" ? storedScaleId.trim() : "";
  if (!raw) return fallback;
  const normalized = normalizeGamlarScaleId(raw);
  return normalized ?? fallback;
}

/** API: gövdeden gelen metni doğrular; geçersiz veya aile uyumsuzsa `undefined` (varsayılan yazılır). */
export function normalizeGamlarScaleIdForKeyMode(
  raw: string | undefined,
  keyMode: KeyMode,
): string | undefined {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return undefined;
  const normalized = normalizeGamlarScaleId(s);
  if (!normalized) return undefined;
  const entry = gamlarScaleById(normalized);
  if (!entry || entry.category !== keyModeToGamlarFamily(keyMode)) return undefined;
  return normalized;
}

/**
 * Panelde "Gam kimliği" açılır listesini dolduran seçenekler.
 *
 * Yalnız seçili ton modunun ailesindeki modlar dönüyor: liste kısalıyor ve
 * `normalizeGamlarScaleIdForKeyMode` ile aynı kuralı paylaştığı için panelden
 * aile uyumsuz bir değer seçmek mümkün olmuyor.
 */
export function gamlarScaleOptionsForKeyMode(
  mode: KeyMode | undefined,
): { label: string; value: string }[] {
  return gamlarModesForFamily(keyModeToGamlarFamily(mode)).map((e) => ({
    label: e.name,
    value: e.id,
  }));
}

/** Ton modu boş bırakıldığında panelde gösterilecek varsayılan modun adı. */
export function defaultGamlarScaleLabelForKeyMode(mode: KeyMode | undefined): string {
  const id = keyModeToGamlarCatalogScaleId(mode);
  return gamlarScaleById(id)?.name ?? id;
}

/**
 * Yazma anında aile uyumunu onarır.
 *
 * `tonalType` aileler arasında ortak: `maj-phrygian` ile `nm-phrygian` aynı
 * gamın iki perspektifi. Ton modu değişince kaydı reddetmek yerine karşılığına
 * çeviriyoruz. Harmonik/melodik ailelerde karşılık yoksa `undefined` döner ve
 * çağıran taraf varsayılana düşer.
 */
export function realignGamlarScaleIdToKeyMode(
  raw: string | undefined,
  keyMode: KeyMode | undefined,
): string | undefined {
  const normalized = normalizeGamlarScaleId(typeof raw === "string" ? raw.trim() : "");
  if (!normalized) return undefined;
  const entry = gamlarScaleById(normalized);
  if (!entry) return undefined;
  const family = keyModeToGamlarFamily(keyMode);
  if (entry.category === family) return normalized;
  return gamlarModesForFamily(family).find((e) => e.tonalType === entry.tonalType)?.id;
}

/*
 * Üç alanın görevi (2026-09-30'da netleşti):
 * - Orijinal ton: yalnız kök nota ("C#"). Majör/minör bilgisi burada tutulmuyor.
 * - Ton modu: şarkının gerçek tonu. Filtre ve etiketler buradan besleniyor.
 * - Gam kimliği: solo gamı, ton modundan bağımsız seçim.
 *
 * Eskiden ton modu gam listesini aileye göre daraltıyordu. Aeolian'ı almak
 * için "Majör" seçilen 75 şarkı sitede "C# Majör" diye yayınlandı ve mod
 * filtresinde majör altında listelendi.
 */

/** "C#m" → { tonic: "C#", impliedMode: "natural" }. Ek yoksa `impliedMode` yok. */
export function splitOriginalKey(raw: string): { tonic: string; impliedMode?: KeyMode } {
  const k = raw.trim();
  if (/maj$/i.test(k)) return { tonic: k.slice(0, -3).trim(), impliedMode: "major" };
  if (k.length > 1 && /m$/.test(k)) return { tonic: k.slice(0, -1).trim(), impliedMode: "natural" };
  return { tonic: k };
}

/** Paneldeki gam listesi: bütün aileler, aile adı önekli. */
export function gamlarScaleOptionsAll(): { label: string; value: string }[] {
  return GAMLAR_FAMILY_ORDER.flatMap((family) =>
    gamlarModesForFamily(family).map((e) => ({
      label: `${GAMLAR_FAMILY_LABELS[family].shortTab} · ${e.name}`,
      value: e.id,
    })),
  );
}

/** Gamın köke göre üçlüsü minör mü? Gam bilinmiyorsa `undefined`. */
export function gamlarScaleHasMinorThird(scaleId: string | undefined): boolean | undefined {
  const entry = gamlarScaleById(scaleId);
  if (!entry) return undefined;
  const { intervals } = Scale.get(["C", entry.tonalType]);
  if (intervals.includes("3m")) return true;
  if (intervals.includes("3M")) return false;
  return undefined;
}

/**
 * Ton modu ile gam karakteri çelişiyorsa panelde gösterilecek uyarı.
 * Reddetmiyoruz: harmonik minör şarkıda V üzerine Phrygian Dominant gibi
 * bilinçli seçimler var.
 */
export function keyModeScaleMismatch(
  keyMode: KeyMode | undefined,
  scaleId: string | undefined,
): string | null {
  const minorThird = gamlarScaleHasMinorThird(scaleId);
  if (minorThird === undefined) return null;
  const songIsMinor = keyMode !== undefined && keyMode !== "major";
  if (minorThird && !songIsMinor) {
    return "Seçilen gam minör karakterli ama ton modu Majör. Şarkı minörse ton modunu düzelt.";
  }
  if (!minorThird && songIsMinor) {
    return "Seçilen gam majör karakterli ama ton modu minör. Bilinçli bir seçim değilse kontrol et.";
  }
  return null;
}
