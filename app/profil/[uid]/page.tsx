import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { ContributorBadge } from "@/components/contribution/contributor-badge";
import { SongCard } from "@/components/content/song-card";
import { getContributorProfile } from "@/lib/firestore/contributor-profiles";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { SongDoc } from "@/lib/types/firestore";

type Props = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const profile = await getContributorProfile(uid);
  return {
    title: profile ? `${profile.displayName} — Katkıcı profili` : "Katkıcı profili",
    robots: { index: true, follow: true },
  };
}

export default async function ContributorProfilePage({ params }: Props) {
  const { uid } = await params;
  const profile = await getContributorProfile(uid);

  const db = getAdminFirestore();
  let contributedSongs: (SongDoc & { id: string })[] = [];
  let songCount = 0;

  if (db) {
    const snap = await db
      .collection("songs")
      .where("moderationStatus", "==", "approved")
      .where("contributorIds", "array-contains", uid)
      .orderBy("title")
      .get();
    contributedSongs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SongDoc) }));
    songCount = contributedSongs.length;
  }

  if (!profile && songCount === 0) notFound();

  const displayName = profile?.displayName ?? `Katkıcı ${uid.slice(0, 6)}`;
  const approvedCount = profile?.approvedCount ?? songCount;
  const verified = profile?.verified ?? false;

  return (
    <>
      <PageHeader title={displayName} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <ContributorBadge
            displayName={displayName}
            approvedCount={approvedCount}
            verified={verified}
          />
          {verified ? (
            <span className="text-xs text-green-600 dark:text-green-400">Moderatör onaylı katkıcı</span>
          ) : null}
        </div>

        {profile?.bio ? (
          <p className="mt-4 text-sm text-muted">{profile.bio}</p>
        ) : null}

        {songCount > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Katkıda bulunduğu şarkılar ({songCount})
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contributedSongs.map((song) => (
                <li key={song.id}>
                  <SongCard song={song} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="mt-8 text-sm text-muted">Henüz onaylanmış katkı yok.</p>
        )}

        <p className="mt-10 text-sm">
          <Link href="/katki" className="text-accent hover:underline">
            Siz de katkıda bulunun &rarr;
          </Link>
        </p>
      </div>
    </>
  );
}
