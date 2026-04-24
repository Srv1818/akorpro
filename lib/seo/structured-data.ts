import { SITE_URL, chordPath, artistPath } from "@/lib/paths";
import type { SongDoc } from "@/lib/types/firestore";
import type { ArtistDoc } from "@/lib/types/firestore";

type SongWithId = SongDoc & { id: string };
type ArtistWithId = ArtistDoc & { id: string };

export function songJsonLd(song: SongWithId, gamScaleName?: string): Record<string, unknown> {
  const url = `${SITE_URL}${chordPath(song.artistSlug, song.slug)}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: song.title,
    url,
    inLanguage: "tr",
    musicalKey: song.originalKey,
    composer: {
      "@type": "MusicGroup",
      name: song.artistName,
      url: `${SITE_URL}${artistPath(song.artistSlug)}`,
    },
  };

  if (song.genre) {
    data.genre = song.genre;
  }
  if (song.tempo && typeof song.tempo === "number") {
    data.tempo = {
      "@type": "QuantitativeValue",
      value: song.tempo,
      unitText: "BPM",
    };
  }
  if (song.timeSignature) {
    data.timeSignature = song.timeSignature;
  }
  if (gamScaleName) {
    data.additionalProperty = {
      "@type": "PropertyValue",
      name: "Solo/Gam/Mod",
      value: gamScaleName,
    };
  }

  return data;
}

export function artistJsonLd(artist: ArtistWithId): Record<string, unknown> {
  const url = `${SITE_URL}${artistPath(artist.slug)}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    url,
  };

  if (artist.genre) {
    data.genre = artist.genre;
  }
  if (artist.imageUrl) {
    data.image = artist.imageUrl;
  }

  return data;
}

export function webPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.url}`,
    inLanguage: "tr",
    isPartOf: {
      "@type": "WebSite",
      name: "AkorPro",
      url: SITE_URL,
    },
  };
}
