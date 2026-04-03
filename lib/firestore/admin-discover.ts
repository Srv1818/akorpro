import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/security/audit-log";
import type { DiscoverSectionDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";
const FEATURED_DOC = "featured";

export const DISCOVER_MAX_SONG_IDS = 24;

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

function normalizeSongIds(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    const t = id.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= DISCOVER_MAX_SONG_IDS) break;
  }
  return out;
}

export async function getFeaturedSongIdsAdmin(): Promise<string[]> {
  const doc = await db().collection(COLLECTION).doc(FEATURED_DOC).get();
  if (!doc.exists) return [];
  const data = doc.data() as DiscoverSectionDoc;
  const ids = Array.isArray(data.songIds) ? data.songIds : [];
  return ids.filter((id): id is string => typeof id === "string" && id.trim() !== "");
}

export async function setFeaturedSongIds(songIds: string[], actorUid: string): Promise<string[]> {
  const normalized = normalizeSongIds(songIds);
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db().collection(COLLECTION).doc(FEATURED_DOC).set({ songIds: normalized, updatedAt: now }, { merge: true });
  await writeAuditLog(actorUid, "discover:update", COLLECTION, FEATURED_DOC, { count: normalized.length });
  return normalized;
}
