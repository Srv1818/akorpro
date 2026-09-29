import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/client";
import { relId, toEpochMs } from "@/lib/payload/serialize";
import type { Song as SongRow } from "@/payload-types";
import { sanitizeTextContent, sanitizePlainField } from "@/lib/security/sanitize";
import {
  songTag,
  songsArtistTag,
  songsFilteredTag,
  filterHash,
  TAGS,
  TTL,
} from "@/lib/cache/tags";
import type { SongDoc } from "@/lib/types/firestore";
import type { Difficulty } from "@/lib/types/content";

/**
 * Şarkı okuma katmanı — Payload Local API.
 *
 * Dışa aktarılan imzalar değişmedi; çağıran sayfalar Firestore ve Directus
 * dönemlerinde olduğu gibi çalışmaya devam ediyor.
 *
 * Directus sürümüne göre fark: HTTP isteği yok. Sorgular aynı süreç içinde
 * Postgres'e gidiyor, yani her okuma bir ağ gidiş-dönüşü tasarruf ediyor.
 * Filtrelerin tamamı hâlâ veritabanında; bellek içi filtrelemeye dönülmedi.
 */

type Song = SongDoc & { id: string };

type CachedSongLookup = { found: true; song: Song } | { found: false };

const APPROVED: Where = { moderationStatus: { equals: "approved" } };

/** Payload belgesi → uygulama biçimi. */
export function mapSong(row: SongRow): Song {
  return {
    id: String(row.id),
    title: sanitizePlainField(row.title),
    slug: row.slug ?? "",
    artistId: relId(row.artist),
    artistSlug: row.artistSlug ?? "",
    artistName: sanitizePlainField(row.artistName ?? ""),
    chordBody: sanitizeTextContent(row.chordBody),
    originalKey: row.originalKey,
    difficulty: row.difficulty as Difficulty,
    ...(row.keyMode ? { keyMode: row.keyMode } : {}),
    ...(row.gamlarScaleId ? { gamlarScaleId: row.gamlarScaleId } : {}),
    genre: row.genre,
    ...(row.tempo ? { tempo: row.tempo } : {}),
    ...(row.timeSignature ? { timeSignature: row.timeSignature } : {}),
    ...(row.tuning ? { tuning: row.tuning } : {}),
    ...(row.capo != null ? { capo: row.capo } : {}),
    moderationStatus: row.moderationStatus,
    ...(row.copyrightSource
      ? { copyrightSource: sanitizePlainField(row.copyrightSource) }
      : {}),
    showHarmonyDetails: Boolean(row.showHarmonyDetails),
    ...(row.harmonyDetailsNotes
      ? { harmonyDetailsNotes: sanitizeTextContent(row.harmonyDetailsNotes) }
      : {}),
    createdAt: toEpochMs(row.createdAt),
    updatedAt: toEpochMs(row.updatedAt),
  } as Song;
}

function isDifficulty(v: string): v is Difficulty {
  return v === "kolay" || v === "orta" || v === "zor";
}

/** Türkçe alfabetik sıra — Postgres collation'ına güvenmeyip burada uygularız. */
function byTitleTr(a: Song, b: Song): number {
  return a.title.localeCompare(b.title, "tr");
}

/** Payload sayfalama yapar; "hepsi" için limit 0 verilir. */
const ALL = 0;

/* ------------------------------------------------------------------ */
/*  Ham (önbelleksiz) sorgular                                         */
/* ------------------------------------------------------------------ */

async function _getSongBySlugs(artistSlug: string, songSlug: string): Promise<Song | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: { and: [APPROVED, { artistSlug: { equals: artistSlug } }, { slug: { equals: songSlug } }] },
    limit: 1,
    depth: 0,
  });
  return docs[0] ? mapSong(docs[0]) : null;
}

async function _getSongsByArtist(artistSlug: string): Promise<Song[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: { and: [APPROVED, { artistSlug: { equals: artistSlug } }] },
    limit: ALL,
    depth: 0,
  });
  return docs.map(mapSong).sort(byTitleTr);
}

export type SongFilterParams = {
  harf?: string;
  sanatci?: string;
  ton?: string;
  zorluk?: string;
  sarkiAdi?: string;
  mod?: string;
  tur?: string;
  olcu?: string;
  bpm?: string;
};

async function _getFilteredSongs(params: SongFilterParams): Promise<Song[]> {
  const conditions: Where[] = [APPROVED];

  if (params.sanatci) conditions.push({ artistSlug: { equals: params.sanatci } });
  if (params.ton) conditions.push({ originalKey: { equals: params.ton } });
  if (params.zorluk && isDifficulty(params.zorluk)) {
    conditions.push({ difficulty: { equals: params.zorluk } });
  }
  // Harf filtresi yazma anında hesaplanan indeksli alandan; Payload'da
  // "ile başlar" operatörü yok ve bellek içi filtrelemeye dönmek istemiyoruz.
  if (params.harf) {
    conditions.push({ titleInitial: { equals: params.harf.toLocaleUpperCase("tr") } });
  }
  // Payload'ın `like`'ı Postgres'te ILIKE'a çevrilir — büyük/küçük harf duyarsız.
  if (params.sarkiAdi) conditions.push({ title: { like: params.sarkiAdi } });
  if (params.mod) conditions.push({ keyMode: { equals: params.mod } });
  if (params.tur) conditions.push({ genre: { equals: params.tur } });
  if (params.olcu) conditions.push({ timeSignature: { equals: params.olcu } });
  if (params.bpm && !Number.isNaN(Number(params.bpm))) {
    conditions.push({ tempo: { equals: params.bpm } });
  }

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: { and: conditions },
    limit: ALL,
    depth: 0,
  });

  return docs.map(mapSong).sort(byTitleTr);
}

async function _getAllApprovedSongs(): Promise<Song[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: APPROVED,
    limit: ALL,
    depth: 0,
  });
  return docs.map(mapSong);
}

async function _getFilterFacetOptions() {
  const songs = await _getAllApprovedSongs();

  const artistMap = new Map<string, string>();
  const keysSet = new Set<string>();
  const genresSet = new Set<string>();
  const timeSignaturesSet = new Set<string>();

  for (const s of songs) {
    artistMap.set(s.artistSlug, s.artistName);
    keysSet.add(s.originalKey);
    if (s.genre) genresSet.add(s.genre);
    if (s.timeSignature) timeSignaturesSet.add(s.timeSignature);
  }

  const artists = [...artistMap.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return {
    artists,
    keys: [...keysSet].sort(),
    difficulties: ["kolay", "orta", "zor"] as const,
    letters: "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split(""),
    genres: [...genresSet].sort(),
    timeSignatures: [...timeSignaturesSet].sort(),
  };
}

/* ------------------------------------------------------------------ */
/*  Önbellekli genel API                                               */
/* ------------------------------------------------------------------ */

/** Tek şarkı — slug çifti ile (ISR cached; throw yerine tagged result döner). */
export function getSongBySlugs(artistSlug: string, songSlug: string) {
  return unstable_cache(
    async (): Promise<CachedSongLookup> => {
      const song = await _getSongBySlugs(artistSlug, songSlug);
      if (song === null) return { found: false };
      return { found: true, song };
    },
    ["song-by-slugs-v3", artistSlug, songSlug],
    {
      tags: [songTag(artistSlug, songSlug), TAGS.SONGS_ALL],
      revalidate: TTL.SONG_DETAIL,
    },
  )().then((cached) => (cached.found ? cached.song : null));
}

/** Cache-bypass: geçici negatif cache / soğuk başlangıç durumlarında ikinci doğrulama için. */
export async function getSongBySlugsUncached(
  artistSlug: string,
  songSlug: string,
): Promise<Song | null> {
  return _getSongBySlugs(artistSlug, songSlug);
}

/** Tek şarkı — ID ile (uncached, discover resolver uses its own cache) */
export async function getSongById(songId: string): Promise<Song | null> {
  try {
    const payload = await getPayloadClient();
    const row = await payload.findByID({ collection: "songs", id: songId, depth: 0 });
    return row ? mapSong(row) : null;
  } catch {
    // Bulunamayan kayıt Payload'da NotFound fırlatır — çağıranlar null bekliyor.
    return null;
  }
}

/** Birden çok şarkıyı ID ile getir (keşfet blokları için — uncached, caller caches) */
export async function getSongsByIds(songIds: string[]): Promise<Song[]> {
  if (songIds.length === 0) return [];

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "songs",
    where: { and: [APPROVED, { id: { in: songIds } }] },
    limit: ALL,
    depth: 0,
  });

  // Çağıran sıralamayı kendisi belirliyor (keşfet blok sırası) — istenen id sırasını koru.
  const byId = new Map(docs.map((r) => [String(r.id), r]));
  return songIds.flatMap((id) => {
    const row = byId.get(String(id));
    return row ? [mapSong(row)] : [];
  });
}

/** Sanatçının tüm şarkıları (ISR cached) */
export function getSongsByArtist(artistSlug: string) {
  return unstable_cache(
    () => _getSongsByArtist(artistSlug),
    ["songs-by-artist", artistSlug],
    {
      tags: [songsArtistTag(artistSlug), TAGS.SONGS_ALL],
      revalidate: TTL.SONGS_LIST,
    },
  )();
}

/** Tüm onaylı şarkılar — filtreleme desteği ile (ISR cached) */
export function getFilteredSongs(params: SongFilterParams) {
  const hash = filterHash(params);
  return unstable_cache(
    () => _getFilteredSongs(params),
    ["songs-filtered", hash],
    {
      tags: [songsFilteredTag(hash), TAGS.SONGS_ALL],
      revalidate: TTL.SONGS_FILTERED,
    },
  )();
}

/** Tüm onaylı şarkılar — generateStaticParams için (ISR cached) */
export function getAllApprovedSongs() {
  return unstable_cache(
    _getAllApprovedSongs,
    ["songs-all-approved"],
    {
      tags: [TAGS.SONGS_ALL],
      revalidate: TTL.SONGS_LIST,
    },
  )();
}

/** Filtre facet seçeneklerini döndür (ISR cached) */
export function getFilterFacetOptions() {
  return unstable_cache(
    _getFilterFacetOptions,
    ["songs-filter-facets"],
    {
      tags: [TAGS.SONGS_FACETS, TAGS.SONGS_ALL],
      revalidate: TTL.SONGS_FACETS,
    },
  )();
}
