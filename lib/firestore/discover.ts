import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSongsByIds } from "./songs";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { DiscoverSectionDoc, SongDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";

type SongWithId = SongDoc & { id: string };

/** İlk istekte (soğuk başlatma / geçici UNAVAILABLE) sık görülen hatalarda birkaç kez dene. */
async function withFirestoreRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const delaysMs = [0, 300, 700];
  let last: unknown;
  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i] > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[i]));
    }
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.warn(`[discover] ${label} deneme ${i + 1}/${delaysMs.length}`, e);
    }
  }
  throw last;
}

async function _getSection(section: string): Promise<SongWithId[]> {
  const fs = getAdminFirestore();
  if (!fs) {
    throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  }

  return withFirestoreRetry(section, async () => {
    const doc = await fs.collection(COLLECTION).doc(section).get();
    if (!doc.exists) return [];
    const data = doc.data() as DiscoverSectionDoc;
    return getSongsByIds(data.songIds);
  });
}

function emptyDiscover(): Promise<SongWithId[]> {
  return Promise.resolve([]);
}

function discoverCatch(label: string, p: Promise<SongWithId[]>): Promise<SongWithId[]> {
  return p.catch((e: unknown) => {
    console.error(`[discover] ${label} yüklenemedi`, e);
    return [];
  });
}

/* ------------------------------------------------------------------ */
/*  Cached public API                                                  */
/* ------------------------------------------------------------------ */

export function getDiscoverPopular() {
  if (!getAdminFirestore()) return emptyDiscover();
  return discoverCatch(
    "popular",
    unstable_cache(
      () => _getSection("popular"),
      ["discover-popular"],
      { tags: [TAGS.DISCOVER_POPULAR], revalidate: TTL.DISCOVER },
    )(),
  );
}

export function getDiscoverNew() {
  if (!getAdminFirestore()) return emptyDiscover();
  return discoverCatch(
    "new",
    unstable_cache(
      () => _getSection("new"),
      ["discover-new"],
      { tags: [TAGS.DISCOVER_NEW], revalidate: TTL.DISCOVER },
    )(),
  );
}

export function getDiscoverFeatured() {
  if (!getAdminFirestore()) return emptyDiscover();
  return discoverCatch(
    "featured",
    unstable_cache(
      () => _getSection("featured"),
      ["discover-featured"],
      { tags: [TAGS.DISCOVER_FEATURED], revalidate: TTL.DISCOVER },
    )(),
  );
}
