import { aggregate, createItem, deleteItem, readItem, readItems, updateItem } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { mapSong } from "./songs";
import type { SongDoc, ModerationStatus } from "@/lib/types/firestore";

/**
 * Şarkı yazma işlemleri — Directus.
 *
 * Denetim izi Directus Activity Log'una devredildi; `actorUid` parametreleri
 * imza uyumu için duruyor (Faz 5'te admin route'ları ile birlikte silinecek).
 */

type Song = SongDoc & { id: string };

type SongInput = Omit<SongDoc, "schemaVersion" | "createdAt" | "updatedAt" | "moderationStatus"> & {
  moderationStatus?: ModerationStatus;
};

/** camelCase girdi → Directus sütunları. Yalnız verilen alanlar gönderilir. */
function toRow(input: Partial<SongInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.artistId !== undefined) row.artist = input.artistId;
  if (input.artistSlug !== undefined) row.artist_slug = input.artistSlug;
  if (input.artistName !== undefined) row.artist_name = input.artistName;
  if (input.chordBody !== undefined) row.chord_body = input.chordBody;
  if (input.originalKey !== undefined) row.original_key = input.originalKey;
  if (input.difficulty !== undefined) row.difficulty = input.difficulty;
  if (input.keyMode !== undefined) row.key_mode = input.keyMode;
  if (input.gamlarScaleId !== undefined) row.gamlar_scale_id = input.gamlarScaleId;
  if (input.genre !== undefined) row.genre = input.genre;
  if (input.tempo !== undefined) row.tempo = input.tempo == null ? null : String(input.tempo);
  if (input.timeSignature !== undefined) row.time_signature = input.timeSignature;
  if (input.tuning !== undefined) row.tuning = input.tuning;
  if (input.capo !== undefined) row.capo = input.capo;
  if (input.moderationStatus !== undefined) row.moderation_status = input.moderationStatus;
  if (input.copyrightSource !== undefined) row.copyright_source = input.copyrightSource;
  if (input.popularity !== undefined) row.popularity = input.popularity;
  if (input.showHarmonyDetails !== undefined) row.show_harmony_details = input.showHarmonyDetails;
  if (input.harmonyDetailsNotes !== undefined) {
    row.harmony_details_notes = input.harmonyDetailsNotes;
  }
  // contributorIds artık song_contributors junction'ında — burada yok sayılır.
  return row;
}

export async function createSong(input: SongInput, _actorUid: string): Promise<string> {
  const row = await directus().request(
    createItem("songs", {
      ...toRow(input),
      moderation_status: input.moderationStatus ?? "approved",
    } as never),
  );
  return row.id;
}

export async function updateSong(
  songId: string,
  updates: Partial<SongInput>,
  _actorUid: string,
): Promise<void> {
  await directus().request(updateItem("songs", songId, toRow(updates) as never));
}

export async function deleteSong(songId: string, _actorUid: string): Promise<void> {
  await directus().request(deleteItem("songs", songId));
}

export async function moderateSong(
  songId: string,
  newStatus: ModerationStatus,
  _actorUid: string,
  _note?: string,
): Promise<void> {
  await directus().request(
    updateItem("songs", songId, { moderation_status: newStatus } as never),
  );
}

export async function getPendingSongs(): Promise<Song[]> {
  const rows = await directus().request(
    readItems("songs", {
      filter: { moderation_status: { _eq: "pending" } },
      sort: ["-created_at"],
      limit: -1,
    }),
  );
  return rows.map(mapSong);
}

export async function getAllSongsAdmin(): Promise<Song[]> {
  const rows = await directus().request(
    readItems("songs", { sort: ["title"], limit: -1 }),
  );
  return rows.map(mapSong);
}

async function countSongs(filter?: Record<string, unknown>): Promise<number> {
  const rows = (await directus().request(
    aggregate("songs", {
      aggregate: { count: "*" },
      ...(filter ? { query: { filter } } : {}),
    }),
  )) as unknown as { count: string | number }[];

  return Number(rows[0]?.count) || 0;
}

export async function getAllSongsCount(): Promise<number> {
  return countSongs();
}

export async function getPendingSongsCount(): Promise<number> {
  return countSongs({ moderation_status: { _eq: "pending" } });
}

export async function getSongByIdAdmin(songId: string): Promise<Song | null> {
  try {
    const row = await directus().request(readItem("songs", songId));
    return row ? mapSong(row) : null;
  } catch {
    return null;
  }
}
