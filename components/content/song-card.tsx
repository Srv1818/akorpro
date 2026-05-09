"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { chordPath } from "@/lib/paths";
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
      <Link
        href={chordHref}
        prefetch={false}
        className="absolute inset-0 z-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={label}
      />
      <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
        <h2 className="line-clamp-1 text-sm font-semibold text-display">{song.title}</h2>
        {showArtist ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{song.artistName}</p>
        ) : null}
      </div>
      {showPlaylistAdd ? <SongCardPlaylistAdd song={playlistSong} /> : null}
    </article>
  );
}
