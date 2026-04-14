import type { Difficulty, KeyMode } from "./content";

/* ------------------------------------------------------------------ */
/*  Firestore: songs/{songId}                                         */
/*  serializeDoc() ile okunduktan sonraki düz nesne biçimi.           */
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

  /** Kapak görseli URL (Firebase Storage / harici CDN) — isteğe bağlı */
  coverImageUrl?: string;

  /* Künye ------------------------------------------------------------- */
  originalKey: string;
  difficulty: Difficulty;
  /** Ton modu (minör varyantları / majör). Mevcut kayıtlar için geriye dönük uyumluluk adına opsiyonel. */
  keyMode?: KeyMode;
  /** Gamlar kataloğu ölçek kimliği (majör / doğal-harmonik-melodik minör ailelerindeki alt mod). `keyMode` ile uyumlu olmalı. */
  gamlarScaleId?: string;
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

  /** Önizlemede "Meraklısına daha fazla detay" (armoni özeti) gösterilsin mi. Yoksa veya true ise gösterilir. */
  showHarmonyDetails?: boolean;
  /** Açılır pencerede üstte gösterilen isteğe bağlı düzenleyici notu (armoni, form, bağlama vb.). */
  harmonyDetailsNotes?: string;

  /* Meta -------------------------------------------------------------- */
  schemaVersion: number;
  /** Epoch milisaniye — serializeDoc() Firestore Timestamp → number dönüşümü yapar. */
  createdAt: number;
  updatedAt: number;
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
  /** Epoch milisaniye */
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Firestore: discover/{section}                                      */
/*  section: "popular" | "new" | "featured"                            */
/* ------------------------------------------------------------------ */

export interface DiscoverSectionDoc {
  /** songId dizisi — sıralı */
  songIds: string[];
  /** Epoch milisaniye */
  updatedAt: number;
}
