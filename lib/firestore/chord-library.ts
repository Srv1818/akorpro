import { unstable_cache } from "next/cache";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { toEpochMs } from "@/lib/directus/serialize";
import type { ChordShapeRow } from "@/lib/directus/schema";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { ChordShapeDoc } from "@/lib/types/chord-library";

/**
 * Akor kütüphanesi — Directus.
 *
 * Şema denetimi kararları (MIGRATION-PLAN.md Faz 1): `barre_fret` tutuldu;
 * `frets`, `barre_start`, `barre_end` atıldı — diyagram bunları `fingering`'den türetiyor.
 *
 * Denetim izi artık `lib/security/audit-log.ts` değil, Directus'un yerleşik
 * Activity Log + Revisions'ı. Yazma fonksiyonlarındaki `actorUid` parametresi
 * imza uyumu için duruyor; Faz 5'te admin route'ları kalkınca bu fonksiyonlar da silinecek.
 */

type ChordShape = ChordShapeDoc & { id: string };

type ChordShapeInput = Omit<ChordShapeDoc, "schemaVersion" | "createdAt" | "updatedAt">;

function mapChordShape(row: ChordShapeRow): ChordShape {
  return {
    id: row.id,
    name: row.name,
    root: row.root,
    quality: row.quality as ChordShapeDoc["quality"],
    fingering: row.fingering,
    ...(row.fingers ? { fingers: row.fingers } : {}),
    ...(row.barre_fret != null ? { barreFret: row.barre_fret } : {}),
    ...(row.sort_order != null ? { sortOrder: row.sort_order } : {}),
    createdAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

/** Directus alan adlarına çevir — yalnız verilen alanları gönderir. */
function toRow(input: Partial<ChordShapeDoc>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.root !== undefined) row.root = input.root;
  if (input.quality !== undefined) row.quality = input.quality;
  if (input.fingering !== undefined) row.fingering = input.fingering;
  if (input.fingers !== undefined) row.fingers = input.fingers;
  if (input.barreFret !== undefined) row.barre_fret = input.barreFret;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
}

/** Uncached read — admin API ve write sonrası taze değer gereken yerlerde kullan. */
export async function getAllChordShapes(): Promise<ChordShape[]> {
  const rows = await directus().request(readItems("chord_library", { limit: -1 }));

  return rows.map(mapChordShape).sort((a, b) => {
    const rootCmp = a.root.localeCompare(b.root, "tr");
    if (rootCmp !== 0) return rootCmp;
    const qualityCmp = a.quality.localeCompare(b.quality, "tr");
    if (qualityCmp !== 0) return qualityCmp;
    const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
}

/** Public site (`/akor-kutuphanesi`) için ISR-cached varyant. Write'lar `TAGS.CHORD_LIBRARY` ile invalide eder. */
export function getAllChordShapesCached() {
  return unstable_cache(
    getAllChordShapes,
    ["chord-library-all-v1"],
    {
      tags: [TAGS.CHORD_LIBRARY],
      revalidate: TTL.CHORD_LIBRARY,
    },
  )();
}

export async function createChordShape(
  input: ChordShapeInput,
  _actorUid: string,
): Promise<string> {
  const row = await directus().request(
    createItem("chord_library", toRow(input) as never),
  );
  return row.id;
}

export async function updateChordShape(
  id: string,
  updates: Partial<ChordShapeDoc>,
  _actorUid: string,
): Promise<void> {
  await directus().request(updateItem("chord_library", id, toRow(updates) as never));
}

export async function deleteChordShape(id: string, _actorUid: string): Promise<void> {
  await directus().request(deleteItem("chord_library", id));
}
