import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/content/page-header";
import { CoverImage } from "@/components/content/cover-image";
import { PreviewClient } from "@/components/preview/preview-client";
import { PreviewShell } from "@/components/preview/preview-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getSongBySlugs } from "@/lib/firestore/songs";
import { resolveSongGamlarScaleId } from "@/lib/music/key-mode-gamlar";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { firstParam } from "@/lib/search-params";
import { chordPath } from "@/lib/paths";
import { songJsonLd } from "@/lib/seo/structured-data";

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
  const canonicalUrl = chordPath(a, s);
  return {
    title: `Önizleme: ${song.title}`,
    description: `${song.artistName} — ${song.title} · Orijinal ton: ${song.originalKey}. Transpoze ve sahne araçları.`,
    robots: { index: false, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${song.title} — ${song.artistName}`,
      description: `${song.artistName} — ${song.title} · Orijinal ton: ${song.originalKey}`,
      url: canonicalUrl,
    },
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

  const initialGamlarScaleId = resolveSongGamlarScaleId(song.keyMode, song.gamlarScaleId);

  const sp = await searchParams;
  const rawTranspose = firstParam(sp.transpose);
  const parsedTranspose = rawTranspose !== undefined ? Number(rawTranspose) : 0;
  const initialTranspose = Number.isFinite(parsedTranspose) ? parsedTranspose : 0;

  const sessionUser = await getServerSessionUser();

  const canonical = chordPath(artistSlug, songSlug);

  return (
    <>
      <JsonLd data={songJsonLd(song)} />
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
        leading={
          <CoverImage
            src={song.coverImageUrl}
            alt={`${song.title} — ${song.artistName} kapak`}
            priority
            className="h-16 w-16 sm:h-20 sm:w-20"
            width={256}
            height={256}
          />
        }
      />

      {/* Bot-visible künye (server HTML) */}
      <section className="sr-only" aria-hidden="true">
        <h2>{song.title} — {song.artistName}</h2>
        <p>Orijinal ton: {song.originalKey} · Zorluk: {song.difficulty}</p>
        {song.genre && <p>Tür: {song.genre}</p>}
        {song.tempo && <p>Tempo: {song.tempo} BPM</p>}
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm text-muted">
          <Link href={canonical} className="text-accent hover:underline">
            ← Şarkı sayfasına dön
          </Link>
        </p>
        <Suspense fallback={<PreviewFallback />}>
          <PreviewShell
            instanceKey={song.id}
            initialTranspose={initialTranspose}
            initialScaleId={initialGamlarScaleId}
          >
            <PreviewClient
              songId={song.id}
              songTitle={song.title}
              artistSlug={song.artistSlug}
              songSlug={song.slug}
              originalKey={song.originalKey}
              keyMode={song.keyMode}
              initialGamlarScaleId={initialGamlarScaleId}
              chordBody={song.chordBody}
              tempo={song.tempo}
              timeSignature={song.timeSignature}
              serverUid={sessionUser?.uid ?? null}
              showHarmonyDetails={song.showHarmonyDetails !== false}
              harmonyDetailsNotes={song.harmonyDetailsNotes}
            />
          </PreviewShell>
        </Suspense>
      </div>
    </>
  );
}
