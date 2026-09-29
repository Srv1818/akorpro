import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { revalidateTag } from "next/cache";
import { TAGS, artistTag, songTag, songsArtistTag } from "@/lib/cache/tags";

/**
 * Payload yazmalarından sonra Next önbelleğini geçersiz kılar.
 *
 * Bu olmadan içerik siteye ancak TTL dolunca düşüyordu: ana sayfa 5 dakika,
 * şarkı ve sanatçı sayfaları 1 saat. Editör kaydettikten sonra "acaba yanlış
 * mı kaydettim" diye şüpheleniyordu.
 *
 * `{ expire: 0 }` bilerek seçildi: `"max"` bayat içeriği arka planda
 * tazelerken göstermeye devam eder, yani kaydeden kişi yine eski hâli görür.
 * Sıfır, sonraki isteği bloklayıp taze veriyi getirir.
 */
const EXPIRE_NOW = { expire: 0 } as const;

/**
 * Hook'lar istek dışında da çalışabiliyor (migration, seed script'i, toplu
 * içe aktarma). O bağlamda `revalidateTag` hata fırlatır; yazma işlemini
 * bu yüzden düşürmemek gerekiyor.
 */
function bust(tags: readonly string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, EXPIRE_NOW);
    } catch {
      // İstek bağlamı yok — yazma başarılı sayılır, önbellek TTL ile tazelenir.
    }
  }
}

/** Şarkı değişince etkilenen her şey. */
function songTags(doc: Record<string, unknown>): string[] {
  const artistSlug = typeof doc.artistSlug === "string" ? doc.artistSlug : "";
  const slug = typeof doc.slug === "string" ? doc.slug : "";

  return [
    // `songs:all` bütün liste/filtre/tekil sorgularının ortak etiketi:
    // filtre kombinasyonları tek tek sayılamayacağı için kapsayıcı olan bu.
    TAGS.SONGS_ALL,
    TAGS.SONGS_FACETS,
    TAGS.DISCOVER_POPULAR,
    TAGS.DISCOVER_NEW,
    TAGS.DISCOVER_FEATURED,
    ...(artistSlug && slug ? [songTag(artistSlug, slug)] : []),
    ...(artistSlug ? [songsArtistTag(artistSlug), artistTag(artistSlug)] : []),
  ];
}

export const revalidateSong: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  const tags = new Set(songTags(doc as Record<string, unknown>));
  // Slug veya sanatçı değiştiyse eski adresin etiketi de düşmeli, yoksa
  // eski URL bayat içerikle ayakta kalır.
  if (previousDoc) for (const t of songTags(previousDoc as Record<string, unknown>)) tags.add(t);
  bust([...tags]);
  return doc;
};

export const revalidateSongAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  bust(songTags(doc as Record<string, unknown>));
  return doc;
};

/** Sanatçı adı/slug'ı şarkılara denormalize edildiği için şarkı etiketleri de düşer. */
export const revalidateArtist: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  const slugs = [doc?.slug, previousDoc?.slug].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  bust([
    TAGS.ARTISTS_ALL,
    TAGS.SONGS_ALL,
    TAGS.SONGS_FACETS,
    ...slugs.flatMap((s) => [artistTag(s), songsArtistTag(s)]),
  ]);
  return doc;
};

export const revalidateArtistAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  const slug = typeof doc?.slug === "string" ? doc.slug : "";
  bust([
    TAGS.ARTISTS_ALL,
    TAGS.SONGS_ALL,
    ...(slug ? [artistTag(slug), songsArtistTag(slug)] : []),
  ]);
  return doc;
};

export const revalidateChordLibrary: CollectionAfterChangeHook = ({ doc }) => {
  bust([TAGS.CHORD_LIBRARY]);
  return doc;
};

export const revalidateChordLibraryAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  bust([TAGS.CHORD_LIBRARY]);
  return doc;
};

/** Keşfet blokları: hangi blok değişirse değişsin üçünü de tazelemek en ucuzu. */
export const revalidateDiscover: CollectionAfterChangeHook = ({ doc }) => {
  bust([TAGS.DISCOVER_FEATURED, TAGS.DISCOVER_POPULAR, TAGS.DISCOVER_NEW]);
  return doc;
};

export const revalidateDiscoverAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  bust([TAGS.DISCOVER_FEATURED, TAGS.DISCOVER_POPULAR, TAGS.DISCOVER_NEW]);
  return doc;
};
