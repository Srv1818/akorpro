"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { artistPath, chordPath } from "@/lib/paths";
import type { SongSummary } from "@/lib/types/content";

const SongCardPlaylistAdd = dynamic(
  () => import("@/components/content/song-card-playlist-add").then((m) => m.SongCardPlaylistAdd),
  { ssr: false },
);

export function SongCard({
  song,
  showArtist = true,
  showPlaylistAdd = true,
}: {
  song: SongSummary;
  showArtist?: boolean;
  /** Firebase yapılandırılmışsa sağ üstte çalma listesine ekle (+). */
  showPlaylistAdd?: boolean;
}) {
  const chordHref = chordPath(song.artistSlug, song.slug);
  const label = `${song.title} — ${song.artistName} akoru`;
  const playlistSong = {
    id: song.id,
    title: song.title,
    artistSlug: song.artistSlug,
    slug: song.slug,
  };

  return (
    <article className="relative flex flex-row items-start gap-2 rounded-lg border border-border bg-surface p-3 shadow-sm transition hover:border-accent/30">
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-1 text-sm font-semibold text-display">
          <Link
            href={chordHref}
            prefetch={false}
            aria-label={label}
            className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 rounded-sm"
          >
            {song.title}
          </Link>
        </h2>
        {showArtist ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">
            <Link
              href={artistPath(song.artistSlug)}
              prefetch={false}
              className="relative z-10 hover:text-foreground hover:underline underline-offset-2 transition-colors"
            >
              {song.artistName}
            </Link>
          </p>
        ) : null}
      </div>
      {showPlaylistAdd ? <SongCardPlaylistAdd song={playlistSong} /> : null}
    </article>
  );
}
