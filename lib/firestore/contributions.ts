import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ContributionDoc } from "@/lib/types/contribution";

const COLLECTION = "contributions";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

type ContributionInput = Pick<
  ContributionDoc,
  | "songTitle"
  | "artistName"
  | "chordBody"
  | "originalKey"
  | "genre"
  | "difficulty"
  | "tempo"
  | "timeSignature"
  | "tuning"
  | "capo"
  | "copyrightSource"
  | "contributorUid"
  | "contributorDisplayName"
>;

export async function createContribution(input: ContributionInput): Promise<string> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const data: Record<string, unknown> = {
    ...input,
    status: "pending",
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db().collection(COLLECTION).add(data);
  return ref.id;
}

export async function getPendingContributions(): Promise<(ContributionDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ContributionDoc) }));
}

export async function getContributionById(
  id: string,
): Promise<(ContributionDoc & { id: string }) | null> {
  const doc = await db().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as ContributionDoc) };
}

export async function getContributionsByUser(
  uid: string,
): Promise<(ContributionDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("contributorUid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ContributionDoc) }));
}

export async function updateContributionStatus(
  id: string,
  status: ContributionDoc["status"],
  moderatorUid: string,
  note?: string,
  approvedSongId?: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const updates: Record<string, unknown> = {
    status,
    moderatorUid,
    updatedAt: now,
  };
  if (note) updates.moderatorNote = note;
  if (approvedSongId) updates.approvedSongId = approvedSongId;

  await db().collection(COLLECTION).doc(id).update(updates);
}
