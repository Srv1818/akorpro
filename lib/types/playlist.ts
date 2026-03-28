/** Firestore: `users/{uid}/playlists/{playlistId}` */
export type PlaylistDoc = {
  name: string;
  schemaVersion: number;
  createdAt: unknown;
  updatedAt: unknown;
};

/** Firestore: `users/{uid}/playlists/{playlistId}/items/{itemId}` */
export type PlaylistItemDoc = {
  order: number;
  songId: string;
  title: string;
  artistSlug: string;
  songSlug: string;
  /** İsteğe bağlı anlık transpoze (snapshot). */
  transposeSemitones?: number;
  createdAt: unknown;
};
