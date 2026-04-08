import type { GamlarFamilyId } from "@/data/gamlar-scale-catalog";
import { gamlarScaleById, normalizeGamlarScaleId } from "@/data/gamlar-scale-catalog";
import type { KeyMode } from "@/lib/types/content";

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
