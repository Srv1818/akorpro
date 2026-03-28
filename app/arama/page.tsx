import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { SongCard } from "@/components/content/song-card";
import { mockSongs } from "@/data/mock/songs";
import { firstParam } from "@/lib/search-params";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

export default async function AramaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (firstParam(sp.q) ?? "").trim().toLowerCase();
  const results =
    q.length === 0
      ? []
      : mockSongs.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artistName.toLowerCase().includes(q) ||
            s.slug.includes(q),
        );

  return (
    <>
      <PageHeader
        title="Arama"
        description="Arama sonuç sayfaları kanonik değildir; SEO sayfaları sorgu ile doldurulmaz (ARCHITECTURE)."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="text-muted">Sorgu</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="Şarkı veya sanatçı..."
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
          >
            Ara
          </button>
        </form>

        {q.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Aramak için bir metin girin (mock indeks).</p>
        ) : results.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Sonuç yok. Popüler sayfalar için Keşfet&apos;e bakın.</p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((song) => (
              <li key={song.id}>
                <SongCard song={song} />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-center text-sm">
          <Link href="/kesfet" className="text-accent hover:underline">
            Keşfet
          </Link>
        </p>
      </div>
    </>
  );
}
