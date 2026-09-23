import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/client";
import { toEpochMs } from "@/lib/payload/serialize";
import type { ChordLibrary as ChordShapeRow } from "@/payload-types";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { ChordShapeDoc } from "@/lib/types/chord-library";

/**
 * Akor kütüphanesi — Payload Local API.
 *
 * Şema kararları korundu: `barreFret` var; `frets`, `barreStart`, `barreEnd`
 * yok — diyagram bunları `fingering`'den türetiyor.
 *
 * Denetim izi Payload'ın yerleşik sürüm geçmişinde. Yazma fonksiyonlarındaki
 * `actorUid` parametresi imza uyumu için duruyor.
 */

type ChordShape = ChordShapeDoc & { id: string };

type ChordShapeInput = Omit<ChordShapeDoc, "schemaVersion" | "createdAt" | "updatedAt">;

function mapChordShape(row: ChordShapeRow): ChordShape {
  return {
    id: String(row.id),
    name: row.name,
    root: row.root,
    quality: row.quality as ChordShapeDoc["quality"],
    fingering: row.fingering,
    ...(row.fingers ? { fingers: row.fingers } : {}),
    ...(row.barreFret != null ? { barreFret: row.barreFret } : {}),
    ...(row.sortOrder != null ? { sortOrder: row.sortOrder } : {}),
    createdAt: toEpochMs(row.createdAt),
    updatedAt: toEpochMs(row.updatedAt),
  } as ChordShape;
}

/** Yalnız verilen alanları gönderir — kısmi güncellemede diğerleri korunur. */
function toRow(input: Partial<ChordShapeDoc>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.root !== undefined) row.root = input.root;
  if (input.quality !== undefined) row.quality = input.quality;
  if (input.fingering !== undefined) row.fingering = input.fingering;
  if (input.fingers !== undefined) row.fingers = input.fingers;
  if (input.barreFret !== undefined) row.barreFret = input.barreFret;
  if (input.sortOrder !== undefined) row.sortOrder = input.sortOrder;
  return row;
}

/** Uncached read — write sonrası taze değer gereken yerlerde kullan. */
export async function getAllChordShapes(): Promise<ChordShape[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "chord-library",
    limit: 0,
    depth: 0,
  });

  return docs.map(mapChordShape).sort((a, b) => {
    const rootCmp = a.root.localeCompare(b.root, "tr");
    if (rootCmp !== 0) return rootCmp;
    const qualityCmp = a.quality.localeCompare(b.quality, "tr");
    if (qualityCmp !== 0) return qualityCmp;
    const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
}

/** Public site (`/akor-kutuphanesi`) için ISR-cached varyant. */
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
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "chord-library",
    data: toRow(input) as never,
  });
  return String(doc.id);
}

export async function updateChordShape(
  id: string,
  updates: Partial<ChordShapeDoc>,
  _actorUid: string,
): Promise<void> {
  const payload = await getPayloadClient();
  await payload.update({
    collection: "chord-library",
    id,
    data: toRow(updates) as never,
  });
}

export async function deleteChordShape(id: string, _actorUid: string): Promise<void> {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "chord-library", id });
}
