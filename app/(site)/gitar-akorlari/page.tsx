import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { SongList } from "@/components/content/song-list";
import { SongFilters } from "@/components/content/song-filters";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getFilteredSongs, getFilterFacetOptions } from "@/lib/firestore/songs";
import type { SongDoc } from "@/lib/types/firestore";
import type { SongSummary } from "@/lib/types/content";
import { firstParam } from "@/lib/search-params";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(p: Record<string, string | undefined>): boolean {
  return Boolean(p.harf || p.sanatci || p.ton || p.zorluk || p.sarkiAdi || p.mod || p.tur || p.olcu || p.bpm);
}

function deriveFacetOptionsFromSongs(songs: Array<SongDoc & { id: string }>) {
  const artistMap = new Map<string, string>();
  const keysSet = new Set<string>();
  const genresSet = new Set<string>();
  const timeSignaturesSet = new Set<string>();

  for (const s of songs) {
    artistMap.set(s.artistSlug, s.artistName);
    keysSet.add(s.originalKey);
    if (s.genre) genresSet.add(s.genre);
    if (s.timeSignature) timeSignaturesSet.add(s.timeSignature);
  }

  const artists = [...artistMap.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return {
    artists,
    keys: [...keysSet].sort(),
    difficulties: ["kolay", "orta", "zor"] as const,
    letters: "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split(""),
    genres: [...genresSet].sort(),
    timeSignatures: [...timeSignaturesSet].sort(),
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const current = {
    harf: firstParam(sp.harf),
    sanatci: firstParam(sp.sanatci),
    ton: firstParam(sp.ton),
    zorluk: firstParam(sp.zorluk),
    sarkiAdi: firstParam(sp.sarkiAdi),
    mod: firstParam(sp.mod),
    tur: firstParam(sp.tur),
    olcu: firstParam(sp.olcu),
    bpm: firstParam(sp.bpm),
  };
  const filtered = hasActiveFilters(current);
  return {
    title: "Tüm şarkılar",
    description: "Gitar akorları — filtre ve arama ile şarkı keşfet.",
    alternates: { canonical: "/gitar-akorlari" },
    openGraph: {
      title: "Tüm şarkılar",
      description: "Gitar akorları — filtre ve arama ile şarkı keşfet.",
      url: "/gitar-akorlari",
    },
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
    sarkiAdi: firstParam(sp.sarkiAdi),
    mod: firstParam(sp.mod),
    tur: firstParam(sp.tur),
    olcu: firstParam(sp.olcu),
    bpm: firstParam(sp.bpm),
  };

  const filtered = hasActiveFilters(current);
  const songsPromise = getFilteredSongs(current);
  const facetsPromise = filtered ? getFilterFacetOptions() : songsPromise.then(deriveFacetOptionsFromSongs);
  const [songs, facets] = await Promise.all([songsPromise, facetsPromise]);
  const songSummaries: SongSummary[] = songs.map((song) => ({
    id: song.id,
    title: song.title,
    slug: song.slug,
    artistSlug: song.artistSlug,
    artistName: song.artistName,
    originalKey: song.originalKey,
    difficulty: song.difficulty,
    coverImageUrl: song.coverImageUrl,
  }));

  return (
    <>
      <Breadcrumbs
        visuallyHidden
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Tüm şarkılar", href: "/gitar-akorlari" },
        ]}
      />
      <PageHeader
        title="Tüm şarkılar"
        description="Filtreler query parametreleri ile çalışır; bu URL'ler kanonik değildir (noindex). Şarkı kartları her zaman kanonik /akor/... adresine gider."
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <SongFilters basePath="/gitar-akorlari" current={current} facets={facets} />
        <SongList songs={songSummaries} />
        {songs.length === 0 ? <p className="text-center text-sm text-muted">Bu filtrelere uygun şarkı bulunamadı.</p> : null}
      </div>
    </>
  );
}
