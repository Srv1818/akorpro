import type { MockSong } from "@/lib/types/content";
import { SongCard } from "@/components/content/song-card";

export function DiscoverBlock({
  id,
  title,
  songs,
}: {
  id: string;
  title: string;
  songs: MockSong[];
}) {
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <h2 id={id} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {songs.map((song) => (
          <li key={song.id}>
            <SongCard song={song} />
          </li>
        ))}
      </ul>
    </section>
  );
}
