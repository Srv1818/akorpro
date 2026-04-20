import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { CoverImage } from "@/components/content/cover-image";
import { SongList } from "@/components/content/song-list";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getArtistBySlug, getAllArtists } from "@/lib/firestore/artists";
import { getSongsByArtist } from "@/lib/firestore/songs";
import { artistPath } from "@/lib/paths";
import { artistJsonLd } from "@/lib/seo/structured-data";
import type { SongSummary } from "@/lib/types/content";

/** ISR: 1 hour (see lib/cache/tags.ts TTL.ARTIST) */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const artists = await getAllArtists();
    return artists.map((a) => ({ slug: a.slug }));
  } catch {
    // CI/build environments may not provide Firestore admin credentials.
    // Returning an empty set keeps build green; ISR still serves pages at runtime.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let artist: Awaited<ReturnType<typeof getArtistBySlug>> = null;
  try {
    artist = await getArtistBySlug(slug);
  } catch {
    artist = null;
  }
  if (!artist) return { title: "Sanatçı bulunamadı" };
  const title = artist.name;
  const description = `${artist.name} gitar akorları ve şarkı sözleri.`;
  const url = artistPath(slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
    },
  };
}

export default async function SanatciPage({ params }: Props) {
  const { slug } = await params;
  // Önce şarkıları çekiyoruz: Bazen `artists/{slug}` dokümanı yokken,
  // aynı slug ile onaylı şarkılar var olabiliyor (seed/admin akışı veya cache gecikmesi).
  // Bu durumda 404 yerine şarkılardan "fallback" sanatçı gösteriyoruz.
  const songs = await getSongsByArtist(slug);
  const artist = await getArtistBySlug(slug);

  const artistForPage = (() => {
    if (artist) return artist;
    if (songs.length === 0) return null;
    const first = songs[0]!;
    return {
      // JsonLd/PageHeader için gerekli alanlar
      id: "fallback",
      name: first.artistName,
      slug,
      imageUrl: undefined,
      genre: first.genre,
      songCount: songs.length,
      popularity: undefined,

      // Tip uyumu için placeholder (UI tarafında kullanılmıyor)
      schemaVersion: 1,
      createdAt: null,
      updatedAt: null,
    } as unknown as Awaited<ReturnType<typeof getArtistBySlug>>;
  })();
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

  if (!artistForPage) notFound();

  return (
    <>
      <JsonLd data={artistJsonLd(artistForPage as Exclude<typeof artistForPage, null>)} />
      <Breadcrumbs
        visuallyHidden
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: artistForPage.name, href: artistPath(slug) },
        ]}
      />
      <PageHeader
        title={artistForPage.name}
        description={
          artistForPage.genre
            ? `${artistForPage.genre} · ${artistForPage.songCount} şarkı`
            : `${artistForPage.songCount} şarkı`
        }
        leading={
          <CoverImage
            src={artistForPage.imageUrl}
            alt={`${artistForPage.name} profil`}
            priority
            className="h-20 w-20 rounded-full sm:h-24 sm:w-24"
            width={384}
            height={384}
          />
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <SongList songs={songSummaries} showArtist={false} />
        {songs.length === 0 ? (
          <p className="text-sm text-muted">
            Henüz şarkı yok.{" "}
            <Link href="/gitar-akorlari" className="text-accent hover:underline">
              Tüm şarkılar
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
