import { readItems } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { approvedSongCounts } from "./artists";
import { sanitizePlainField } from "@/lib/security/sanitize";
import type { Difficulty } from "@/lib/types/content";

/**
 * Şarkı ve sanatçı araması — Directus.
 *
 * Firestore sürümü tam metin araması yapamadığı için **tüm onaylı şarkıları ve
 * sanatçıları çekip bellekte** süzüyordu. Postgres `ILIKE` desteklediğinden arama
 * artık veritabanında yapılıyor ve yalnız eşleşen kayıtlar ağdan geçiyor.
 * İleride Meilisearch/Algolia'ya geçilmek istenirse imza aynı kalır.
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

const APPROVED = { moderation_status: { _eq: "approved" } } as const;

export async function searchContent(query: string, limit = 20): Promise<SearchResult> {
  const q = sanitizePlainField(query).trim();
  if (q.length < 2) return { songs: [], artists: [] };

  const [songRows, artistRows] = await Promise.all([
    directus().request(
      readItems("songs", {
        filter: {
          _and: [
            APPROVED,
            { _or: [{ title: { _icontains: q } }, { artist_name: { _icontains: q } }] },
          ],
        },
        sort: ["title"],
        limit,
        fields: [
          "id", "title", "slug", "artist_slug", "artist_name", "original_key", "difficulty",
        ] as const,
      }),
    ),
    directus().request(
      readItems("artists", {
        filter: { name: { _icontains: q } },
        sort: ["name"],
        limit,
        fields: ["id", "name", "slug"] as const,
      }),
    ),
  ]);

  const counts = await approvedSongCounts(artistRows.map((a) => a.slug));

  return {
    songs: songRows.map((r) => ({
      id: r.id,
      title: sanitizePlainField(r.title),
      slug: r.slug,
      artistSlug: r.artist_slug,
      artistName: sanitizePlainField(r.artist_name),
      originalKey: r.original_key,
      difficulty: r.difficulty,
    })),
    artists: artistRows.map((a) => ({
      id: a.id,
      name: sanitizePlainField(a.name),
      slug: a.slug,
      songCount: counts.get(a.slug) ?? 0,
    })),
  };
}

export async function getPopularArtists(
  limit = 6,
): Promise<{ id: string; name: string; slug: string; songCount: number }[]> {
  const rows = await directus().request(
    readItems("artists", {
      sort: ["-popularity"],
      limit,
      fields: ["id", "name", "slug"] as const,
    }),
  );

  const counts = await approvedSongCounts(rows.map((a) => a.slug));

  return rows.map((a) => ({
    id: a.id,
    name: sanitizePlainField(a.name),
    slug: a.slug,
    songCount: counts.get(a.slug) ?? 0,
  }));
}
