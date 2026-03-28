import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { artistTag, TAGS, TTL } from "@/lib/cache/tags";
import type { ArtistDoc } from "@/lib/types/firestore";

const COLLECTION = "artists";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

/* ------------------------------------------------------------------ */
/*  Raw (uncached) queries                                             */
/* ------------------------------------------------------------------ */

async function _getArtistBySlug(slug: string): Promise<(ArtistDoc & { id: string }) | null> {
  const snap = await db()
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as ArtistDoc) };
}

async function _getAllArtists(): Promise<(ArtistDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .orderBy("name")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ArtistDoc) }));
}

/* ------------------------------------------------------------------ */
/*  Cached public API                                                  */
/* ------------------------------------------------------------------ */

/** Tek sanatçı — slug ile (ISR cached) */
export function getArtistBySlug(slug: string) {
  return unstable_cache(
    () => _getArtistBySlug(slug),
    ["artist-by-slug", slug],
    {
      tags: [artistTag(slug), TAGS.ARTISTS_ALL],
      revalidate: TTL.ARTIST,
    },
  )();
}

/** Tüm sanatçılar — generateStaticParams veya filtre listeleri (ISR cached) */
export function getAllArtists() {
  return unstable_cache(
    _getAllArtists,
    ["artists-all"],
    {
      tags: [TAGS.ARTISTS_ALL],
      revalidate: TTL.ARTIST,
    },
  )();
}
