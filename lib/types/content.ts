export type Difficulty = "kolay" | "orta" | "zor";

export type MockArtist = {
  id: string;
  name: string;
  slug: string;
};

export type MockSong = {
  id: string;
  title: string;
  slug: string;
  artistId: string;
  artistSlug: string;
  artistName: string;
  originalKey: string;
  difficulty: Difficulty;
  genre: string;
  /** Sunucu HTML — akor + söz (mock) */
  chordBody: string;
};

export type MockChordShape = {
  id: string;
  name: string;
  /** Örn. x32010 */
  fingering: string;
  root: string;
  quality: "maj" | "min" | "7" | "m7" | "sus4";
};

export type MockScale = {
  id: string;
  name: string;
  /** Ton C varsayılanında nota isimleri */
  notesC: string[];
};
