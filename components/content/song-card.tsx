import Link from "next/link";
import { artistPath, chordPath } from "@/lib/paths";
import type { SongSummary } from "@/lib/types/content";

export function SongCard({ song, showArtist = true }: { song: SongSummary; showArtist?: boolean }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-accent/30">
      <h2 className="font-semibold text-foreground">
        <Link href={chordPath(song.artistSlug, song.slug)} className="hover:text-accent">
          {song.title}
        </Link>
      </h2>
      {showArtist ? (
        <p className="mt-1 text-sm text-muted">
          <Link href={artistPath(song.artistSlug)} className="hover:text-accent">
            {song.artistName}
          </Link>
        </p>
      ) : null}
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <div>
          <dt className="sr-only">Ton</dt>
          <dd>Ton: {song.originalKey}</dd>
        </div>
        <div>
          <dt className="sr-only">Zorluk</dt>
          <dd className="capitalize">Zorluk: {song.difficulty}</dd>
        </div>
      </dl>
    </article>
  );
}
