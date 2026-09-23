import { getPayloadClient } from "@/lib/payload/client";
import { relId, toEpochMs } from "@/lib/payload/serialize";
import type { Contribution as ContributionRow } from "@/payload-types";
import type { ContributionDoc } from "@/lib/types/contribution";

/**
 * Katkı kuyruğu — Payload Local API.
 *
 * Dışa aktarılan imzalar ve camelCase dönüş biçimi korundu.
 *
 * Sayımlar Directus'ta `aggregate` ile yapılıyordu; Payload'da `count()` var,
 * gruplama gerekmediği için doğrudan karşılığı.
 *
 * Bu modül erişim denetimini atlar (moderasyon ekranları ve sistem yazmaları).
 * Kullanıcının kendi katkısını göndermesi koleksiyondaki access kurallarıyla
 * ayrıca kısıtlı.
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
    id: String(row.id),
    songTitle: row.songTitle,
    artistName: row.artistName,
    chordBody: row.chordBody,
    originalKey: row.originalKey,
    ...(row.keyMode ? { keyMode: row.keyMode } : {}),
    genre: row.genre,
    difficulty: row.difficulty,
    ...(row.tempo ? { tempo: row.tempo } : {}),
    ...(row.timeSignature ? { timeSignature: row.timeSignature } : {}),
    ...(row.tuning ? { tuning: row.tuning } : {}),
    ...(row.capo != null ? { capo: row.capo } : {}),
    ...(row.copyrightSource ? { copyrightSource: row.copyrightSource } : {}),
    contributorUid: relId(row.contributor),
    contributorDisplayName: row.contributorDisplayName,
    status: row.status,
    ...(row.moderator ? { moderatorUid: relId(row.moderator) } : {}),
    ...(row.moderatorNote ? { moderatorNote: row.moderatorNote } : {}),
    ...(row.approvedSong ? { approvedSongId: relId(row.approvedSong) } : {}),
    createdAt: toEpochMs(row.createdAt),
    updatedAt: toEpochMs(row.updatedAt),
  } as Contribution;
}

export async function createContribution(input: ContributionInput): Promise<string> {
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "contributions",
    data: {
      songTitle: input.songTitle,
      artistName: input.artistName,
      chordBody: input.chordBody,
      originalKey: input.originalKey,
      keyMode: input.keyMode ?? null,
      genre: input.genre,
      difficulty: input.difficulty,
      tempo: input.tempo != null ? String(input.tempo) : null,
      timeSignature: input.timeSignature ?? null,
      tuning: input.tuning ?? null,
      capo: input.capo ?? null,
      copyrightSource: input.copyrightSource ?? null,
      contributor: input.contributorUid,
      contributorDisplayName: input.contributorDisplayName,
      status: "pending",
    } as never,
  });

  return String(doc.id);
}

export async function getPendingContributions(): Promise<Contribution[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "contributions",
    where: { status: { equals: "pending" } },
    sort: "-createdAt",
    limit: 0,
    depth: 0,
  });
  return docs.map(mapContribution);
}

export async function getPendingContributionsCount(): Promise<number> {
  const payload = await getPayloadClient();
  const { totalDocs } = await payload.count({
    collection: "contributions",
    where: { status: { equals: "pending" } },
  });
  return totalDocs;
}

export async function getContributionById(id: string): Promise<Contribution | null> {
  try {
    const payload = await getPayloadClient();
    const row = await payload.findByID({ collection: "contributions", id, depth: 0 });
    return row ? mapContribution(row) : null;
  } catch {
    return null;
  }
}

export async function getContributionsByUser(uid: string): Promise<Contribution[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "contributions",
    where: { contributor: { equals: uid } },
    sort: "-createdAt",
    limit: 0,
    depth: 0,
  });
  return docs.map(mapContribution);
}

export async function updateContributionStatus(
  id: string,
  status: ContributionDoc["status"],
  moderatorUid: string,
  note?: string,
  approvedSongId?: string,
): Promise<void> {
  const payload = await getPayloadClient();
  await payload.update({
    collection: "contributions",
    id,
    data: {
      status,
      moderator: moderatorUid,
      ...(note ? { moderatorNote: note } : {}),
      ...(approvedSongId ? { approvedSong: approvedSongId } : {}),
    } as never,
  });
}
