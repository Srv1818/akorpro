import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/content/page-header";
import { CoverImage } from "@/components/content/cover-image";
import { ChordReturnLink } from "@/components/content/chord-return-link";
import { SongCard } from "@/components/content/song-card";
import { PreviewClient } from "@/components/preview/preview-client";
import { PreviewShell } from "@/components/preview/preview-shell";
import { ClientErrorBoundary } from "@/components/common/client-error-boundary";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  getSongBySlugs,
  getSongBySlugsUncached,
  getSongsByArtist,
  getAllApprovedSongs,
} from "@/lib/firestore/songs";
import { chordPath } from "@/lib/paths";
import { safeInternalReturnPath } from "@/lib/nav/safe-return-to";
import { songJsonLd } from "@/lib/seo/structured-data";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { resolveSongGamlarScaleId } from "@/lib/music/key-mode-gamlar";
import { firstParam } from "@/lib/search-params";
import type { SongSummary } from "@/lib/types/content";

/** ISR: 1 hour (see lib/cache/tags.ts TTL.SONG_DETAIL) */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ sanatciSlug: string; sarkiSlug: string }>;
  searchParams: Promise<{ returnTo?: string | string[]; transpose?: string | string[] }>;
};

export async function generateStaticParams() {
  try {
    const songs = await getAllApprovedSongs();
    return songs.map((s) => ({ sanatciSlug: s.artistSlug, sarkiSlug: s.slug }));
  } catch {
    // CI/build environments may not provide Firestore admin credentials.
    // Returning an empty set keeps build green; ISR still serves pages at runtime.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = await getSongBySlugs(sanatciSlug, sarkiSlug);
  if (!song) return { title: "Şarkı bulunamadı" };
  const titleAbsolute = `${song.title} Akor — ${song.artistName} | AkorPro`;
  const description = `${song.title} akor ve sözleri — ${song.artistName} · Orijinal ton: ${song.originalKey}`;
  const url = chordPath(sanatciSlug, sarkiSlug);
  return {
    title: { absolute: titleAbsolute },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: titleAbsolute,
      description,
      url,
      type: "music.song",
    },
  };
}

export default async function AkorSongPage({ params, searchParams }: Props) {
  const { sanatciSlug, sarkiSlug } = await params;
  const sp = await searchParams;
  const rawReturn = typeof sp.returnTo === "string" ? sp.returnTo : undefined;
  const listReturnHref = safeInternalReturnPath(rawReturn);
  const rawTranspose = firstParam(sp.transpose);
  const parsedTranspose = rawTranspose !== undefined ? Number(rawTranspose) : 0;
  const initialTranspose = Number.isFinite(parsedTranspose) ? parsedTranspose : 0;

  let song = null as Awaited<ReturnType<typeof getSongBySlugs>>;
  try {
    song = await getSongBySlugs(sanatciSlug, sarkiSlug);
    if (!song) {
      // İlk okumada geçici negatif cache/data race oluşursa 404 vermeden önce bir kez
      // cache-bypass doğrulaması yap.
      song = await getSongBySlugsUncached(sanatciSlug, sarkiSlug);
    }
  } catch (e) {
    console.error("[akor] song fetch failed", { sanatciSlug, sarkiSlug, e });
    song = null;
  }
  if (!song) notFound();

  const initialGamlarScaleId = resolveSongGamlarScaleId(song.keyMode, song.gamlarScaleId);

  const sessionUser = await getServerSessionUser();
  let artistSongs: Awaited<ReturnType<typeof getSongsByArtist>> = [];
  try {
    artistSongs = await getSongsByArtist(sanatciSlug);
  } catch (e) {
    console.error("[akor] artist songs fetch failed", { sanatciSlug, e });
    artistSongs = [];
  }
  const prevSong = (() => {
    const idx = artistSongs.findIndex((s) => s.slug === sarkiSlug);
    if (idx <= 0) return null;
    const p = artistSongs[idx - 1];
    return p ?? null;
  })();
  const nextSong = (() => {
    const idx = artistSongs.findIndex((s) => s.slug === sarkiSlug);
    if (idx === -1) return null;
    const n = artistSongs[idx + 1];
    return n ?? null;
  })();
  const related = artistSongs
    .filter((s) => s.slug !== sarkiSlug)
    .slice(0, 6);
  const relatedSummaries: SongSummary[] = related.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    artistSlug: r.artistSlug,
    artistName: r.artistName,
    originalKey: r.originalKey,
    difficulty: r.difficulty,
    coverImageUrl: r.coverImageUrl,
  }));

  return (
    <>
      <JsonLd data={songJsonLd(song)} />
      <Breadcrumbs
        visuallyHidden
        currentCrumbTone="display"
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Tüm şarkılar", href: "/gitar-akorlari" },
          { label: song.artistName, href: `/sanatci/${song.artistSlug}` },
          { label: song.title, href: chordPath(sanatciSlug, sarkiSlug) },
        ]}
      />
      <PageHeader
        title={song.title}
        description={
          <>
            <Link href={`/sanatci/${song.artistSlug}`} className="font-medium text-accent hover:underline">
              {song.artistName}
            </Link>
            <span className="text-muted"> · Orijinal ton: </span>
            <span className="font-mono text-foreground">{song.originalKey}</span>
            <span className="text-muted"> · Zorluk: </span>
            <span className="capitalize text-foreground">{song.difficulty}</span>
            {song.tempo ? (
              <>
                <span className="text-muted"> · Tempo: </span>
                <span className="text-foreground">{song.tempo} BPM</span>
              </>
            ) : null}
            {song.capo ? (
              <>
                <span className="text-muted"> · Kapo: </span>
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
            className="h-20 w-20 sm:h-24 sm:w-24"
            width={384}
            height={384}
          />
        }
      />
      <div className="preview-container mx-auto max-w-6xl px-3 pb-8 pt-1.5 sm:px-6 sm:pb-10 sm:pt-3 lg:px-8 lg:pt-4">
        {listReturnHref ? (
          <ChordReturnLink
            href={listReturnHref}
            label={listReturnHref.startsWith("/calma-listeleri") ? "Listeye dön" : "Geri dön"}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          {null}
          {song.tuning && song.tuning !== "Standard" ? (
            <span className="self-center text-xs text-muted">Akort: {song.tuning}</span>
          ) : null}
        </div>

        <Suspense
          fallback={
            <div className="mt-8 animate-pulse rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
              Yükleniyor…
            </div>
          }
        >
          <ClientErrorBoundary
            fallback={
              <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
                Önizleme yüklenirken geçici bir sorun oluştu. Sayfayı yenileyip tekrar deneyin.
              </div>
            }
          >
            <PreviewShell
              instanceKey={song.id}
              initialTranspose={initialTranspose}
              initialScaleId={initialGamlarScaleId}
            >
              <PreviewClient
                songId={song.id}
                songTitle={song.title}
                artistName={song.artistName}
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
                prevSong={
                  prevSong
                    ? { title: prevSong.title, href: chordPath(prevSong.artistSlug, prevSong.slug) }
                    : null
                }
                nextSong={
                  nextSong
                    ? { title: nextSong.title, href: chordPath(nextSong.artistSlug, nextSong.slug) }
                    : null
                }
              />
            </PreviewShell>
          </ClientErrorBoundary>
        </Suspense>

        {song.copyrightSource ? <p className="mt-4 text-xs text-muted">Kaynak: {song.copyrightSource}</p> : null}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold">
              <span className="text-foreground">{song.artistName}</span>
              <span className="text-display"> — diğer şarkılar</span>
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {relatedSummaries.map((r) => (
                <li key={r.id}>
                  <SongCard song={r} showArtist={false} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-accent hover:underline">
            Keşfet
          </Link>
          <Link href="/gitar-akorlari" className="text-accent hover:underline">
            Tüm şarkılar
          </Link>
          <Link href="/akor-kutuphanesi" className="text-accent hover:underline">
            Akorlar
          </Link>
        </nav>
      </div>
    </>
  );
}
