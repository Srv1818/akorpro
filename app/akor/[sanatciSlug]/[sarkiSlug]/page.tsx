import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { getSongBySlugs, getAllApprovedSongs } from "@/lib/firestore/songs";
import { previewPath } from "@/lib/paths";

/** ISR: 1 hour (see lib/cache/tags.ts TTL.SONG_DETAIL) */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ sanatciSlug: string; sarkiSlug: string }>;
};

export async function generateStaticParams() {
  const songs = await getAllApprovedSongs();
  return songs.map((s) => ({ sanatciSlug: s.artistSlug, sarkiSlug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = await getSongBySlugs(sanatciSlug, sarkiSlug);
  if (!song) return { title: "Şarkı bulunamadı" };
  return {
    title: `${song.title} — ${song.artistName}`,
    description: `${song.title} akor ve sözleri — ${song.artistName} · Orijinal ton: ${song.originalKey}`,
  };
}

export default async function AkorSongPage({ params }: Props) {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = await getSongBySlugs(sanatciSlug, sarkiSlug);
  if (!song) notFound();

  return (
    <>
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
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
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
        <article className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">{song.chordBody}</pre>
        </article>
        {song.copyrightSource ? (
          <p className="mt-4 text-xs text-muted">Kaynak: {song.copyrightSource}</p>
        ) : null}
      </div>
    </>
  );
}
