import { unstable_cache } from "next/cache";
import { aggregate, readItems } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { toEpochMs } from "@/lib/directus/serialize";
import type { ArtistRow } from "@/lib/directus/schema";
import { artistTag, TAGS, TTL } from "@/lib/cache/tags";
import type { ArtistDoc } from "@/lib/types/firestore";

/**
 * Sanatçı okuma katmanı — Directus.
 *
 * Dışa aktarılan imzalar Firestore sürümüyle aynı bırakıldı; çağıran sayfalar değişmedi.
 * `songCount` artık kayıtta tutulan bir alan değil, onaylı şarkılardan **türetiliyor**
 * (MIGRATION-PLAN.md Faz 1 şema denetimi kararı) — elle güncellenen sayaçtaki
 * tutarsızlık riski böylece ortadan kalkıyor.
 */

type Artist = ArtistDoc & { id: string };

function mapArtist(row: ArtistRow, songCount: number): Artist {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.genre ? { genre: row.genre } : {}),
    songCount,
    ...(row.popularity != null ? { popularity: row.popularity } : {}),
    createdAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

/**
 * artist_slug → onaylı şarkı sayısı. Tek sorguda gruplanır.
 * `search.ts` de aynı türetmeyi kullandığı için dışa açık.
 */
export async function approvedSongCounts(artistSlugs?: string[]): Promise<Map<string, number>> {
  const rows = (await directus().request(
    aggregate("songs", {
      aggregate: { count: "*" },
      groupBy: ["artist_slug"],
      query: {
        filter: {
          moderation_status: { _eq: "approved" },
          ...(artistSlugs ? { artist_slug: { _in: artistSlugs } } : {}),
        },
      },
    }),
  )) as unknown as { artist_slug: string; count: string | number }[];

  return new Map(rows.map((r) => [r.artist_slug, Number(r.count) || 0]));
}

/* ------------------------------------------------------------------ */
/*  Raw (uncached) queries                                             */
/* ------------------------------------------------------------------ */

async function _getArtistBySlug(slug: string): Promise<Artist | null> {
  const trimmed = slug.trim();

  const rows = await directus().request(
    readItems("artists", {
      filter: { slug: { _eq: trimmed } },
      limit: 1,
    }),
  );

  const row = rows[0];
  if (!row) return null;

  const counts = await approvedSongCounts([row.slug]);
  return mapArtist(row, counts.get(row.slug) ?? 0);
}

async function _getAllArtists(): Promise<Artist[]> {
  const [rows, counts] = await Promise.all([
    directus().request(readItems("artists", { sort: ["name"], limit: -1 })),
    approvedSongCounts(),
  ]);

  return rows.map((row) => mapArtist(row, counts.get(row.slug) ?? 0));
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
