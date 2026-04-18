import Link from "next/link";
import type { ReactNode } from "react";
import { chordPath } from "@/lib/paths";
import type { SongSummary } from "@/lib/types/content";

export type DiscoverAccent = "rose" | "emerald" | "amber";

const ACCENT_STYLES: Record<
  DiscoverAccent,
  { icon: string; ring: string; rank: string; header: string; dot: string }
> = {
  rose: {
    icon: "text-rose-500",
    ring: "bg-rose-500/10 ring-1 ring-rose-500/20",
    rank: "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/30",
    header: "from-rose-500/10 via-rose-500/5 to-transparent",
    dot: "bg-rose-500",
  },
  emerald: {
    icon: "text-emerald-500",
    ring: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
    rank: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30",
    header: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    dot: "bg-emerald-500",
  },
  amber: {
    icon: "text-amber-500",
    ring: "bg-amber-500/10 ring-1 ring-amber-500/20",
    rank: "bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-sm shadow-amber-500/30",
    header: "from-amber-500/10 via-amber-500/5 to-transparent",
    dot: "bg-amber-500",
  },
};

function SongRow({
  song,
  index,
  accent,
}: {
  song: SongSummary;
  index: number;
  accent: DiscoverAccent;
}) {
  const styles = ACCENT_STYLES[accent];
  const rank = index + 1;
  const isTop = rank <= 3;

  return (
    <Link
      href={chordPath(song.artistSlug, song.slug)}
      prefetch={false}
      className="group relative flex items-center gap-3 rounded-lg px-2 py-2 transition-all hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      aria-label={`${song.title} — ${song.artistName} akoru`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
          isTop ? styles.rank : "bg-bg text-muted"
        }`}
        aria-hidden="true"
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm font-semibold text-display transition-colors group-hover:text-accent">
          {song.title}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <span className={`h-1 w-1 shrink-0 rounded-full ${styles.dot} opacity-60`} aria-hidden="true" />
          <span className="line-clamp-1">{song.artistName}</span>
        </span>
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-4 w-4 shrink-0 text-muted/40 transition-all group-hover:translate-x-0.5 group-hover:text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 5l6 5-6 5" />
      </svg>
    </Link>
  );
}

export function DiscoverBlock({
  id,
  title,
  songs,
  accent = "rose",
  icon,
}: {
  id: string;
  title: string;
  songs: SongSummary[];
  accent?: DiscoverAccent;
  icon?: ReactNode;
}) {
  const styles = ACCENT_STYLES[accent];
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5"
      aria-labelledby={id}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${styles.header}`}
        aria-hidden="true"
      />
      <header className="relative mb-3 hidden items-center gap-2.5 lg:flex">
        {icon ? (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.ring} ${styles.icon}`}>
            {icon}
          </span>
        ) : null}
        <h2 id={id} className="text-base font-bold text-display sm:text-lg">
          {title}
        </h2>
        <span className="ml-auto rounded-full border border-border/70 bg-bg/50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
          {songs.length}
        </span>
      </header>
      <ul className="relative flex flex-col gap-0.5">
        {songs.map((song, i) => (
          <li key={song.id}>
            <SongRow song={song} index={i} accent={accent} />
          </li>
        ))}
      </ul>
    </section>
  );
}
