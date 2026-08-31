import { aggregate, createItem, readItem, readItems, updateItem } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { toEpochMs } from "@/lib/directus/serialize";
import type { ContributionRow } from "@/lib/directus/schema";
import type { ContributionDoc } from "@/lib/types/contribution";

/**
 * Katkı kuyruğu — Directus.
 *
 * `moderationStatus` alan adı Directus'ta `status`; `contributorUid` → `contributor`
 * (directus_users FK). Dışa aktarılan imzalar ve camelCase dönüş biçimi korundu.
 *
 * Not: Bu modül sunucu token'ıyla çalışır (moderasyon ekranları ve sistem yazmaları).
 * Kullanıcının kendi katkısını göndermesi Directus izinleriyle de kısıtlı —
 * `contributor` ve `status` orada preset olarak zorlanıyor.
 */

type Contribution = ContributionDoc & { id: string };

type ContributionInput = Pick<
  ContributionDoc,
  | "songTitle"
  | "artistName"
  | "chordBody"
  | "originalKey"
  | "keyMode"
  | "genre"
  | "difficulty"
  | "tempo"
  | "timeSignature"
  | "tuning"
  | "capo"
  | "copyrightSource"
  | "contributorUid"
  | "contributorDisplayName"
>;

function mapContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    songTitle: row.song_title,
    artistName: row.artist_name,
    chordBody: row.chord_body,
    originalKey: row.original_key,
    ...(row.key_mode ? { keyMode: row.key_mode } : {}),
    genre: row.genre,
    difficulty: row.difficulty,
    ...(row.tempo ? { tempo: row.tempo } : {}),
    ...(row.time_signature ? { timeSignature: row.time_signature } : {}),
    ...(row.tuning ? { tuning: row.tuning } : {}),
    ...(row.capo != null ? { capo: row.capo } : {}),
    ...(row.copyright_source ? { copyrightSource: row.copyright_source } : {}),
    contributorUid: row.contributor ?? "",
    contributorDisplayName: row.contributor_display_name,
    status: row.status,
    ...(row.moderator ? { moderatorUid: row.moderator } : {}),
    ...(row.moderator_note ? { moderatorNote: row.moderator_note } : {}),
    ...(row.approved_song ? { approvedSongId: row.approved_song } : {}),
    createdAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

export async function createContribution(input: ContributionInput): Promise<string> {
  const row = await directus().request(
    createItem("contributions", {
      song_title: input.songTitle,
      artist_name: input.artistName,
      chord_body: input.chordBody,
      original_key: input.originalKey,
      key_mode: input.keyMode ?? null,
      genre: input.genre,
      difficulty: input.difficulty,
      tempo: input.tempo != null ? String(input.tempo) : null,
      time_signature: input.timeSignature ?? null,
      tuning: input.tuning ?? null,
      capo: input.capo ?? null,
      copyright_source: input.copyrightSource ?? null,
      contributor: input.contributorUid,
      contributor_display_name: input.contributorDisplayName,
      status: "pending",
    } as never),
  );

  return row.id;
}

export async function getPendingContributions(): Promise<Contribution[]> {
  const rows = await directus().request(
    readItems("contributions", {
      filter: { status: { _eq: "pending" } },
      sort: ["-created_at"],
      limit: -1,
    }),
  );
  return rows.map(mapContribution);
}

export async function getPendingContributionsCount(): Promise<number> {
  const rows = (await directus().request(
    aggregate("contributions", {
      aggregate: { count: "*" },
      query: { filter: { status: { _eq: "pending" } } },
    }),
  )) as unknown as { count: string | number }[];

  return Number(rows[0]?.count) || 0;
}

export async function getContributionById(id: string): Promise<Contribution | null> {
  try {
    const row = await directus().request(readItem("contributions", id));
    return row ? mapContribution(row) : null;
  } catch {
    return null;
  }
}

export async function getContributionsByUser(uid: string): Promise<Contribution[]> {
  const rows = await directus().request(
    readItems("contributions", {
      filter: { contributor: { _eq: uid } },
      sort: ["-created_at"],
      limit: -1,
    }),
  );
  return rows.map(mapContribution);
}

export async function updateContributionStatus(
  id: string,
  status: ContributionDoc["status"],
  moderatorUid: string,
  note?: string,
  approvedSongId?: string,
): Promise<void> {
  await directus().request(
    updateItem("contributions", id, {
      status,
      moderator: moderatorUid,
      ...(note ? { moderator_note: note } : {}),
      ...(approvedSongId ? { approved_song: approvedSongId } : {}),
    } as never),
  );
}
