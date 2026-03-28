import { getAdminFirestore } from "@/lib/firebase/admin";
import { sanitizePlainField } from "@/lib/security/sanitize";
import type { SongDoc, ArtistDoc } from "@/lib/types/firestore";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

import type { Difficulty } from "@/lib/types/content";

export type SearchResult = {
  songs: { id: string; title: string; slug: string; artistSlug: string; artistName: string; originalKey: string; difficulty: Difficulty }[];
  artists: { id: string; name: string; slug: string; songCount: number }[];
};

/**
 * Server-side search across songs and artists.
 * Uses Firestore prefix matching + in-memory filter for Turkish text.
 * Designed to be swappable with Algolia/Meilisearch later.
 */
export async function searchContent(query: string, limit = 20): Promise<SearchResult> {
  const q = sanitizePlainField(query).toLowerCase();
  if (q.length < 2) return { songs: [], artists: [] };

  const [songsSnap, artistsSnap] = await Promise.all([
    db()
      .collection("songs")
      .where("moderationStatus", "==", "approved")
      .orderBy("title")
      .get(),
    db().collection("artists").orderBy("name").get(),
  ]);

  const songResults: SearchResult["songs"] = [];
  for (const doc of songsSnap.docs) {
    if (songResults.length >= limit) break;
    const data = doc.data() as SongDoc;
    const titleLower = (data.title ?? "").toLowerCase();
    const artistLower = (data.artistName ?? "").toLowerCase();
    if (titleLower.includes(q) || artistLower.includes(q)) {
      songResults.push({
        id: doc.id,
        title: data.title,
        slug: data.slug,
        artistSlug: data.artistSlug,
        artistName: data.artistName,
        originalKey: data.originalKey,
        difficulty: data.difficulty as Difficulty,
      });
    }
  }

  const artistResults: SearchResult["artists"] = [];
  for (const doc of artistsSnap.docs) {
    if (artistResults.length >= limit) break;
    const data = doc.data() as ArtistDoc;
    if ((data.name ?? "").toLowerCase().includes(q)) {
      artistResults.push({
        id: doc.id,
        name: data.name,
        slug: data.slug,
        songCount: data.songCount,
      });
    }
  }

  return { songs: songResults, artists: artistResults };
}

export async function getPopularArtists(
  limit = 6,
): Promise<{ id: string; name: string; slug: string; songCount: number }[]> {
  const snap = await db()
    .collection("artists")
    .orderBy("popularity", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as ArtistDoc;
    return { id: d.id, name: data.name, slug: data.slug, songCount: data.songCount };
  });
}
