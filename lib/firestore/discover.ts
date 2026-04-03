import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSongsByIds } from "./songs";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { DiscoverSectionDoc, SongDoc } from "@/lib/types/firestore";

const COLLECTION = "discover";
const DISCOVER_TARGET_COUNT = 12;
const MAX_CURATED_IDS_READ = 24;

type SongWithId = SongDoc & { id: string };

function timestampToMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in (value as Record<string, unknown>)) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === "function") {
      return toMillis.call(value as object);
    }
  }
  return 0;
}

function isFailedPrecondition(err: unknown): boolean {
  const e = err as { code?: number | string; message?: string };
  if (e.code === 9) return true;
  if (e.code === "FAILED_PRECONDITION" || e.code === "failed-precondition") return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("requires an index") || msg.includes("composite index");
}

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
      if (isFailedPrecondition(e)) {
        throw e;
      }
      last = e;
      console.warn(`[discover] ${label} deneme ${i + 1}/${delaysMs.length}`, e);
    }
  }
  throw last;
}

function comparePopular(a: SongWithId, b: SongWithId): number {
  const pa = a.popularity ?? 0;
  const pb = b.popularity ?? 0;
  if (pb !== pa) return pb - pa;
  return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
}

/** Onaylı şarkılar: `popularity` desc (şemada elle veya içe aktarım ile). */
async function getPopularSongsDynamic(limit: number): Promise<SongWithId[]> {
  const fs = getAdminFirestore();
  if (!fs) return [];

  try {
    const q = fs
      .collection("songs")
      .where("moderationStatus", "==", "approved")
      .orderBy("popularity", "desc");

    const snap = await q.limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SongDoc) }));
  } catch (err: unknown) {
    if (isFailedPrecondition(err)) {
      const snap = await fs
        .collection("songs")
        .where("moderationStatus", "==", "approved")
        .limit(limit * 5)
        .get();
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as SongDoc) }))
        .sort(comparePopular)
        .slice(0, limit);
    }
    throw err;
  }
}

async function getNewSongsDynamic(limit: number): Promise<SongWithId[]> {
  const fs = getAdminFirestore();
  if (!fs) return [];

  try {
    const q = fs
      .collection("songs")
      .where("moderationStatus", "==", "approved")
      .orderBy("createdAt", "desc");

    const snap = await q.limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SongDoc) }));
  } catch (err: unknown) {
    if (isFailedPrecondition(err)) {
      const snap = await fs
        .collection("songs")
        .where("moderationStatus", "==", "approved")
        .limit(limit * 3)
        .get();
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as SongDoc) }))
        .sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt))
        .slice(0, limit);
    }
    throw err;
  }
}

async function getFeaturedCurated(): Promise<SongWithId[]> {
  const fs = getAdminFirestore();
  if (!fs) {
    throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  }

  return withFirestoreRetry("featured", async () => {
    const doc = await fs.collection(COLLECTION).doc("featured").get();
    const curatedIds = doc.exists
      ? ((doc.data() as DiscoverSectionDoc).songIds ?? []).slice(0, MAX_CURATED_IDS_READ)
      : [];
    const curated = await getSongsByIds(curatedIds);
    return curated.slice(0, DISCOVER_TARGET_COUNT);
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
      () => withFirestoreRetry("popular", () => getPopularSongsDynamic(DISCOVER_TARGET_COUNT)),
      ["discover-popular"],
      { tags: [TAGS.DISCOVER_POPULAR], revalidate: TTL.DISCOVER_POPULAR },
    )(),
  );
}

export function getDiscoverNew() {
  if (!getAdminFirestore()) return emptyDiscover();
  return discoverCatch(
    "new",
    unstable_cache(
      () => withFirestoreRetry("new", () => getNewSongsDynamic(DISCOVER_TARGET_COUNT)),
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
      () => getFeaturedCurated(),
      ["discover-featured"],
      { tags: [TAGS.DISCOVER_FEATURED], revalidate: TTL.DISCOVER },
    )(),
  );
}
