import { mockArtists } from "@/data/mock/artists";
import { mockSongs } from "@/data/mock/songs";
import type { Difficulty, MockSong } from "@/lib/types/content";

const keys = ["Am", "Cm", "Dm", "Em", "F", "G"] as const;

export function filterSongList(params: {
  harf?: string;
  sanatci?: string;
  ton?: string;
  zorluk?: string;
}): MockSong[] {
  let list = [...mockSongs];

  if (params.sanatci) {
    list = list.filter((s) => s.artistSlug === params.sanatci);
  }
  if (params.ton) {
    list = list.filter((s) => s.originalKey === params.ton);
  }
  if (params.zorluk && isDifficulty(params.zorluk)) {
    list = list.filter((s) => s.difficulty === params.zorluk);
  }
  if (params.harf) {
    const h = params.harf.toUpperCase();
    list = list.filter((s) => s.title.toUpperCase().startsWith(h));
  }

  return list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
}

export function isDifficulty(v: string): v is Difficulty {
  return v === "kolay" || v === "orta" || v === "zor";
}

export function filterFacetOptions() {
  return {
    artists: mockArtists,
    keys: [...keys],
    difficulties: ["kolay", "orta", "zor"] as const,
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  };
}

export function hasActiveFilters(params: Record<string, string | undefined>): boolean {
  return Boolean(params.harf || params.sanatci || params.ton || params.zorluk);
}
