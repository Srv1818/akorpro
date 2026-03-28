import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { SongCard } from "@/components/content/song-card";
import { getArtistBySlug, mockArtists } from "@/data/mock/artists";
import { songsByArtist } from "@/data/mock/songs";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return mockArtists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return { title: "Sanatçı bulunamadı" };
  return {
    title: artist.name,
    description: `${artist.name} şarkıları — mock liste.`,
  };
}

export default async function SanatciPage({ params }: Props) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const songs = songsByArtist(slug);

  return (
    <>
      <PageHeader title={artist.name} description="Sanatçı sayfası — şarkılar kanonik akor URL’lerine bağlanır (mock)." />
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
