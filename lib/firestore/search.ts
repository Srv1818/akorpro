import type { Where } from "payload";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getPayloadClient } from "@/lib/payload/client";
import { approvedSongCounts } from "./artists";
import { sanitizePlainField } from "@/lib/security/sanitize";
import type { Difficulty } from "@/lib/types/content";

/**
 * Şarkı ve sanatçı araması — Payload Local API.
 *
 * Arama veritabanında kalıyor: Payload'ın `like` operatörü Postgres adaptöründe
 * ILIKE'a çevriliyor, yani Directus'taki `_icontains` ile aynı davranış.
 * Firestore dönemindeki "hepsini çek, bellekte süz" yöntemine dönülmedi.
 * İleride Meilisearch/Algolia'ya geçilirse imza aynı kalır.
 */

export type SearchResult = {
  songs: {
    id: string;
    title: string;
    slug: string;
    artistSlug: string;
    artistName: string;
    originalKey: string;
    difficulty: Difficulty;
  }[];
  artists: { id: string; name: string; slug: string; songCount: number }[];
};

const APPROVED: Where = { moderationStatus: { equals: "approved" } };

export async function searchContent(query: string, limit = 20): Promise<SearchResult> {
  const q = sanitizePlainField(query).trim();
  if (q.length < 2) return { songs: [], artists: [] };

  const payload = await getPayloadClient();

  const [songRes, artistRes] = await Promise.all([
    payload.find({
      collection: "songs",
      where: {
        and: [APPROVED, { or: [{ title: { like: q } }, { artistName: { like: q } }] }],
      },
      sort: "title",
      limit,
      depth: 0,
    }),
    payload.find({
      collection: "artists",
      where: { name: { like: q } },
      sort: "name",
      limit,
      depth: 0,
    }),
  ]);

  const counts = await approvedSongCounts(artistRes.docs.map((a) => a.slug ?? ""));

  return {
    songs: songRes.docs.map((r) => ({
      id: String(r.id),
      title: sanitizePlainField(r.title),
      slug: r.slug ?? "",
      artistSlug: r.artistSlug ?? "",
      artistName: sanitizePlainField(r.artistName ?? ""),
      originalKey: r.originalKey,
      difficulty: r.difficulty as Difficulty,
    })),
    artists: artistRes.docs.map((a) => ({
      id: String(a.id),
      name: sanitizePlainField(a.name),
      slug: a.slug ?? "",
      songCount: counts.get(a.slug ?? "") ?? 0,
    })),
  };
}

/**
 * Arama sayfasında boş durumda gösterilen popüler sanatçılar.
 *
 * Eskiden elle girilen `artists.popularity` alanına göre sıralanıyordu.
 * O alan kaldırıldı: şarkılardaki gibi burada da sıralama son 30 günün
 * gerçek görüntülenmesinden türüyor — sanatçının şarkılarının toplamı.
 *
 * Hiç görüntülenme yoksa liste boş kalmasın diye şarkı sayısı en yüksek
 * sanatçılarla tamamlanıyor.
 */
export async function getPopularArtists(
  limit = 6,
): Promise<{ id: string; name: string; slug: string; songCount: number }[]> {
  const payload = await getPayloadClient();
  const db = payload.db.drizzle as NodePgDatabase<Record<string, never>>;

  const result = await db.execute(sql`
    SELECT s.artist_slug AS slug
      FROM songs s
      JOIN song_views v ON v.song_id = s.id
     WHERE s.moderation_status = 'approved'
       AND s.artist_slug IS NOT NULL
       AND v.day >= to_char(now() - interval '30 days', 'YYYY-MM-DD')
     GROUP BY s.artist_slug
     ORDER BY SUM(v.count) DESC
     LIMIT ${limit}
  `);

  const rankedSlugs = ((result.rows ?? []) as { slug: string }[])
    .map((r) => r.slug)
    .filter(Boolean);

  const { docs } = await payload.find({
    collection: "artists",
    // Sıralaması olanlar önce; kalanı şarkı sayısıyla tamamlanacak.
    where: rankedSlugs.length > 0 ? { slug: { in: rankedSlugs } } : {},
    sort: "name",
    limit: rankedSlugs.length > 0 ? rankedSlugs.length : limit,
    depth: 0,
  });

  const bySlug = new Map(docs.map((a) => [a.slug ?? "", a]));
  const ordered =
    rankedSlugs.length > 0
      ? rankedSlugs.flatMap((s) => {
          const a = bySlug.get(s);
          return a ? [a] : [];
        })
      : docs;

  const counts = await approvedSongCounts(ordered.map((a) => a.slug ?? ""));

  const out = ordered.map((a) => ({
    id: String(a.id),
    name: sanitizePlainField(a.name),
    slug: a.slug ?? "",
    songCount: counts.get(a.slug ?? "") ?? 0,
  }));

  if (out.length >= limit) return out.slice(0, limit);

  // Görüntülenmesi olmayanlarla tamamla: en çok şarkısı olan önce.
  const seen = new Set(out.map((a) => a.slug));
  const all = await payload.find({ collection: "artists", limit: 0, depth: 0, sort: "name" });
  const allCounts = await approvedSongCounts();
  const fillers = all.docs
    .filter((a) => !seen.has(a.slug ?? ""))
    .map((a) => ({
      id: String(a.id),
      name: sanitizePlainField(a.name),
      slug: a.slug ?? "",
      songCount: allCounts.get(a.slug ?? "") ?? 0,
    }))
    .sort((x, y) => y.songCount - x.songCount || x.name.localeCompare(y.name, "tr"));

  return [...out, ...fillers].slice(0, limit);
}
