import { unstable_cache } from "next/cache";
import { readItem, readItems } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { toEpochMs } from "@/lib/directus/serialize";
import type { SongRow } from "@/lib/directus/schema";
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
 * Şarkı okuma katmanı — Directus.
 *
 * Dışa aktarılan imzalar Firestore sürümüyle aynı; çağıran sayfalar değişmedi.
 *
 * Firestore'a özgü olup burada gereksizleşen ve **kaldırılan** kısımlar:
 * - Composite-index (`FAILED_PRECONDITION` / kod 9) yedek sorguları — Postgres
 *   keyfi `WHERE` kombinasyonlarını indekssiz de yürütür.
 * - Slug varyantı taramaları (Türkçe normalize edip koleksiyonu gezen fallback'ler) —
 *   greenfield şemada slug'lar tek biçimli.
 * - Soğuk başlatma retry sarmalayıcısı — Directus HTTP'si için karşılığı yok.
 * Bellek içi filtreleme de sorguya taşındı; artık tüm koşullar veritabanında.
 */

type Song = SongDoc & { id: string };

type CachedSongLookup = { found: true; song: Song } | { found: false };

const APPROVED = { moderation_status: { _eq: "approved" } } as const;

/** Directus satırı → uygulama biçimi. `admin-songs.ts` de aynı eşlemeyi kullanır. */
export function mapSong(row: SongRow): Song {
  const artistId = typeof row.artist === "string" ? row.artist : row.artist?.id;

  return {
    id: row.id,
    title: sanitizePlainField(row.title),
    slug: row.slug,
    artistId,
    artistSlug: row.artist_slug,
    artistName: sanitizePlainField(row.artist_name),
    chordBody: sanitizeTextContent(row.chord_body),
    originalKey: row.original_key,
    difficulty: row.difficulty,
    ...(row.key_mode ? { keyMode: row.key_mode } : {}),
    ...(row.gamlar_scale_id ? { gamlarScaleId: row.gamlar_scale_id } : {}),
    genre: row.genre,
    ...(row.tempo ? { tempo: row.tempo } : {}),
    ...(row.time_signature ? { timeSignature: row.time_signature } : {}),
    ...(row.tuning ? { tuning: row.tuning } : {}),
    ...(row.capo != null ? { capo: row.capo } : {}),
    moderationStatus: row.moderation_status,
    ...(row.copyright_source
      ? { copyrightSource: sanitizePlainField(row.copyright_source) }
      : {}),
    ...(row.popularity != null ? { popularity: row.popularity } : {}),
    showHarmonyDetails: row.show_harmony_details,
    ...(row.harmony_details_notes
      ? { harmonyDetailsNotes: sanitizeTextContent(row.harmony_details_notes) }
      : {}),
    createdAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

function isDifficulty(v: string): v is Difficulty {
  return v === "kolay" || v === "orta" || v === "zor";
}

/** Türkçe alfabetik sıra — Postgres collation'ına güvenmeyip burada uygularız. */
function byTitleTr(a: Song, b: Song): number {
  return a.title.localeCompare(b.title, "tr");
}

/* ------------------------------------------------------------------ */
/*  Raw (uncached) queries                                             */
/* ------------------------------------------------------------------ */

async function _getSongBySlugs(artistSlug: string, songSlug: string): Promise<Song | null> {
  const rows = await directus().request(
    readItems("songs", {
      filter: {
        _and: [APPROVED, { artist_slug: { _eq: artistSlug } }, { slug: { _eq: songSlug } }],
      },
      limit: 1,
    }),
  );

  return rows[0] ? mapSong(rows[0]) : null;
}

async function _getSongsByArtist(artistSlug: string): Promise<Song[]> {
  const rows = await directus().request(
    readItems("songs", {
      filter: { _and: [APPROVED, { artist_slug: { _eq: artistSlug } }] },
      limit: -1,
    }),
  );

  return rows.map(mapSong).sort(byTitleTr);
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
  const conditions: Record<string, unknown>[] = [APPROVED];

  if (params.sanatci) conditions.push({ artist_slug: { _eq: params.sanatci } });
  if (params.ton) conditions.push({ original_key: { _eq: params.ton } });
  if (params.zorluk && isDifficulty(params.zorluk)) {
    conditions.push({ difficulty: { _eq: params.zorluk } });
  }
  // Baş harf ve ad araması büyük/küçük harf duyarsız — eski bellek içi davranışın karşılığı.
  if (params.harf) conditions.push({ title: { _istarts_with: params.harf } });
  if (params.sarkiAdi) conditions.push({ title: { _icontains: params.sarkiAdi } });
  if (params.mod) conditions.push({ key_mode: { _eq: params.mod } });
  if (params.tur) conditions.push({ genre: { _eq: params.tur } });
  if (params.olcu) conditions.push({ time_signature: { _eq: params.olcu } });
  if (params.bpm && !Number.isNaN(Number(params.bpm))) {
    conditions.push({ tempo: { _eq: params.bpm } });
  }

  const rows = await directus().request(
    readItems("songs", { filter: { _and: conditions }, limit: -1 }),
  );

  return rows.map(mapSong).sort(byTitleTr);
}

async function _getAllApprovedSongs(): Promise<Song[]> {
  const rows = await directus().request(
    readItems("songs", { filter: APPROVED, limit: -1 }),
  );
  return rows.map(mapSong);
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
/*  Cached public API                                                  */
/* ------------------------------------------------------------------ */

/** Tek şarkı — slug çifti ile (ISR cached; throw yerine tagged result döner, build log gürültüsü azalır). */
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
    const row = await directus().request(readItem("songs", songId));
    return row ? mapSong(row) : null;
  } catch {
    // Bulunamayan kayıt Directus'ta 403/404 ile döner — çağıranlar null bekliyor.
    return null;
  }
}

/** Birden çok şarkıyı ID ile getir (keşfet blokları için — uncached, caller caches) */
export async function getSongsByIds(songIds: string[]): Promise<Song[]> {
  if (songIds.length === 0) return [];

  const rows = await directus().request(
    readItems("songs", {
      filter: { _and: [APPROVED, { id: { _in: songIds } }] },
      limit: -1,
    }),
  );

  // Çağıran sıralamayı kendisi belirliyor (keşfet blok sırası) — istenen id sırasını koru.
  const byId = new Map(rows.map((r) => [r.id, r]));
  return songIds.flatMap((id) => {
    const row = byId.get(id);
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
