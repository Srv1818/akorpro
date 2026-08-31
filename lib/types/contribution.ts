import type { ModerationStatus } from "./firestore";
import type { KeyMode } from "./content";

export interface ContributionDoc {
  songTitle: string;
  artistName: string;
  chordBody: string;
  originalKey: string;
  /** Ton modu (minör varyantları / majör). */
  keyMode?: KeyMode;
  genre: string;
  difficulty: "kolay" | "orta" | "zor";

  /** Optional metadata */
  tempo?: number | string;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  copyrightSource?: string;

  /** Submitter */
  contributorUid: string;
  contributorDisplayName: string;

  /** Moderation */
  status: ModerationStatus;
  moderatorUid?: string;
  moderatorNote?: string;
  /** If approved, the resulting songId */
  approvedSongId?: string;

  /** @deprecated Firestore kalıntısı — Directus şemasında yok. */
  schemaVersion?: number;
  /** Epoch milisaniye — serializeDoc() dönüşümü. */
  createdAt: number;
  updatedAt: number;
}

export interface ContributorProfileDoc {
  uid: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  /** @deprecated Directus şemasında yok — onaylı katkılardan türetilir. */
  approvedCount: number;
  /** Moderator-verified badge */
  verified: boolean;
  /** Epoch milisaniye */
  joinedAt: number;
  updatedAt: number;
}
