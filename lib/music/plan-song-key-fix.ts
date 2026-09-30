import type { KeyMode } from "../types/content";
import { normalizeGamlarScaleId } from "../../data/gamlar-scale-catalog";
import {
  gamlarScaleHasMinorThird,
  realignGamlarScaleIdToKeyMode,
  splitOriginalKey,
} from "./key-mode-gamlar";

export type SongKeyFields = {
  originalKey: string;
  keyMode?: KeyMode | null;
  gamlarScaleId?: string | null;
};

export type SongKeyFix = {
  /** Yalnız değişen alanlar; boşsa kayda dokunulmuyor. */
  changes: Partial<{ originalKey: string; keyMode: KeyMode; gamlarScaleId: string }>;
  /** Elle bakılması gereken durumlar; betik bunları düzeltmiyor. */
  warnings: string[];
};

/**
 * Tek seferlik veri düzeltmesinin kuralı (scripts/normalize-song-keys.ts).
 *
 * - Orijinal ton yalnız köke iner: "C#m" → "C#".
 * - Ton modu "Majör" ya da boşken minör kanıtı varsa "Doğal Minör" olur.
 *   Kanıt: tonda "m" eki ya da minör üçlülü gam (Aeolian, Phrygian, Dorian…).
 * - Harmonik/melodik/doğal minör seçilmişse ton moduna dokunulmuyor.
 * - Gam aynı notalarla yeni ailenin kimliğine taşınıyor (maj-aeolian →
 *   nm-aeolian). Ses değişmiyor; panelde "Doğal minör · Aeolian" görünüyor.
 */
export function planSongKeyFix(song: SongKeyFields): SongKeyFix {
  const changes: SongKeyFix["changes"] = {};
  const warnings: string[] = [];

  const { tonic, impliedMode } = splitOriginalKey(song.originalKey ?? "");
  if (tonic && tonic !== song.originalKey) changes.originalKey = tonic;

  const storedScale = song.gamlarScaleId ? normalizeGamlarScaleId(song.gamlarScaleId) : null;
  if (song.gamlarScaleId && !storedScale) {
    warnings.push(`gam kimliği katalogda yok: "${song.gamlarScaleId}"`);
  }
  const minorThird = storedScale ? gamlarScaleHasMinorThird(storedScale) : undefined;

  const mode = song.keyMode ?? undefined;
  const modeIsMajorOrEmpty = mode === undefined || mode === "major";
  let nextMode: KeyMode | undefined = mode;

  if (modeIsMajorOrEmpty) {
    if (impliedMode === "natural" && minorThird === false) {
      warnings.push(`tonda "m" var ama gam majör karakterli (${storedScale}); elle bak`);
    } else if (impliedMode === "natural" || minorThird === true) {
      nextMode = "natural";
    }
  } else if (minorThird === false) {
    warnings.push(`ton modu ${mode} ama gam majör karakterli (${storedScale}); bilinçli olabilir`);
  }

  if (nextMode !== mode && nextMode) changes.keyMode = nextMode;

  if (storedScale && nextMode !== mode) {
    const realigned = realignGamlarScaleIdToKeyMode(storedScale, nextMode);
    if (realigned && realigned !== storedScale) changes.gamlarScaleId = realigned;
  } else if (storedScale && storedScale !== song.gamlarScaleId) {
    // Kısayol yazımı ("phrygian") kanonik kimliğe.
    changes.gamlarScaleId = storedScale;
  }

  return { changes, warnings };
}
