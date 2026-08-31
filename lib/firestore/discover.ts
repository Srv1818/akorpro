import { unstable_cache } from "next/cache";
import { readItems } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { sanitizePlainField } from "@/lib/security/sanitize";
import { getSongsByIds } from "./songs";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { SongRow } from "@/lib/directus/schema";
import type { SongDoc } from "@/lib/types/firestore";
import type { SongSummary } from "@/lib/types/content";

/**
 * Keşfet blokları — Directus.
 *
 * `discover/{section}` dokümanındaki `songIds[]` dizisi yerine artık
 * `discover_sections` + `discover_items` (sıralı M2M) var; Directus admin'de
 * sürükle-bırak ile yönetilebiliyor (MIGRATION-PLAN.md Faz 1 kararı).
 *
 * Firestore'a özgü retry ve composite-index yedekleri kaldırıldı; sıralama
 * doğrudan sorguda yapılıyor. Hata durumunda blok boş döner — ana sayfa
 * tek bir blok yüzünden çökmez.
 */

const DISCOVER_TARGET_COUNT = 12;
const MAX_CURATED_IDS_READ = 24;

type SongWithId = SongDoc & { id: string };

function toSongSummary(s: SongWithId): SongSummary {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    artistSlug: s.artistSlug,
    artistName: s.artistName,
    originalKey: s.originalKey,
    difficulty: s.difficulty,
    coverImageUrl: s.coverImageUrl,
  };
}

const APPROVED = { moderation_status: { _eq: "approved" } } as const;

/** Kart için gereken alanlar — `chord_body` gibi ağır sütunlar çekilmez. */
const SUMMARY_FIELDS = [
  "id", "title", "slug", "artist_slug", "artist_name", "original_key", "difficulty",
] as const;

type SummaryRow = Pick<
  SongRow,
  "id" | "title" | "slug" | "artist_slug" | "artist_name" | "original_key" | "difficulty"
>;

function rowToSummary(r: SummaryRow): SongSummary {
  return {
    id: r.id,
    title: sanitizePlainField(r.title),
    slug: r.slug,
    artistSlug: r.artist_slug,
    artistName: sanitizePlainField(r.artist_name),
    originalKey: r.original_key,
    difficulty: r.difficulty,
  };
}

/** Popülerlik skoru yüksek onaylı şarkılar; eşitlikte yeni olan öne geçer. */
async function popularSongs(): Promise<SongSummary[]> {
  const rows = await directus().request(
    readItems("songs", {
      filter: APPROVED,
      sort: ["-popularity", "-created_at"],
      limit: DISCOVER_TARGET_COUNT,
      fields: SUMMARY_FIELDS,
    }),
  );
  return rows.map(rowToSummary);
}

/** En yeni onaylı şarkılar. */
async function newSongs(): Promise<SongSummary[]> {
  const rows = await directus().request(
    readItems("songs", {
      filter: APPROVED,
      sort: ["-created_at"],
      limit: DISCOVER_TARGET_COUNT,
      fields: SUMMARY_FIELDS,
    }),
  );
  return rows.map(rowToSummary);
}

/** Elle seçilmiş blok — sıralama `discover_items.position`'dan gelir. */
async function getFeaturedCurated(): Promise<SongSummary[]> {
  const items = await directus().request(
    readItems("discover_items", {
      filter: { section: { key: { _eq: "featured" } } },
      sort: ["position"],
      limit: MAX_CURATED_IDS_READ,
      fields: ["song"],
    }),
  );

  const songIds = items
    .map((i) => (typeof i.song === "string" ? i.song : i.song?.id))
    .filter((id): id is string => Boolean(id));

  const songs = await getSongsByIds(songIds);
  return songs.slice(0, DISCOVER_TARGET_COUNT).map(toSongSummary);
}

function discoverCatch(label: string, p: Promise<SongSummary[]>): Promise<SongSummary[]> {
  return p.catch((e: unknown) => {
    console.error(`[discover] ${label} yüklenemedi`, e);
    return [];
  });
}

/* ------------------------------------------------------------------ */
/*  Cached public API                                                  */
/* ------------------------------------------------------------------ */

export function getDiscoverPopular(): Promise<SongSummary[]> {
  return discoverCatch(
    "popular",
    unstable_cache(
      popularSongs,
      ["discover-popular"],
      { tags: [TAGS.DISCOVER_POPULAR], revalidate: TTL.DISCOVER_POPULAR },
    )(),
  );
}

export function getDiscoverNew(): Promise<SongSummary[]> {
  return discoverCatch(
    "new",
    unstable_cache(
      newSongs,
      ["discover-new"],
      { tags: [TAGS.DISCOVER_NEW], revalidate: TTL.DISCOVER },
    )(),
  );
}

export function getDiscoverFeatured(): Promise<SongSummary[]> {
  return discoverCatch(
    "featured",
    unstable_cache(getFeaturedCurated, ["discover-featured"], {
      tags: [TAGS.DISCOVER_FEATURED],
      revalidate: TTL.DISCOVER,
    })(),
  );
}
