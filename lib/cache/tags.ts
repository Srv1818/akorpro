/**
 * Cache tag naming convention & TTL constants.
 *
 * Tag pattern:  entity:identifier
 *   song:{artistSlug}/{songSlug}    — single song data
 *   artist:{slug}                   — single artist data
 *   songs:all                       — full approved-songs list
 *   songs:facets                    — filter facet options
 *   songs:artist:{slug}             — songs by artist
 *   songs:filtered:{hash}           — filtered song list
 *   discover:popular                — discover "popular" block
 *   discover:new                    — discover "new" block
 *   discover:featured               — discover "featured" block
 *
 * On-demand revalidation (moderation/approval) — Next.js 16+: ikinci argüman
 * geçerli cacheLife profili olmalı (ör. "max"); "page" geçerli profil değildir.
 *   revalidateTag(`song:${artistSlug}/${songSlug}`, "max")
 *   revalidateTag("songs:all", "max")
 *   revalidateTag("discover:popular", "max")
 */

/* ------------------------------------------------------------------ */
/*  Tag helpers                                                        */
/* ------------------------------------------------------------------ */

export function songTag(artistSlug: string, songSlug: string): string {
  return `song:${artistSlug}/${songSlug}`;
}

export function artistTag(slug: string): string {
  return `artist:${slug}`;
}

export function songsArtistTag(artistSlug: string): string {
  return `songs:artist:${artistSlug}`;
}

export function songsFilteredTag(hash: string): string {
  return `songs:filtered:${hash}`;
}

export const TAGS = {
  SONGS_ALL: "songs:all",
  SONGS_FACETS: "songs:facets",
  ARTISTS_ALL: "artists:all",
  DISCOVER_POPULAR: "discover:popular",
  DISCOVER_NEW: "discover:new",
  DISCOVER_FEATURED: "discover:featured",
} as const;

/* ------------------------------------------------------------------ */
/*  TTL (seconds) — time-based ISR revalidation                        */
/* ------------------------------------------------------------------ */

export const TTL = {
  /** Song detail & artist pages — stale after 1 hour */
  SONG_DETAIL: 3600,
  ARTIST: 3600,

  /** Discover sections — stale after 5 minutes */
  DISCOVER: 300,

  /** Popüler keşfet — `popularity` sıralı liste; yaklaşık 23 saatte bir yeniden hesaplanır */
  DISCOVER_POPULAR: 23 * 3600,

  /** All-songs list & facets — stale after 10 minutes */
  SONGS_LIST: 600,
  SONGS_FACETS: 600,

  /** Filtered song queries — stale after 10 minutes */
  SONGS_FILTERED: 600,
} as const;

/* ------------------------------------------------------------------ */
/*  Filter hash — deterministic key for filter combinations            */
/* ------------------------------------------------------------------ */

export function filterHash(params: {
  harf?: string;
  sanatci?: string;
  ton?: string;
  zorluk?: string;
}): string {
  const parts = [
    params.harf ?? "_",
    params.sanatci ?? "_",
    params.ton ?? "_",
    params.zorluk ?? "_",
  ];
  return parts.join("|");
}
