import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getPayloadClient } from "@/lib/payload/client";
import { relId } from "@/lib/payload/serialize";
import { sanitizePlainField } from "@/lib/security/sanitize";
import { getSongsByIds } from "./songs";
import { TAGS, TTL } from "@/lib/cache/tags";
import type { Song as SongRow } from "@/payload-types";
import type { SongDoc } from "@/lib/types/firestore";
import type { SongSummary, Difficulty } from "@/lib/types/content";

/**
 * Keşfet blokları — Payload Local API.
 *
 * Yapı aynı: `discover-sections` + sıralı `discover-items`. Admin panelinde
 * sürükle-bırak ile yönetilebiliyor.
 *
 * Hata durumunda blok boş döner — ana sayfa tek bir blok yüzünden çökmez.
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

const APPROVED: Where = { moderationStatus: { equals: "approved" } };

/**
 * Kart için gereken alanlar. `select` ile `chordBody` gibi ağır sütunlar
 * sorguya hiç girmiyor — Directus'taki `fields` kısıtlamasının karşılığı.
 */
const SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  artistSlug: true,
  artistName: true,
  originalKey: true,
  difficulty: true,
} as const;

type SummaryRow = Pick<
  SongRow,
  "id" | "title" | "slug" | "artistSlug" | "artistName" | "originalKey" | "difficulty"
>;

function rowToSummary(r: SummaryRow): SongSummary {
  return {
    id: String(r.id),
    title: sanitizePlainField(r.title),
    slug: r.slug ?? "",
    artistSlug: r.artistSlug ?? "",
    artistName: sanitizePlainField(r.artistName ?? ""),
    originalKey: r.originalKey,
    difficulty: r.difficulty as Difficulty,
  };
}

/**
 * Son 30 günde en çok görüntülenen onaylı şarkılar.
 *
 * Eskiden elle girilen `popularity` alanına göre sıralanıyordu; editörün
 * verdiği not neyi etkiliyor belli olmadığı için kaldırıldı. Artık gerçek
 * tıklama sayılıyor (`song_views`, günlük kova).
 *
 * Kayan 30 günlük pencere bilinçli: toplam sayaç kullanılsaydı ilk giren
 * şarkılar sonsuza kadar tepede kalırdı.
 *
 * Ham SQL, çünkü Payload Local API'si gruplu toplama yapamıyor; şarkı başına
 * ayrı sorgu N+1 olurdu.
 *
 * Henüz hiç görüntülenme yoksa liste boş kalmasın diye en yeni şarkılarla
 * tamamlanıyor — sitenin ilk günlerinde ana sayfa boş görünmesin.
 */
async function popularSongs(): Promise<SongSummary[]> {
  const payload = await getPayloadClient();
  const db = payload.db.drizzle as NodePgDatabase<Record<string, never>>;

  const result = await db.execute(sql`
    SELECT s.id
      FROM songs s
      JOIN song_views v ON v.song_id = s.id
     WHERE s.moderation_status = 'approved'
       AND v.day >= to_char(now() - interval '30 days', 'YYYY-MM-DD')
     GROUP BY s.id
     ORDER BY SUM(v.count) DESC, MAX(s.created_at) DESC
     LIMIT ${DISCOVER_TARGET_COUNT}
  `);

  const rankedIds = ((result.rows ?? []) as { id: number | string }[]).map((r) => String(r.id));

  const ranked = rankedIds.length > 0 ? await songSummariesByIds(rankedIds) : [];
  if (ranked.length >= DISCOVER_TARGET_COUNT) return ranked;

  // Görüntülenmesi olmayanlarla tamamla.
  const seen = new Set(ranked.map((r) => r.id));
  const { docs } = await payload.find({
    collection: "songs",
    where: APPROVED,
    sort: "-createdAt",
    limit: DISCOVER_TARGET_COUNT,
    depth: 0,
    select: SUMMARY_SELECT,
  });

  for (const row of docs as SummaryRow[]) {
    if (ranked.length >= DISCOVER_TARGET_COUNT) break;
    if (seen.has(String(row.id))) continue;
    ranked.push(rowToSummary(row));
  }
  return ranked;
}

/** Verilen id sırasını koruyarak kart alanlarını getirir. */
async function songSummariesByIds(ids: string[]): Promise<SongSummary[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: { and: [APPROVED, { id: { in: ids } }] },
    limit: ids.length,
    depth: 0,
    select: SUMMARY_SELECT,
  });
  const byId = new Map((docs as SummaryRow[]).map((d) => [String(d.id), d]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [rowToSummary(row)] : [];
  });
}

/** En yeni onaylı şarkılar. */
async function newSongs(): Promise<SongSummary[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: APPROVED,
    sort: "-createdAt",
    limit: DISCOVER_TARGET_COUNT,
    depth: 0,
    select: SUMMARY_SELECT,
  });
  return (docs as SummaryRow[]).map(rowToSummary);
}

/** Elle seçilmiş blok — sıralama `discover-items.position`'dan gelir. */
async function getFeaturedCurated(): Promise<SongSummary[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "discover-items",
    where: { "section.key": { equals: "featured" } },
    sort: "position",
    limit: MAX_CURATED_IDS_READ,
    depth: 0,
  });

  const songIds = docs.map((i) => relId(i.song)).filter(Boolean);

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
/*  Önbellekli genel API                                               */
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
