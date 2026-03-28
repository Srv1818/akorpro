import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { SongCard } from "@/components/content/song-card";
import { searchContent, getPopularArtists } from "@/lib/firestore/search";
import { artistPath } from "@/lib/paths";
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
  const q = (firstParam(sp.q) ?? "").trim();

  const results = q.length >= 2 ? await searchContent(q, 30) : null;
  const isEmpty = !results || (results.songs.length === 0 && results.artists.length === 0);
  const popular = isEmpty ? await getPopularArtists(6) : [];

  return (
    <>
      <PageHeader title="Arama" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="text-muted">Sorgu</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="Şarkı veya sanatçı…"
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
          <p className="mt-8 text-sm text-muted">Aramak için bir metin girin.</p>
        ) : isEmpty ? (
          <div className="mt-8">
            <p className="text-sm text-muted">
              &quot;{q}&quot; için sonuç bulunamadı.
            </p>
            {popular.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-foreground">Popüler sanatçılar</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {popular.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={artistPath(a.slug)}
                        className="block rounded-xl border border-border bg-surface p-4 transition hover:border-accent/30"
                      >
                        <span className="font-semibold text-foreground">{a.name}</span>
                        <span className="ml-2 text-xs text-muted">{a.songCount} şarkı</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-6 text-sm">
              Bu şarkı eksik mi?{" "}
              <Link href="/katki" className="font-medium text-accent hover:underline">
                Katkıda bulunun &rarr;
              </Link>
            </p>
          </div>
        ) : (
          <>
            {results.artists.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-sm font-medium text-muted">Sanatçılar</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {results.artists.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={artistPath(a.slug)}
                        className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-foreground transition hover:border-accent/30"
                      >
                        {a.name}
                        <span className="ml-1 text-xs text-muted">{a.songCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.songs.map((song) => (
                <li key={song.id}>
                  <SongCard song={song} />
                </li>
              ))}
            </ul>
          </>
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
