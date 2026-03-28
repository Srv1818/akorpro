import type { MetadataRoute } from "next";
import { SITE_URL, chordPath, artistPath } from "@/lib/paths";
import { getAllApprovedSongs } from "@/lib/firestore/songs";
import { getAllArtists } from "@/lib/firestore/artists";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [songs, artists] = await Promise.all([
    getAllApprovedSongs().catch(() => []),
    getAllArtists().catch(() => []),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/kesfet`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/gitar-akorlari`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/akor-kutuphanesi`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/gamlar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/besli-cember`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/katki`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const artistEntries: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${SITE_URL}${artistPath(a.slug)}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const songEntries: MetadataRoute.Sitemap = songs.map((s) => ({
    url: `${SITE_URL}${chordPath(s.artistSlug, s.slug)}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...artistEntries, ...songEntries];
}
