import type { MockArtist } from "@/lib/types/content";

export const mockArtists: MockArtist[] = [
  { id: "a1", name: "Duman", slug: "duman" },
  { id: "a2", name: "Sezen Aksu", slug: "sezen-aksu" },
  { id: "a3", name: "Mor ve Ötesi", slug: "mor-ve-otesi" },
  { id: "a4", name: "Yüzyüzeyken Konuşuruz", slug: "yuzyuzeyken-konusuruz" },
];

export function getArtistBySlug(slug: string): MockArtist | undefined {
  return mockArtists.find((a) => a.slug === slug);
}
