import { getAdminFirestore } from "@/lib/firebase/admin";
import { sanitizeTextContent, sanitizePlainField } from "@/lib/security/sanitize";
import type { SongDoc } from "@/lib/types/firestore";
import type { Difficulty } from "@/lib/types/content";

const COLLECTION = "songs";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

function sanitizeSong(raw: SongDoc & { id: string }): SongDoc & { id: string } {
  return {
    ...raw,
    title: sanitizePlainField(raw.title),
    artistName: sanitizePlainField(raw.artistName),
    chordBody: sanitizeTextContent(raw.chordBody),
    copyrightSource: raw.copyrightSource ? sanitizePlainField(raw.copyrightSource) : undefined,
  };
}

/** Tek şarkı — slug çifti ile */
export async function getSongBySlugs(artistSlug: string, songSlug: string): Promise<(SongDoc & { id: string }) | null> {
  const snap = await db()
    .collection(COLLECTION)
    .where("artistSlug", "==", artistSlug)
    .where("slug", "==", songSlug)
    .where("moderationStatus", "==", "approved")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return sanitizeSong({ id: doc.id, ...(doc.data() as SongDoc) });
}

/** Tek şarkı — ID ile */
export async function getSongById(songId: string): Promise<(SongDoc & { id: string }) | null> {
  const doc = await db().collection(COLLECTION).doc(songId).get();
  if (!doc.exists) return null;
  return sanitizeSong({ id: doc.id, ...(doc.data() as SongDoc) });
}

/** Birden çok şarkıyı ID ile getir (keşfet blokları için) */
export async function getSongsByIds(songIds: string[]): Promise<(SongDoc & { id: string })[]> {
  if (songIds.length === 0) return [];

  const refs = songIds.map((id) => db().collection(COLLECTION).doc(id));
  const snaps = await db().getAll(...refs);

  const result: (SongDoc & { id: string })[] = [];
  for (const id of songIds) {
    const snap = snaps.find((s) => s.id === id);
    if (snap?.exists) {
      result.push(sanitizeSong({ id: snap.id, ...(snap.data() as SongDoc) }));
    }
  }
  return result;
}

/** Sanatçının tüm şarkıları */
export async function getSongsByArtist(artistSlug: string): Promise<(SongDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("artistSlug", "==", artistSlug)
    .where("moderationStatus", "==", "approved")
    .orderBy("title")
    .get();

  return snap.docs.map((d) => sanitizeSong({ id: d.id, ...(d.data() as SongDoc) }));
}

/** Tüm onaylı şarkılar (filtreleme desteği ile) */
export async function getFilteredSongs(params: {
  harf?: string;
  sanatci?: string;
  ton?: string;
  zorluk?: string;
}): Promise<(SongDoc & { id: string })[]> {
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
  let results = snap.docs.map((d) => sanitizeSong({ id: d.id, ...(d.data() as SongDoc) }));

  if (params.harf) {
    const h = params.harf.toUpperCase();
    results = results.filter((s) => s.title.toUpperCase().startsWith(h));
  }

  return results;
}

/** Tüm onaylı şarkılar — generateStaticParams için */
export async function getAllApprovedSongs(): Promise<(SongDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("moderationStatus", "==", "approved")
    .get();

  return snap.docs.map((d) => sanitizeSong({ id: d.id, ...(d.data() as SongDoc) }));
}

/** Filtre facet seçeneklerini döndür */
export async function getFilterFacetOptions() {
  const songs = await getAllApprovedSongs();

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

function isDifficulty(v: string): v is Difficulty {
  return v === "kolay" || v === "orta" || v === "zor";
}
