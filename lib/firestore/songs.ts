import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { sanitizeTextContent, sanitizePlainField } from "@/lib/security/sanitize";
import { serializeDoc } from "@/lib/firestore/serialize";
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

const COLLECTION = "songs";

/** Soğuk başlatma / geçici hatalarda sorguyu birkaç kez dene (önbelleğe yanlış null yazılmasını azaltır). */
async function withFirestoreRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const delaysMs = [0, 300, 700];
  let last: unknown;
  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i] > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[i]));
    }
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.warn(`[songs] ${label} deneme ${i + 1}/${delaysMs.length}`, e);
    }
  }
  throw last;
}

type CachedSongLookup =
  | { found: true; song: SongDoc & { id: string } }
  | { found: false };

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

function readSongDoc(d: FirebaseFirestore.DocumentSnapshot): SongDoc & { id: string } {
  return serializeDoc({ id: d.id, ...(d.data() as SongDoc) });
}

function sanitizeSong(raw: SongDoc & { id: string }): SongDoc & { id: string } {
  return {
    ...raw,
    title: sanitizePlainField(raw.title),
    artistName: sanitizePlainField(raw.artistName),
    chordBody: sanitizeTextContent(raw.chordBody),
    copyrightSource: raw.copyrightSource ? sanitizePlainField(raw.copyrightSource) : undefined,
    harmonyDetailsNotes: raw.harmonyDetailsNotes
      ? sanitizeTextContent(raw.harmonyDetailsNotes)
      : undefined,
  };
}

function isDifficulty(v: string): v is Difficulty {
  return v === "kolay" || v === "orta" || v === "zor";
}

/** gRPC 9 + olası string kodları (Admin SDK sürümleri arası fark). */
function isFailedPrecondition(err: unknown): boolean {
  const e = err as { code?: number | string; message?: string };
  if (e.code === 9) return true;
  if (e.code === "FAILED_PRECONDITION" || e.code === "failed-precondition") return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("requires an index") || msg.includes("composite index");
}

function normalizeSlugMatch(s: string): string {
  return s.trim().normalize("NFKC").toLocaleLowerCase("tr-TR");
}

/** URL’deki slug ile belgedeki slug’u eşle (Türkçe büyük/küçük harf, boşluk, birleşik karakter). */
function docSlugMatchesUrl(data: SongDoc, urlSongSlug: string): boolean {
  const urlNorm = normalizeSlugMatch(urlSongSlug);
  const primary = normalizeSlugMatch(data.slug ?? "");
  if (primary === urlNorm) return true;
  const legacy = (data as SongDoc & { songSlug?: string }).songSlug;
  if (typeof legacy === "string" && normalizeSlugMatch(legacy) === urlNorm) return true;
  return false;
}

/**
 * Birincil eşitlik sorgusu boş / indeks hatası verdiğinde: sanatçıdaki onaylı şarkıları çek, slug’u bellek içi eşle.
 * Listede görünüp detayda 404 olan kayıtlar (slug varyantı, indeks sapması) için.
 */
async function _findSongByArtistSlugFallback(
  artistSlug: string,
  songSlug: string,
): Promise<(SongDoc & { id: string }) | null> {
  const snap = await db()
    .collection(COLLECTION)
    .where("artistSlug", "==", artistSlug)
    .where("moderationStatus", "==", "approved")
    .get();
  const doc = snap.docs.find((d) => docSlugMatchesUrl(d.data() as SongDoc, songSlug));
  if (!doc) return null;
  return sanitizeSong(readSongDoc(doc));
}

/**
 * Birincil sorgu boş + sanatçı yedeği boş: URL’deki sanatçı slug’ı DB’de farklı olabilir.
 * `slug` alanı URL ile birebir eşleşen onaylı kayıtlarda sanatçıyı gevşek karşılaştır veya tekil kaydı kabul et.
 * (Tam koleksiyon taraması yok — tek alan `slug` eşitlik sorgusu.)
 */
async function _findSongByStoredSlugFallback(
  artistSlug: string,
  songSlug: string,
): Promise<(SongDoc & { id: string }) | null> {
  const snap = await db().collection(COLLECTION).where("slug", "==", songSlug).limit(25).get();
  const approved = snap.docs.filter((d) => (d.data() as SongDoc).moderationStatus === "approved");
  if (approved.length === 0) return null;
  const normArtist = normalizeSlugMatch(artistSlug);
  const byArtist = approved.filter(
    (d) => normalizeSlugMatch((d.data() as SongDoc).artistSlug) === normArtist,
  );
  if (byArtist.length === 1) {
    return sanitizeSong(readSongDoc(byArtist[0]));
  }
  if (approved.length === 1 && byArtist.length === 0) {
    console.warn("[songs] Bu slug için tek onaylı şarkı var; URL sanatçı slug’ı belgeden farklı", {
      urlArtistSlug: artistSlug,
      docArtistSlug: (approved[0].data() as SongDoc).artistSlug,
      songSlug,
    });
    return sanitizeSong(readSongDoc(approved[0]));
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Raw (uncached) queries                                             */
/* ------------------------------------------------------------------ */

async function _querySongBySlugs(artistSlug: string, songSlug: string): Promise<(SongDoc & { id: string }) | null> {
  try {
    const snap = await db()
      .collection(COLLECTION)
      .where("artistSlug", "==", artistSlug)
      .where("slug", "==", songSlug)
      .where("moderationStatus", "==", "approved")
      .limit(1)
      .get();

    if (!snap.empty) {
      return sanitizeSong(readSongDoc(snap.docs[0]));
    }
    const byArtist = await _findSongByArtistSlugFallback(artistSlug, songSlug);
    if (byArtist) return byArtist;
    return await _findSongByStoredSlugFallback(artistSlug, songSlug);
  } catch (err: unknown) {
    if (isFailedPrecondition(err)) {
      console.warn("[songs] Slug sorgusu indeks/önkoşul hatası, sanatçı bazlı yedek sorguya geçiliyor", err);
      const byArtist = await _findSongByArtistSlugFallback(artistSlug, songSlug);
      if (byArtist) return byArtist;
      return await _findSongByStoredSlugFallback(artistSlug, songSlug);
    }
    throw err;
  }
}

async function _getSongBySlugs(artistSlug: string, songSlug: string): Promise<(SongDoc & { id: string }) | null> {
  return withFirestoreRetry(`song:${artistSlug}/${songSlug}`, () => _querySongBySlugs(artistSlug, songSlug));
}

async function _getSongsByArtist(artistSlug: string): Promise<(SongDoc & { id: string })[]> {
  try {
    const snap = await db()
      .collection(COLLECTION)
      .where("artistSlug", "==", artistSlug)
      .where("moderationStatus", "==", "approved")
      .orderBy("title")
      .get();
    return snap.docs.map((d) => sanitizeSong(readSongDoc(d)));
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 9) {
      console.warn("[songs] Composite index missing for artist query, falling back to in-memory sort");
      const snap = await db()
        .collection(COLLECTION)
        .where("artistSlug", "==", artistSlug)
        .where("moderationStatus", "==", "approved")
        .get();
      return snap.docs
        .map((d) => sanitizeSong(readSongDoc(d)))
        .sort((a, b) => a.title.localeCompare(b.title, "tr"));
    }
    throw err;
  }
}

async function _getFilteredSongs(params: {
  harf?: string;
  sanatci?: string;
  ton?: string;
  zorluk?: string;
}): Promise<(SongDoc & { id: string })[]> {
  let results: (SongDoc & { id: string })[];

  try {
    let q: FirebaseFirestore.Query = db()
      .collection(COLLECTION)
      .where("moderationStatus", "==", "approved");

    if (params.sanatci) {
      q = q.where("artistSlug", "==", params.sanatci);
    }
    if (params.ton) {
      q = q.where("originalKey", "==", params.ton);
    }
    if (params.zorluk && isDifficulty(params.zorluk)) {
      q = q.where("difficulty", "==", params.zorluk);
    }

    q = q.orderBy("title");
    const snap = await q.get();
    results = snap.docs.map((d) => sanitizeSong(readSongDoc(d)));
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 9) {
      console.warn("[songs] Composite index missing, falling back to in-memory filter+sort");
      const allSnap = await db()
        .collection(COLLECTION)
        .where("moderationStatus", "==", "approved")
        .get();
      results = allSnap.docs
        .map((d) => sanitizeSong(readSongDoc(d)))
        .filter((s) => {
          if (params.sanatci && s.artistSlug !== params.sanatci) return false;
          if (params.ton && s.originalKey !== params.ton) return false;
          if (params.zorluk && isDifficulty(params.zorluk) && s.difficulty !== params.zorluk) return false;
          return true;
        })
        .sort((a, b) => a.title.localeCompare(b.title, "tr"));
    } else {
      throw err;
    }
  }

  if (params.harf) {
    const h = params.harf.toUpperCase();
    results = results.filter((s) => s.title.toUpperCase().startsWith(h));
  }

  return results;
}

async function _getAllApprovedSongs(): Promise<(SongDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("moderationStatus", "==", "approved")
    .get();

  return snap.docs.map((d) => sanitizeSong(readSongDoc(d)));
}

async function _getFilterFacetOptions() {
  const songs = await _getAllApprovedSongs();

  const artistMap = new Map<string, string>();
  const keysSet = new Set<string>();

  for (const s of songs) {
    artistMap.set(s.artistSlug, s.artistName);
    keysSet.add(s.originalKey);
  }

  const artists = [...artistMap.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return {
    artists,
    keys: [...keysSet].sort(),
    difficulties: ["kolay", "orta", "zor"] as const,
    letters: "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split(""),
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
): Promise<(SongDoc & { id: string }) | null> {
  return _getSongBySlugs(artistSlug, songSlug);
}

/** Tek şarkı — ID ile (uncached, discover resolver uses its own cache) */
export async function getSongById(songId: string): Promise<(SongDoc & { id: string }) | null> {
  const doc = await db().collection(COLLECTION).doc(songId).get();
  if (!doc.exists) return null;
  return sanitizeSong(readSongDoc(doc));
}

/** Birden çok şarkıyı ID ile getir (keşfet blokları için — uncached, caller caches) */
export async function getSongsByIds(songIds: string[]): Promise<(SongDoc & { id: string })[]> {
  if (songIds.length === 0) return [];

  const refs = songIds.map((id) => db().collection(COLLECTION).doc(id));
  const snaps = await db().getAll(...refs);

  const result: (SongDoc & { id: string })[] = [];
  for (const id of songIds) {
    const snap = snaps.find((s) => s.id === id);
    if (snap?.exists) {
      const data = readSongDoc(snap);
      if (data.moderationStatus !== "approved") continue;
      result.push(sanitizeSong(data));
    }
  }
  return result;
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
export function getFilteredSongs(params: {
  harf?: string;
  sanatci?: string;
  ton?: string;
  zorluk?: string;
}) {
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
