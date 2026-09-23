import { getPayloadClient } from "@/lib/payload/client";
import { toEpochMs } from "@/lib/payload/serialize";
import type { ContributorProfileDoc } from "@/lib/types/contribution";

/**
 * Katkıcı profilleri — Payload Local API.
 *
 * İki Firestore kalıntısı kapalı kalmaya devam ediyor:
 * - `approvedCount` kayıtta tutulan sayaç değil, onaylı katkılardan türetiliyor.
 * - `songs.contributorIds` yerine `song-contributors` junction koleksiyonu.
 */

type ContributorProfile = ContributorProfileDoc & { id: string };

/** Bir kullanıcının onaylanmış katkı sayısı. */
async function approvedContributionCount(uid: string): Promise<number> {
  const payload = await getPayloadClient();
  const { totalDocs } = await payload.count({
    collection: "contributions",
    where: { and: [{ contributor: { equals: uid } }, { status: { equals: "approved" } }] },
  });
  return totalDocs;
}

export async function getContributorProfile(uid: string): Promise<ContributorProfile | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "contributor-profiles",
    where: { user: { equals: uid } },
    limit: 1,
    depth: 0,
  });

  const row = docs[0];
  if (!row) return null;

  return {
    id: String(row.id),
    uid,
    displayName: row.displayName,
    ...(row.bio ? { bio: row.bio } : {}),
    ...(row.avatarUrl ? { avatarUrl: row.avatarUrl } : {}),
    approvedCount: await approvedContributionCount(uid),
    verified: Boolean(row.verified),
    joinedAt: toEpochMs(row.createdAt),
    updatedAt: toEpochMs(row.updatedAt),
  } as ContributorProfile;
}

/**
 * Kullanıcının katkıda bulunduğu onaylı şarkı sayısı (junction üzerinden).
 * İlişkili şarkının durumuna göre filtre: Payload nokta gösterimini destekliyor.
 */
export async function getContributorSongCount(uid: string): Promise<number> {
  const payload = await getPayloadClient();
  const { totalDocs } = await payload.count({
    collection: "song-contributors",
    where: {
      and: [
        { user: { equals: uid } },
        { "song.moderationStatus": { equals: "approved" } },
      ],
    },
  });
  return totalDocs;
}
