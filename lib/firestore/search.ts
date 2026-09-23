import type { Where } from "payload";
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

export async function getPopularArtists(
  limit = 6,
): Promise<{ id: string; name: string; slug: string; songCount: number }[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "artists",
    sort: "-popularity",
    limit,
    depth: 0,
  });

  const counts = await approvedSongCounts(docs.map((a) => a.slug ?? ""));

  return docs.map((a) => ({
    id: String(a.id),
    name: sanitizePlainField(a.name),
    slug: a.slug ?? "",
    songCount: counts.get(a.slug ?? "") ?? 0,
  }));
}
