import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSongsByIds } from "./songs";
import type { DiscoverSectionDoc, SongDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

type SongWithId = SongDoc & { id: string };

async function getSection(section: string): Promise<SongWithId[]> {
  const doc = await db().collection(COLLECTION).doc(section).get();
  if (!doc.exists) return [];
  const data = doc.data() as DiscoverSectionDoc;
  return getSongsByIds(data.songIds);
}

export async function getDiscoverPopular(): Promise<SongWithId[]> {
  return getSection("popular");
}

export async function getDiscoverNew(): Promise<SongWithId[]> {
  return getSection("new");
}

export async function getDiscoverFeatured(): Promise<SongWithId[]> {
  return getSection("featured");
}
