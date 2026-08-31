import { aggregate, readItems } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { toEpochMs } from "@/lib/directus/serialize";
import type { ContributorProfileDoc } from "@/lib/types/contribution";

/**
 * Katkıcı profilleri — Directus.
 *
 * İki Firestore kalıntısı burada kapanıyor:
 * - `approvedCount` artık kayıtta tutulan sayaç değil, onaylı katkılardan türetiliyor
 *   (elle güncellenen sayaçtaki tutarsızlık riski kalkıyor).
 * - `songs.contributorIds` + `array-contains` yerine `song_contributors` junction'ı.
 */

type ContributorProfile = ContributorProfileDoc & { id: string };

/** Bir kullanıcının onaylanmış katkı sayısı. */
async function approvedContributionCount(uid: string): Promise<number> {
  const rows = (await directus().request(
    aggregate("contributions", {
      aggregate: { count: "*" },
      query: { filter: { contributor: { _eq: uid }, status: { _eq: "approved" } } },
    }),
  )) as unknown as { count: string | number }[];

  return Number(rows[0]?.count) || 0;
}

export async function getContributorProfile(uid: string): Promise<ContributorProfile | null> {
  const rows = await directus().request(
    readItems("contributor_profiles", {
      filter: { user: { _eq: uid } },
      limit: 1,
    }),
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    uid: row.user,
    displayName: row.display_name,
    ...(row.bio ? { bio: row.bio } : {}),
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    approvedCount: await approvedContributionCount(uid),
    verified: row.verified,
    joinedAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

/** Kullanıcının katkıda bulunduğu onaylı şarkı sayısı (junction üzerinden). */
export async function getContributorSongCount(uid: string): Promise<number> {
  const rows = (await directus().request(
    aggregate("song_contributors", {
      aggregate: { count: "*" },
      query: {
        filter: {
          user: { _eq: uid },
          song: { moderation_status: { _eq: "approved" } },
        },
      },
    }),
  )) as unknown as { count: string | number }[];

  return Number(rows[0]?.count) || 0;
}
