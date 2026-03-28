import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSongsByIds } from "./songs";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { DiscoverSectionDoc, SongDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

type SongWithId = SongDoc & { id: string };

async function _getSection(section: string): Promise<SongWithId[]> {
  const doc = await db().collection(COLLECTION).doc(section).get();
  if (!doc.exists) return [];
  const data = doc.data() as DiscoverSectionDoc;
  return getSongsByIds(data.songIds);
}

/* ------------------------------------------------------------------ */
/*  Cached public API                                                  */
/* ------------------------------------------------------------------ */

export function getDiscoverPopular() {
  return unstable_cache(
    () => _getSection("popular"),
    ["discover-popular"],
    { tags: [TAGS.DISCOVER_POPULAR], revalidate: TTL.DISCOVER },
  )();
}

export function getDiscoverNew() {
  return unstable_cache(
    () => _getSection("new"),
    ["discover-new"],
    { tags: [TAGS.DISCOVER_NEW], revalidate: TTL.DISCOVER },
  )();
}

export function getDiscoverFeatured() {
  return unstable_cache(
    () => _getSection("featured"),
    ["discover-featured"],
    { tags: [TAGS.DISCOVER_FEATURED], revalidate: TTL.DISCOVER },
  )();
}
