import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSongsByIds } from "./songs";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { DiscoverSectionDoc, SongDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";
const DISCOVER_TARGET_COUNT = 12;
const MAX_CURATED_IDS_READ = 24;

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
    const curatedIds = doc.exists ? ((doc.data() as DiscoverSectionDoc).songIds ?? []).slice(0, MAX_CURATED_IDS_READ) : [];
    const curated = await getSongsByIds(curatedIds);

    // "Yeni eklenenler" bölümünde canlı veriyi öne al ki adminden yeni eklenen şarkılar
    // curated liste dolu olsa bile anında görünsün.
    if (section === "new") {
      const dynamic = await getDynamicSectionFallback(section, DISCOVER_TARGET_COUNT);
      const merged: SongWithId[] = [...dynamic];
      const seen = new Set(dynamic.map((s) => s.id));
      for (const s of curated) {
        if (seen.has(s.id)) continue;
        merged.push(s);
        if (merged.length >= DISCOVER_TARGET_COUNT) break;
      }
      return merged.slice(0, DISCOVER_TARGET_COUNT);
    }

    // Diğer bölümlerde curated liste hedefi dolduruyorsa pahalı fallback sorgusuna hiç gitme.
    if (curated.length >= DISCOVER_TARGET_COUNT) return curated.slice(0, DISCOVER_TARGET_COUNT);

    const merged: SongWithId[] = [...curated];
    const seen = new Set(curated.map((s) => s.id));
    const dynamic = await getDynamicSectionFallback(section, DISCOVER_TARGET_COUNT);
    for (const s of dynamic) {
      if (seen.has(s.id)) continue;
      merged.push(s);
      if (merged.length >= DISCOVER_TARGET_COUNT) break;
    }
    return merged;
  });
}

async function getDynamicSectionFallback(section: string, limit: number): Promise<SongWithId[]> {
  const fs = getAdminFirestore();
  if (!fs) return [];

  let q: FirebaseFirestore.Query = fs
    .collection("songs")
    .where("moderationStatus", "==", "approved");

  if (section === "new") {
    q = q.orderBy("createdAt", "desc");
  } else {
    q = q.orderBy("popularity", "desc");
  }

  const snap = await q.limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SongDoc) }));
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
