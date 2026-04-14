import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serializeDoc } from "@/lib/firestore/serialize";
import { artistTag, TAGS, TTL } from "@/lib/cache/tags";
import type { ArtistDoc } from "@/lib/types/firestore";

const COLLECTION = "artists";

function normalizeSlugMatch(s: string): string {
  return s.trim().normalize("NFKC").toLocaleLowerCase("tr-TR");
}

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

/* ------------------------------------------------------------------ */
/*  Raw (uncached) queries                                             */
/* ------------------------------------------------------------------ */

async function _getArtistBySlug(slug: string): Promise<(ArtistDoc & { id: string }) | null> {
  const trimmedSlug = slug.trim();
  const snap = await db()
    .collection(COLLECTION)
    .where("slug", "==", trimmedSlug)
    .limit(1)
    .get();

  if (!snap.empty) {
    const doc = snap.docs[0];
    return serializeDoc({ id: doc.id, ...(doc.data() as ArtistDoc) });
  }

  // Eski verilerde slug biçimi (boşluk/büyük-küçük harf/birleşik karakter) farklı olabilir.
  // Bu durumda tüm sanatçılar içinde normalize karşılaştırma ile doğru kaydı bul.
  const normalizedSlug = normalizeSlugMatch(trimmedSlug);
  const allSnap = await db().collection(COLLECTION).get();
  const matched = allSnap.docs.find((d) => {
    const data = d.data() as ArtistDoc;
    return normalizeSlugMatch(data.slug) === normalizedSlug;
  });
  if (!matched) return null;
  return serializeDoc({ id: matched.id, ...(matched.data() as ArtistDoc) });
}

async function _getAllArtists(): Promise<(ArtistDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .orderBy("name")
    .get();

  return snap.docs.map((d) => serializeDoc({ id: d.id, ...(d.data() as ArtistDoc) }));
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
