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

  let songsSnap: FirebaseFirestore.QuerySnapshot;
  let artistsSnap: FirebaseFirestore.QuerySnapshot;

  try {
    [songsSnap, artistsSnap] = await Promise.all([
      db()
        .collection("songs")
        .where("moderationStatus", "==", "approved")
        .orderBy("title")
        .get(),
      db().collection("artists").orderBy("name").get(),
    ]);
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 9) {
      console.warn("[search] Composite index missing, falling back to unordered query");
      [songsSnap, artistsSnap] = await Promise.all([
        db()
          .collection("songs")
          .where("moderationStatus", "==", "approved")
          .get(),
        db().collection("artists").get(),
      ]);
    } else {
      throw err;
    }
  }

  const songResults: SearchResult["songs"] = [];
  const songDocs = [...songsSnap.docs].sort((a, b) =>
    ((a.data() as SongDoc).title ?? "").localeCompare((b.data() as SongDoc).title ?? "", "tr"),
  );
  for (const doc of songDocs) {
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
  const artistDocs = [...artistsSnap.docs].sort((a, b) =>
    ((a.data() as ArtistDoc).name ?? "").localeCompare((b.data() as ArtistDoc).name ?? "", "tr"),
  );
  for (const doc of artistDocs) {
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
  try {
    const snap = await db()
      .collection("artists")
      .orderBy("popularity", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => {
      const data = d.data() as ArtistDoc;
      return { id: d.id, name: data.name, slug: data.slug, songCount: data.songCount };
    });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 9) {
      console.warn("[search] Index missing for popularity sort, falling back to in-memory sort");
      const snap = await db().collection("artists").get();
      return snap.docs
        .map((d) => {
          const data = d.data() as ArtistDoc;
          return { id: d.id, name: data.name, slug: data.slug, songCount: data.songCount, popularity: data.popularity ?? 0 };
        })
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit)
        .map(({ popularity: _, ...rest }) => rest);
    }
    throw err;
  }
}
