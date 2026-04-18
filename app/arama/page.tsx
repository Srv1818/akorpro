import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { SongList } from "@/components/content/song-list";
import { searchContent, getPopularArtists } from "@/lib/firestore/search";
import { artistPath } from "@/lib/paths";
import { firstParam } from "@/lib/search-params";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
  alternates: { canonical: "/arama" },
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Sonuçlar */}
        <div className="mt-10">
          {q.length === 0 ? (
            <p className="text-center text-sm text-muted">Aramak için bir metin girin.</p>
          ) : isEmpty ? (
            <div>
              <p className="text-sm text-muted">
                &quot;{q}&quot; için sonuç bulunamadı.
              </p>
              {popular.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 text-sm font-medium text-display">Popüler sanatçılar</h2>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              )}
              <p className="mt-6 text-sm">
                Bu şarkı eksik mi?{" "}
                <Link href="/iletisim" className="font-medium text-accent hover:underline">
                  İletişimden talep edin &rarr;
                </Link>
              </p>
            </div>
          ) : (
            <>
              {results.artists.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-3 text-sm font-medium text-muted">Sanatçılar</h2>
                  <ul className="flex flex-wrap gap-2">
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
              )}

              {results.songs.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-medium text-muted">
                    Şarkılar
                    <span className="ml-2 text-xs">({results.songs.length})</span>
                  </h2>
                  <SongList songs={results.songs} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
