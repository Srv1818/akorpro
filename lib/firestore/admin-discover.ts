import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/security/audit-log";
import type { DiscoverSectionDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";

export const DISCOVER_SECTIONS = ["popular", "new", "featured"] as const;
export type DiscoverSection = (typeof DISCOVER_SECTIONS)[number];

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

export function isDiscoverSection(v: string): v is DiscoverSection {
  return (DISCOVER_SECTIONS as readonly string[]).includes(v);
}

export async function getDiscoverSectionsAdmin(): Promise<Record<DiscoverSection, string[]>> {
  const fs = db();
  const result: Record<DiscoverSection, string[]> = { popular: [], new: [], featured: [] };
  for (const section of DISCOVER_SECTIONS) {
    const doc = await fs.collection(COLLECTION).doc(section).get();
    if (!doc.exists) continue;
    const data = doc.data() as DiscoverSectionDoc;
    const ids = Array.isArray(data.songIds) ? data.songIds : [];
    result[section] = ids.filter((id): id is string => typeof id === "string" && id.trim() !== "");
  }
  return result;
}

export async function setDiscoverSectionSongIds(
  section: DiscoverSection,
  songIds: string[],
  actorUid: string,
): Promise<string[]> {
  const normalized = normalizeSongIds(songIds);
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db().collection(COLLECTION).doc(section).set({ songIds: normalized, updatedAt: now }, { merge: true });
  await writeAuditLog(actorUid, "discover:update", COLLECTION, section, { count: normalized.length });
  return normalized;
}
