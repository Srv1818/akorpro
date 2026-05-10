import Link from "next/link";
import type { ReactNode } from "react";
import { artistPath, chordPath } from "@/lib/paths";
import type { SongSummary } from "@/lib/types/content";

export type DiscoverAccent = "rose" | "emerald" | "amber";

const ACCENT_STYLES: Record<
  DiscoverAccent,
  { icon: string; ring: string; rank: string; header: string }
> = {
  rose: {
    icon: "text-rose-500",
    ring: "bg-rose-500/10 ring-1 ring-rose-500/20",
    rank: "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/30",
    header: "from-rose-500/10 via-rose-500/5 to-transparent",
  },
  emerald: {
    icon: "text-emerald-500",
    ring: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
    rank: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30",
    header: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  },
  amber: {
    icon: "text-amber-500",
    ring: "bg-amber-500/10 ring-1 ring-amber-500/20",
    rank: "bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-sm shadow-amber-500/30",
    header: "from-amber-500/10 via-amber-500/5 to-transparent",
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
    <div className="group relative flex items-center gap-3 rounded-lg px-2 py-2 transition-all hover:bg-accent/5">
      <span
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
          isTop ? styles.rank : "bg-bg text-muted"
        }`}
        aria-hidden="true"
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm font-semibold text-display transition-colors group-hover:text-accent">
          <Link
            href={chordPath(song.artistSlug, song.slug)}
            prefetch={false}
            aria-label={`${song.title} — ${song.artistName} akoru`}
            className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-[-2px] rounded-sm"
          >
            {song.title}
          </Link>
        </span>
        <Link
          href={artistPath(song.artistSlug)}
          prefetch={false}
          className="relative z-10 mt-0.5 line-clamp-1 text-xs text-muted hover:text-foreground hover:underline underline-offset-2 transition-colors"
        >
          {song.artistName}
        </Link>
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="relative z-10 h-4 w-4 shrink-0 pointer-events-none text-muted/40 transition-all group-hover:translate-x-0.5 group-hover:text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 5l6 5-6 5" />
      </svg>
    </div>
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
      className="relative px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-5"
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
