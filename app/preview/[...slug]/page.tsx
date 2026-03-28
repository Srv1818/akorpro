import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/content/page-header";
import { PreviewClient } from "@/components/preview/preview-client";
import { getSongBySlugs } from "@/data/mock/songs";
import { getServerSessionUser } from "@/lib/auth/server-session";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug?.length !== 2) return { title: "Önizleme", robots: { index: false, follow: true } };
  const [a, s] = slug;
  const song = getSongBySlugs(a, s);
  if (!song) return { title: "Önizleme", robots: { index: false, follow: true } };
  return {
    title: `Önizleme: ${song.title}`,
    description: `Paylaşım ve sahne araçları iskeleti — ${song.artistName}. Parametreli transpose URL kanonik değildir.`,
    robots: { index: false, follow: true },
  };
}

function PreviewFallback() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
      Önizleme yükleniyor…
    </div>
  );
}

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;
  if (!slug || slug.length !== 2) notFound();
  const [artistSlug, songSlug] = slug;
  const song = getSongBySlugs(artistSlug, songSlug);
  if (!song) notFound();

  const sessionUser = await getServerSessionUser();

  return (
    <>
      <PageHeader
        title={`Önizleme: ${song.title}`}
        description={
          <>
            {song.artistName} · Orijinal ton (sunucu):{" "}
            <span className="font-mono text-foreground">{song.originalKey}</span>
          </>
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<PreviewFallback />}>
          <PreviewClient
            songId={song.id}
            songTitle={song.title}
            artistSlug={song.artistSlug}
            songSlug={song.slug}
            originalKey={song.originalKey}
            chordBody={song.chordBody}
            serverUid={sessionUser?.uid ?? null}
          />
        </Suspense>
      </div>
    </>
  );
}
