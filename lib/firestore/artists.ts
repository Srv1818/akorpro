import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getPayloadClient } from "@/lib/payload/client";
import { toEpochMs } from "@/lib/payload/serialize";
import type { Artist as ArtistRow } from "@/payload-types";
import { artistTag, TAGS, TTL } from "@/lib/cache/tags";
import type { ArtistDoc } from "@/lib/types/firestore";

/**
 * Sanatçı okuma katmanı — Payload Local API.
 *
 * Dışa aktarılan imzalar değişmedi; çağıran sayfalar aynı.
 * `songCount` kayıtta tutulan bir alan değil, onaylı şarkılardan türetiliyor
 * (MIGRATION-PLAN.md Faz 1 kararı) — elle güncellenen sayaçtaki tutarsızlık
 * riski böylece yok.
 */

type Artist = ArtistDoc & { id: string };

function mapArtist(row: ArtistRow, songCount: number): Artist {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug ?? "",
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    ...(row.genre ? { genre: row.genre } : {}),
    songCount,
    createdAt: toEpochMs(row.createdAt),
    updatedAt: toEpochMs(row.updatedAt),
  } as Artist;
}

/**
 * artistSlug → onaylı şarkı sayısı, tek sorguda gruplanır.
 *
 * Directus'ta bu `aggregate({ groupBy })` ile yapılıyordu. Payload Local
 * API'sinde grup bazlı sayım yok; sanatçı başına ayrı sorgu atmak N+1 olurdu,
 * hepsini çekip bellekte saymak ise Directus'a geçerken bilinçli olarak
 * terk edilen yöntemdi. Bu yüzden doğrudan SQL.
 *
 * `search.ts` de aynı türetmeyi kullandığı için dışa açık.
 */
export async function approvedSongCounts(artistSlugs?: string[]): Promise<Map<string, number>> {
  if (artistSlugs && artistSlugs.length === 0) return new Map();

  const payload = await getPayloadClient();
  const db = payload.db.drizzle as NodePgDatabase<Record<string, never>>;

  // sql.param şart: drizzle şablonu çıplak diziyi birden çok parametreye
  // böler ve Postgres "malformed array literal" döndürür.
  const query = artistSlugs
    ? sql`SELECT artist_slug, COUNT(*)::int AS count
            FROM songs
           WHERE moderation_status = 'approved'
             AND artist_slug = ANY(${sql.param(artistSlugs)})
           GROUP BY artist_slug`
    : sql`SELECT artist_slug, COUNT(*)::int AS count
            FROM songs
           WHERE moderation_status = 'approved'
           GROUP BY artist_slug`;

  const result = await db.execute(query);
  const rows = (result.rows ?? []) as { artist_slug: string | null; count: number }[];

  return new Map(
    rows
      .filter((r): r is { artist_slug: string; count: number } => Boolean(r.artist_slug))
      .map((r) => [r.artist_slug, Number(r.count) || 0]),
  );
}

/* ------------------------------------------------------------------ */
/*  Ham (önbelleksiz) sorgular                                         */
/* ------------------------------------------------------------------ */

async function _getArtistBySlug(slug: string): Promise<Artist | null> {
  const trimmed = slug.trim();

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "artists",
    where: { slug: { equals: trimmed } },
    limit: 1,
    depth: 0,
  });

  const row = docs[0];
  if (!row) return null;

  const counts = await approvedSongCounts([row.slug ?? ""]);
  return mapArtist(row, counts.get(row.slug ?? "") ?? 0);
}

async function _getAllArtists(): Promise<Artist[]> {
  const payload = await getPayloadClient();
  const [{ docs }, counts] = await Promise.all([
    payload.find({ collection: "artists", sort: "name", limit: 0, depth: 0 }),
    approvedSongCounts(),
  ]);

  return docs.map((row) => mapArtist(row, counts.get(row.slug ?? "") ?? 0));
}

/* ------------------------------------------------------------------ */
/*  Önbellekli genel API                                               */
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
