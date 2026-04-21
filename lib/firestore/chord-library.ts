import admin from "firebase-admin";
import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serializeDoc } from "@/lib/firestore/serialize";
import { writeAuditLog } from "@/lib/security/audit-log";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { ChordShapeDoc } from "@/lib/types/chord-library";

const COLLECTION = "chord_library";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

/** Uncached read — admin API ve write sonrası taze değer gereken yerlerde kullan. */
export async function getAllChordShapes(): Promise<(ChordShapeDoc & { id: string })[]> {
  const snap = await db().collection(COLLECTION).get();
  return snap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as ChordShapeDoc) }))
    .sort((a, b) => {
      const rootCmp = a.root.localeCompare(b.root, "tr");
      if (rootCmp !== 0) return rootCmp;
      const qualityCmp = a.quality.localeCompare(b.quality, "tr");
      if (qualityCmp !== 0) return qualityCmp;
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
}

/** Public site (`/akor-kutuphanesi`) için ISR-cached varyant. Admin write'ları `TAGS.CHORD_LIBRARY` ile invalide eder. */
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
  input: Omit<ChordShapeDoc, "schemaVersion" | "createdAt" | "updatedAt">,
  actorUid: string,
): Promise<string> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const data: Record<string, unknown> = {
    ...input,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await db().collection(COLLECTION).add(data);
  await writeAuditLog(actorUid, "chord:create", COLLECTION, ref.id, { name: input.name });
  return ref.id;
}

export async function updateChordShape(
  id: string,
  updates: Partial<ChordShapeDoc>,
  actorUid: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db().collection(COLLECTION).doc(id).update({ ...updates, updatedAt: now });
  await writeAuditLog(actorUid, "chord:update", COLLECTION, id, updates as Record<string, unknown>);
}

export async function deleteChordShape(id: string, actorUid: string): Promise<void> {
  await db().collection(COLLECTION).doc(id).delete();
  await writeAuditLog(actorUid, "chord:delete", COLLECTION, id);
}
