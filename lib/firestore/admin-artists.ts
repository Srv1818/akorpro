import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/security/audit-log";
import type { ArtistDoc } from "@/lib/types/firestore";

const COLLECTION = "artists";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

type ArtistInput = Omit<ArtistDoc, "schemaVersion" | "createdAt" | "updatedAt">;

export async function createArtist(input: ArtistInput, actorUid: string): Promise<string> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const data: Record<string, unknown> = {
    ...input,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db().collection(COLLECTION).add(data);
  await writeAuditLog(actorUid, "artist:create", COLLECTION, ref.id, { name: input.name });
  return ref.id;
}

export async function updateArtist(
  artistId: string,
  updates: Partial<ArtistInput>,
  actorUid: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db().collection(COLLECTION).doc(artistId).update({ ...updates, updatedAt: now });
  await writeAuditLog(actorUid, "artist:update", COLLECTION, artistId, updates as Record<string, unknown>);
}

export async function deleteArtist(artistId: string, actorUid: string): Promise<void> {
  await db().collection(COLLECTION).doc(artistId).delete();
  await writeAuditLog(actorUid, "artist:delete", COLLECTION, artistId);
}

export async function getAllArtistsAdmin(): Promise<(ArtistDoc & { id: string })[]> {
  const snap = await db().collection(COLLECTION).orderBy("name").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ArtistDoc) }));
}

export async function getAllArtistsCount(): Promise<number> {
  const snap = await db().collection(COLLECTION).count().get();
  return snap.data().count;
}
