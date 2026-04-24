import type { MetadataRoute } from "next";
import { SITE_URL, chordPath, artistPath } from "@/lib/paths";
import { getAllApprovedSongs } from "@/lib/firestore/songs";
import { getAllArtists } from "@/lib/firestore/artists";

function safeAbsoluteUrl(path: string): string | null {
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/gitar-akorlari`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/akor-kutuphanesi`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/gamlar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/besli-cember`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/iletisim`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const [songs, artists] = await Promise.all([
      getAllApprovedSongs().catch(() => []),
      getAllArtists().catch(() => []),
    ]);

    const artistEntries: MetadataRoute.Sitemap = [];
    for (const artist of artists) {
      const url = safeAbsoluteUrl(artistPath(artist.slug));
      if (!url) continue;
      artistEntries.push({
        url,
        lastModified: artist.updatedAt ? new Date(artist.updatedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const songEntries: MetadataRoute.Sitemap = [];
    for (const song of songs) {
      const url = safeAbsoluteUrl(chordPath(song.artistSlug, song.slug));
      if (!url) continue;
      songEntries.push({
        url,
        lastModified: song.updatedAt ? new Date(song.updatedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
        ...(song.coverImageUrl ? { images: [song.coverImageUrl] } : {}),
      });
    }

    return [...staticPages, ...artistEntries, ...songEntries];
  } catch {
    // Sitemap hiçbir koşulda 500 üretmesin; en azından statik URL'leri döndür.
    return staticPages;
  }
}
