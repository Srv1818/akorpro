import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { SongCard } from "@/components/content/song-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getArtistBySlug, getAllArtists } from "@/lib/firestore/artists";
import { getSongsByArtist } from "@/lib/firestore/songs";
import { artistPath } from "@/lib/paths";
import { artistJsonLd } from "@/lib/seo/structured-data";

/** ISR: 1 hour (see lib/cache/tags.ts TTL.ARTIST) */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const artists = await getAllArtists();
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
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
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const songs = await getSongsByArtist(slug);

  return (
    <>
      <JsonLd data={artistJsonLd(artist)} />
      <Breadcrumbs
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: artist.name, href: artistPath(slug) },
        ]}
      />
      <PageHeader
        title={artist.name}
        description={
          artist.genre
            ? `${artist.genre} · ${artist.songCount} şarkı`
            : `${artist.songCount} şarkı`
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <li key={song.id}>
              <SongCard song={song} showArtist={false} />
            </li>
          ))}
        </ul>
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
