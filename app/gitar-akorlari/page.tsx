import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { SongCard } from "@/components/content/song-card";
import { SongFilters } from "@/components/content/song-filters";
import { filterSongList, hasActiveFilters } from "@/data/mock/filters";
import { firstParam } from "@/lib/search-params";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const current = {
    harf: firstParam(sp.harf),
    sanatci: firstParam(sp.sanatci),
    ton: firstParam(sp.ton),
    zorluk: firstParam(sp.zorluk),
  };
  const filtered = hasActiveFilters(current);
  return {
    title: "Tüm şarkılar",
    description: "Gitar akorları — filtre iskeleti ve kanonik şarkı linkleri (mock).",
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function GitarAkorlariPage({ searchParams }: Props) {
  const sp = await searchParams;
  const current = {
    harf: firstParam(sp.harf),
    sanatci: firstParam(sp.sanatci),
    ton: firstParam(sp.ton),
    zorluk: firstParam(sp.zorluk),
  };
  const songs = filterSongList(current);

  return (
    <>
      <PageHeader
        title="Tüm şarkılar"
        description="Filtreler query parametreleri ile çalışır; bu URL’ler kanonik değildir (noindex). Şarkı kartları her zaman kanonik /akor/... adresine gider."
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <SongFilters basePath="/gitar-akorlari" current={current} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <li key={song.id}>
              <SongCard song={song} />
            </li>
          ))}
        </ul>
        {songs.length === 0 ? <p className="text-center text-sm text-muted">Bu filtrelere uygun şarkı yok (mock).</p> : null}
      </div>
    </>
  );
}
