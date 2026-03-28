import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { getSongBySlugs, mockSongs } from "@/data/mock/songs";
import { previewPath } from "@/lib/paths";

type Props = {
  params: Promise<{ sanatciSlug: string; sarkiSlug: string }>;
};

export function generateStaticParams() {
  return mockSongs.map((s) => ({ sanatciSlug: s.artistSlug, sarkiSlug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = getSongBySlugs(sanatciSlug, sarkiSlug);
  if (!song) return { title: "Şarkı bulunamadı" };
  return {
    title: `${song.title} — ${song.artistName}`,
    description: `${song.originalKey} ton — mock akor metni. Orijinal ton sunucuda sabittir; transpoze yalnızca önizleme ve istemci katmanında.`,
  };
}

export default async function AkorSongPage({ params }: Props) {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = getSongBySlugs(sanatciSlug, sarkiSlug);
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
          <span className="self-center text-xs text-muted">Transpoze / sahne araçları önizlemede (mock).</span>
        </div>
        <article className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">{song.chordBody}</pre>
        </article>
      </div>
    </>
  );
}
