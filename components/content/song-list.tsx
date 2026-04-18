"use client";

import Link from "next/link";
import { SongCardPlaylistAdd } from "@/components/content/song-card-playlist-add";
import { chordPath } from "@/lib/paths";
import type { SongSummary } from "@/lib/types/content";

function SongListRow({
  song,
  index,
  showArtist,
}: {
  song: SongSummary;
  index: number;
  showArtist: boolean;
}) {
  const chordHref = chordPath(song.artistSlug, song.slug);
  const label = `${song.title}${showArtist ? ` — ${song.artistName}` : ""} akoru`;
  const playlistSong = {
    id: song.id,
    title: song.title,
    artistSlug: song.artistSlug,
    slug: song.slug,
  };

  return (
    <div className="group relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/5">
      <Link
        href={chordHref}
        prefetch={false}
        className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
        aria-label={label}
      />
      <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-bg text-xs font-bold tabular-nums text-muted">
        {index + 1}
      </span>
      <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
        <p className="line-clamp-1 text-sm font-semibold text-display transition-colors group-hover:text-accent">
          {song.title}
        </p>
        {showArtist ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1 w-1 shrink-0 rounded-full bg-accent/50" aria-hidden="true" />
            <span className="line-clamp-1">{song.artistName}</span>
          </p>
        ) : null}
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="relative z-10 h-4 w-4 shrink-0 text-muted/40 pointer-events-none transition-all group-hover:translate-x-0.5 group-hover:text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 5l6 5-6 5" />
      </svg>
      <div className="relative z-10">
        <SongCardPlaylistAdd song={playlistSong} />
      </div>
    </div>
  );
}

export function SongList({
  songs,
  showArtist = true,
}: {
  songs: SongSummary[];
  showArtist?: boolean;
}) {
  if (songs.length === 0) return null;

  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
      {songs.map((song, i) => (
        <li key={song.id}>
          <SongListRow song={song} index={i} showArtist={showArtist} />
        </li>
      ))}
    </ul>
  );
}
