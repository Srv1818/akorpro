import type { ModerationStatus } from "./firestore";

export interface ContributionDoc {
  songTitle: string;
  artistName: string;
  chordBody: string;
  originalKey: string;
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

  schemaVersion: number;
  createdAt: FirebaseFirestore.Timestamp | unknown;
  updatedAt: FirebaseFirestore.Timestamp | unknown;
}

export interface ContributorProfileDoc {
  uid: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  approvedCount: number;
  /** Moderator-verified badge */
  verified: boolean;
  joinedAt: FirebaseFirestore.Timestamp | unknown;
  updatedAt: FirebaseFirestore.Timestamp | unknown;
}
