import type { Difficulty } from "./content";

/* ------------------------------------------------------------------ */
/*  Firestore: songs/{songId}                                         */
/* ------------------------------------------------------------------ */

export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";

export interface SongDoc {
  title: string;
  slug: string;
  artistId: string;
  artistSlug: string;
  artistName: string;

  /** Sunucu HTML — akor + söz gövdesi */
  chordBody: string;

  /* Künye ------------------------------------------------------------- */
  originalKey: string;
  difficulty: Difficulty;
  genre: string;
  /** BPM veya metin ("Andante" vb.) — isteğe bağlı */
  tempo?: number | string;
  /** Örn. "4/4", "3/4", "6/8" */
  timeSignature?: string;
  /** Örn. "Standard", "Drop D", "DADGAD" */
  tuning?: string;
  /** 0 = kapo yok; pozitif tam sayı */
  capo?: number;

  /* Katkı / moderasyon ------------------------------------------------ */
  contributorIds?: string[];
  moderationStatus: ModerationStatus;
  /** Telif/kaynak notu — yasal bilgi alanı */
  copyrightSource?: string;

  /* Keşfet sıralama --------------------------------------------------- */
  /** Popülerlik skoru (sayısal — indeks için) */
  popularity?: number;

  /* Meta -------------------------------------------------------------- */
  schemaVersion: number;
  createdAt: FirebaseFirestore.Timestamp | unknown;
  updatedAt: FirebaseFirestore.Timestamp | unknown;
}

/* ------------------------------------------------------------------ */
/*  Firestore: artists/{artistId}                                      */
/* ------------------------------------------------------------------ */

export interface ArtistDoc {
  name: string;
  slug: string;
  /** İsteğe bağlı profil görseli URL */
  imageUrl?: string;
  genre?: string;
  /** Toplam şarkı sayısı (denormalize — seed/admin günceller) */
  songCount: number;
  /** Popülerlik skoru (indeks için) */
  popularity?: number;

  schemaVersion: number;
  createdAt: FirebaseFirestore.Timestamp | unknown;
  updatedAt: FirebaseFirestore.Timestamp | unknown;
}

/* ------------------------------------------------------------------ */
/*  Firestore: discover/{section}                                      */
/*  section: "popular" | "new" | "featured"                            */
/* ------------------------------------------------------------------ */

export interface DiscoverSectionDoc {
  /** songId dizisi — sıralı */
  songIds: string[];
  updatedAt: FirebaseFirestore.Timestamp | unknown;
}
