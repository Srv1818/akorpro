import type { MockSong } from "@/lib/types/content";

export const mockSongs: MockSong[] = [
  {
    id: "s1",
    title: "Kufi",
    slug: "kufi",
    artistId: "a1",
    artistSlug: "duman",
    artistName: "Duman",
    originalKey: "Am",
    difficulty: "orta",
    genre: "Rock",
    chordBody: `[Verse]\nAm          F\nKaranlıkta kaldım\nC           G\nYine sessizlik\n\n[Chorus]\nAm    F    C    G\nKufi gibi sarıldım geceye`,
  },
  {
    id: "s2",
    title: "Hayatı Yaşa",
    slug: "hayati-yasa",
    artistId: "a1",
    artistSlug: "duman",
    artistName: "Duman",
    originalKey: "Em",
    difficulty: "kolay",
    genre: "Rock",
    chordBody: `[Intro]\nEm  C  G  D\n\n[Verse]\nEm              C\nHayatı yaşa derler\nG              D\nBen yine yoldayım`,
  },
  {
    id: "s3",
    title: "Gidiyorum",
    slug: "gidiyorum",
    artistId: "a2",
    artistSlug: "sezen-aksu",
    artistName: "Sezen Aksu",
    originalKey: "Dm",
    difficulty: "orta",
    genre: "Pop",
    chordBody: `[Verse]\nDm        Bb\nGidiyorum bugün\nC         A7\nUzaklara doğru`,
  },
  {
    id: "s4",
    title: "Bir Derdim Var",
    slug: "bir-derdim-var",
    artistId: "a3",
    artistSlug: "mor-ve-otesi",
    artistName: "Mor ve Ötesi",
    originalKey: "Cm",
    difficulty: "zor",
    genre: "Rock",
    chordBody: `[Verse]\nCm        Ab\nBir derdim var\nEb        Bb\nSöyleyemem`,
  },
  {
    id: "s5",
    title: "Dönersen Islık Çal",
    slug: "donersen-islik-cal",
    artistId: "a4",
    artistSlug: "yuzyuzeyken-konusuruz",
    artistName: "Yüzyüzeyken Konuşuruz",
    originalKey: "G",
    difficulty: "kolay",
    genre: "Alternatif",
    chordBody: `[Verse]\nG           Em\nDönersen ıslık çal\nC           D\nBeni bulurum`,
  },
  {
    id: "s6",
    title: "Ölürüm Sana",
    slug: "olurum-sana",
    artistId: "a2",
    artistSlug: "sezen-aksu",
    artistName: "Sezen Aksu",
    originalKey: "F",
    difficulty: "orta",
    genre: "Pop",
    chordBody: `[Chorus]\nF           C\nÖlürüm sana\nBb          Am\nYine de severim`,
  },
];

export function getSongBySlugs(artistSlug: string, songSlug: string): MockSong | undefined {
  return mockSongs.find((s) => s.artistSlug === artistSlug && s.slug === songSlug);
}

export function songsByArtist(artistSlug: string): MockSong[] {
  return mockSongs.filter((s) => s.artistSlug === artistSlug);
}
