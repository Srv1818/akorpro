import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/content/page-header";
import { PreviewClient } from "@/components/preview/preview-client";
import { PreviewShell } from "@/components/preview/preview-shell";
import { getSongBySlugs } from "@/lib/firestore/songs";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { firstParam } from "@/lib/search-params";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug?.length !== 2) return { title: "Önizleme", robots: { index: false, follow: true } };
  const [a, s] = slug;
  const song = await getSongBySlugs(a, s);
  if (!song) return { title: "Önizleme", robots: { index: false, follow: true } };
  return {
    title: `Önizleme: ${song.title}`,
    description: `${song.artistName} — ${song.title} · Orijinal ton: ${song.originalKey}. Transpoze ve sahne araçları.`,
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

export default async function PreviewPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!slug || slug.length !== 2) notFound();
  const [artistSlug, songSlug] = slug;
  const song = await getSongBySlugs(artistSlug, songSlug);
  if (!song) notFound();

  const sp = await searchParams;
  const rawTranspose = firstParam(sp.transpose);
  const parsedTranspose = rawTranspose !== undefined ? Number(rawTranspose) : 0;
  const initialTranspose = Number.isFinite(parsedTranspose) ? parsedTranspose : 0;

  const sessionUser = await getServerSessionUser();

  return (
    <>
      <PageHeader
        title={`Önizleme: ${song.title}`}
        description={
          <>
            {song.artistName} · Orijinal ton (sunucu):{" "}
            <span className="font-mono text-foreground">{song.originalKey}</span>
            {song.tempo ? (
              <>
                {" · "}
                <span className="text-foreground">{song.tempo} BPM</span>
              </>
            ) : null}
            {song.capo ? (
              <>
                {" · Kapo: "}
                <span className="text-foreground">{song.capo}. perde</span>
              </>
            ) : null}
          </>
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<PreviewFallback />}>
          <PreviewShell instanceKey={song.id} initialTranspose={initialTranspose} initialScaleId="ionian">
            <PreviewClient
              songId={song.id}
              songTitle={song.title}
              artistSlug={song.artistSlug}
              songSlug={song.slug}
              originalKey={song.originalKey}
              chordBody={song.chordBody}
              serverUid={sessionUser?.uid ?? null}
            />
          </PreviewShell>
        </Suspense>
      </div>
    </>
  );
}
