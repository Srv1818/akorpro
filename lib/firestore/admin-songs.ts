import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/security/audit-log";
import type { SongDoc, ModerationStatus } from "@/lib/types/firestore";

const COLLECTION = "songs";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

type SongInput = Omit<SongDoc, "schemaVersion" | "createdAt" | "updatedAt" | "moderationStatus"> & {
  moderationStatus?: ModerationStatus;
};

export async function createSong(input: SongInput, actorUid: string): Promise<string> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const data: Record<string, unknown> = omitUndefined({
    ...input,
    moderationStatus: input.moderationStatus ?? "approved",
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  const ref = await db().collection(COLLECTION).add(data);
  await writeAuditLog(actorUid, "song:create", COLLECTION, ref.id, { title: input.title });
  return ref.id;
}

export async function updateSong(
  songId: string,
  updates: Partial<SongInput>,
  actorUid: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db().collection(COLLECTION).doc(songId).update({ ...updates, updatedAt: now });
  await writeAuditLog(actorUid, "song:update", COLLECTION, songId, updates as Record<string, unknown>);
}

export async function deleteSong(songId: string, actorUid: string): Promise<void> {
  await db().collection(COLLECTION).doc(songId).delete();
  await writeAuditLog(actorUid, "song:delete", COLLECTION, songId);
}

export async function moderateSong(
  songId: string,
  newStatus: ModerationStatus,
  actorUid: string,
  note?: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const updates: Record<string, unknown> = {
    moderationStatus: newStatus,
    updatedAt: now,
  };
  await db().collection(COLLECTION).doc(songId).update(updates);
  await writeAuditLog(actorUid, `song:moderate:${newStatus}`, COLLECTION, songId, { note });
}

export async function getPendingSongs(): Promise<(SongDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("moderationStatus", "==", "pending")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SongDoc) }));
}

export async function getAllSongsAdmin(): Promise<(SongDoc & { id: string })[]> {
  const snap = await db().collection(COLLECTION).orderBy("title").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SongDoc) }));
}

export async function getSongByIdAdmin(songId: string): Promise<(SongDoc & { id: string }) | null> {
  const doc = await db().collection(COLLECTION).doc(songId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as SongDoc) };
}
