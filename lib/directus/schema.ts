import type { Difficulty, KeyMode } from "@/lib/types/content";
import type { ModerationStatus } from "@/lib/types/firestore";

/**
 * Directus koleksiyonlarının TypeScript karşılığı.
 * `scripts/directus-schema.mjs` ile birebir aynı olmalı — şema orada değişirse burası da değişir.
 *
 * Tarihler Directus'tan ISO 8601 string olarak gelir; epoch-ms'e çeviren yer
 * `lib/directus/serialize.ts`.
 */

export interface ArtistRow {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  genre: string | null;
  popularity: number | null;
  created_at: string;
  updated_at: string;
}

export interface SongRow {
  id: string;
  title: string;
  slug: string;
  /** M2O — sorguda `fields` ile genişletilmezse yalnız id gelir. */
  artist: string | ArtistRow;
  artist_slug: string;
  artist_name: string;
  chord_body: string;
  original_key: string;
  difficulty: Difficulty;
  key_mode: KeyMode | null;
  gamlar_scale_id: string | null;
  genre: string;
  tempo: string | null;
  time_signature: string | null;
  tuning: string | null;
  capo: number | null;
  moderation_status: ModerationStatus;
  copyright_source: string | null;
  popularity: number | null;
  show_harmony_details: boolean;
  harmony_details_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SongContributorRow {
  id: string;
  song: string | SongRow;
  user: string;
  created_at: string;
}

export interface ContributionRow {
  id: string;
  song_title: string;
  artist_name: string;
  chord_body: string;
  original_key: string;
  key_mode: KeyMode | null;
  genre: string;
  difficulty: Difficulty;
  tempo: string | null;
  time_signature: string | null;
  tuning: string | null;
  capo: number | null;
  copyright_source: string | null;
  contributor: string | null;
  contributor_display_name: string;
  status: "pending" | "approved" | "rejected";
  moderator: string | null;
  moderator_note: string | null;
  approved_song: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributorProfileRow {
  id: string;
  user: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChordShapeRow {
  id: string;
  name: string;
  root: string;
  quality: string;
  fingering: string;
  fingers: string | null;
  barre_fret: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ScaleRow {
  id: string;
  /** Kod tarafındaki ScaleDoc.id — Directus PK'sı ayrı bir uuid. */
  key: string;
  name: string;
  notes_c: string[] | null;
  category: string | null;
  description: string | null;
  sort_order: number | null;
}

export interface DiscoverSectionRow {
  id: string;
  key: string;
  title: string | null;
  sort_order: number | null;
  updated_at: string;
}

export interface DiscoverItemRow {
  id: string;
  section: string | DiscoverSectionRow;
  song: string | SongRow;
  position: number;
}

export interface PlaylistRow {
  id: string;
  owner: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItemRow {
  id: string;
  playlist: string | PlaylistRow;
  song: string | SongRow;
  position: number;
  transpose_semitones: number | null;
  created_at: string;
}

export interface TakedownRequestRow {
  id: string;
  name: string;
  email: string;
  song_url: string;
  original_work: string;
  proof: string;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  created_at: string;
}

/** `createDirectus<DirectusSchema>()` için koleksiyon haritası. */
export interface DirectusSchema {
  artists: ArtistRow[];
  songs: SongRow[];
  song_contributors: SongContributorRow[];
  contributions: ContributionRow[];
  contributor_profiles: ContributorProfileRow[];
  chord_library: ChordShapeRow[];
  scales: ScaleRow[];
  discover_sections: DiscoverSectionRow[];
  discover_items: DiscoverItemRow[];
  playlists: PlaylistRow[];
  playlist_items: PlaylistItemRow[];
  takedown_requests: TakedownRequestRow[];
}
