import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { CoverImage } from "@/components/content/cover-image";
import { ChordReturnLink } from "@/components/content/chord-return-link";
import { SongCard } from "@/components/content/song-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getSongBySlugs, getSongsByArtist, getAllApprovedSongs } from "@/lib/firestore/songs";
import { chordPath, previewPath } from "@/lib/paths";
import { safeInternalReturnPath } from "@/lib/nav/safe-return-to";
import { songJsonLd } from "@/lib/seo/structured-data";

/** ISR: 1 hour (see lib/cache/tags.ts TTL.SONG_DETAIL) */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ sanatciSlug: string; sarkiSlug: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateStaticParams() {
  const songs = await getAllApprovedSongs();
  return songs.map((s) => ({ sanatciSlug: s.artistSlug, sarkiSlug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = await getSongBySlugs(sanatciSlug, sarkiSlug);
  if (!song) return { title: "Şarkı bulunamadı" };
  const title = `${song.title} — ${song.artistName}`;
  const description = `${song.title} akor ve sözleri — ${song.artistName} · Orijinal ton: ${song.originalKey}`;
  const url = chordPath(sanatciSlug, sarkiSlug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
  };
}

export default async function AkorSongPage({ params, searchParams }: Props) {
  const { sanatciSlug, sarkiSlug } = await params;
  const sp = await searchParams;
  const rawReturn = typeof sp.returnTo === "string" ? sp.returnTo : undefined;
  const listReturnHref = safeInternalReturnPath(rawReturn);

  const song = await getSongBySlugs(sanatciSlug, sarkiSlug);
  if (!song) notFound();

  const artistSongs = await getSongsByArtist(sanatciSlug);
  const related = artistSongs
    .filter((s) => s.slug !== sarkiSlug)
    .slice(0, 6);

  return (
    <>
      <JsonLd data={songJsonLd(song)} />
      <Breadcrumbs
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
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {listReturnHref ? (
          <ChordReturnLink
            href={listReturnHref}
            label={listReturnHref.startsWith("/calma-listeleri") ? "Listeye dön" : "Geri dön"}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link
            href={previewPath(song.artistSlug, song.slug)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent/50"
          >
            Önizleme modu
          </Link>
          {song.timeSignature ? (
            <span className="self-center text-xs text-muted">Ölçü: {song.timeSignature}</span>
          ) : null}
          {song.tuning && song.tuning !== "Standard" ? (
            <span className="self-center text-xs text-muted">Akort: {song.tuning}</span>
          ) : null}
        </div>
        <article className="mt-8 rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-loose text-foreground sm:text-base sm:leading-relaxed">{song.chordBody}</pre>
        </article>
        {song.copyrightSource ? (
          <p className="mt-4 text-xs text-muted">Kaynak: {song.copyrightSource}</p>
        ) : null}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-foreground">
              {song.artistName} — diğer şarkılar
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <SongCard song={r} showArtist={false} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/kesfet" className="text-accent hover:underline">
            Keşfet
          </Link>
          <Link href="/gitar-akorlari" className="text-accent hover:underline">
            Tüm şarkılar
          </Link>
          <Link href="/akor-kutuphanesi" className="text-accent hover:underline">
            Akor kütüphanesi
          </Link>
        </nav>
      </div>
    </>
  );
}
