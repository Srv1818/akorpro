import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serializeDoc } from "@/lib/firestore/serialize";
import { writeAuditLog } from "@/lib/security/audit-log";
import type { BolumDoc, MetodDoc } from "@/lib/types/firestore";

const COLLECTION = "metodlar";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

type MetodInput = Omit<MetodDoc, "schemaVersion" | "createdAt" | "updatedAt">;

export async function createMetod(input: MetodInput, actorUid: string): Promise<string> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const ref = await db().collection(COLLECTION).add({
    ...input,
    schemaVersion: 2,
    createdAt: now,
    updatedAt: now,
  });
  await writeAuditLog(actorUid, "metod:create", COLLECTION, ref.id, { title: input.title });
  return ref.id;
}

export async function deleteMetod(metodId: string, actorUid: string): Promise<void> {
  await db().collection(COLLECTION).doc(metodId).delete();
  await writeAuditLog(actorUid, "metod:delete", COLLECTION, metodId);
}

export async function updateMetodBolumler(
  metodId: string,
  bolumler: BolumDoc[],
  actorUid: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db().collection(COLLECTION).doc(metodId).update({ bolumler, updatedAt: now });
  await writeAuditLog(actorUid, "metod:update-bolumler", COLLECTION, metodId);
}

export async function getAllMetodlar(): Promise<(MetodDoc & { id: string })[]> {
  const snap = await db().collection(COLLECTION).orderBy("title").get();
  return snap.docs.map((d) => serializeDoc({ id: d.id, ...(d.data() as MetodDoc) }));
}

export async function getMetodById(id: string): Promise<(MetodDoc & { id: string }) | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return serializeDoc({ id: snap.id, ...(snap.data() as MetodDoc) });
}

export async function getMetodBySlug(slug: string): Promise<(MetodDoc & { id: string }) | null> {
  const snap = await db().collection(COLLECTION).where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return serializeDoc({ id: d.id, ...(d.data() as MetodDoc) });
}
