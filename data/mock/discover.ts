import { mockSongs } from "@/data/mock/songs";
import type { MockSong } from "@/lib/types/content";

function byIds(ids: string[]): MockSong[] {
  return ids
    .map((id) => mockSongs.find((s) => s.id === id))
    .filter((s): s is MockSong => s !== undefined);
}

/** Keşfet: üç ayrı sunucu bölümü (mock) — ARCHITECTURE Faz 2 */
export function getDiscoverPopular(): MockSong[] {
  return byIds(["s1", "s4", "s2"]);
}

export function getDiscoverNew(): MockSong[] {
  return byIds(["s5", "s6", "s3"]);
}

export function getDiscoverFeatured(): MockSong[] {
  return byIds(["s3", "s1", "s5"]);
}
