import Link from "next/link";
import { SongCardPlaylistAdd } from "@/components/content/song-card-playlist-add";
import { artistPath, chordPath } from "@/lib/paths";
import type { SongSummary } from "@/lib/types/content";

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

  return (
    <article className="relative rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-accent/30">
      {showPlaylistAdd ? <SongCardPlaylistAdd song={song} /> : null}
      <Link
        href={chordHref}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={label}
      />
      <div className={`relative z-10 pointer-events-none ${showPlaylistAdd ? "pr-9" : ""}`}>
        <h2 className="font-semibold text-foreground">{song.title}</h2>
        {showArtist ? (
          <p className="mt-1 text-sm text-muted">
            <Link href={artistPath(song.artistSlug)} className="pointer-events-auto hover:text-accent">
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
      </div>
    </article>
  );
}
