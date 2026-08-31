"use client";

/**
 * Çalma listesi istemcisi.
 *
 * Firestore SDK'sının yerini alır: tarayıcı artık veritabanına doğrudan değil,
 * kendi origin'imizdeki `/api/playlists/*` uçlarına gidiyor. Gerçek zamanlı
 * `onSnapshot` aboneliği yok — kullanıcı yalnız kendi verisini düzenlediği için
 * yerel güncelleme + gerektiğinde yeniden çekme yeterli (MIGRATION-PLAN.md Faz 4).
 */

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type PlaylistItem = {
  id: string;
  songId: string;
  title: string;
  artistSlug: string;
  songSlug: string;
  order: number;
  transposeSemitones?: number;
  createdAt: number;
};

export class PlaylistError extends Error {
  readonly duplicate: boolean;
  constructor(message: string, duplicate = false) {
    super(message);
    this.name = "PlaylistError";
    this.duplicate = duplicate;
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });

  if (!res.ok) {
    let message = `İşlem başarısız (HTTP ${res.status}).`;
    let duplicate = false;
    try {
      const data = (await res.json()) as { error?: string; duplicate?: boolean };
      if (data.error) message = data.error;
      duplicate = data.duplicate === true;
    } catch {
      /* yanıt JSON değil */
    }
    throw new PlaylistError(message, duplicate);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function listPlaylists(): Promise<Playlist[]> {
  const data = await call<{ playlists: Playlist[] }>("/api/playlists");
  return data.playlists;
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const data = await call<{ playlist: Playlist }>("/api/playlists", {
    method: "POST",
    ...json({ name }),
  });
  return data.playlist;
}

export async function renamePlaylist(id: string, name: string): Promise<void> {
  await call(`/api/playlists/${encodeURIComponent(id)}`, {
    method: "PATCH",
    ...json({ name }),
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  await call(`/api/playlists/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listItems(playlistId: string): Promise<PlaylistItem[]> {
  const data = await call<{ items: PlaylistItem[] }>(
    `/api/playlists/${encodeURIComponent(playlistId)}/items`,
  );
  return data.items;
}

export async function addItem(
  playlistId: string,
  songId: string,
  transposeSemitones?: number,
): Promise<void> {
  await call(`/api/playlists/${encodeURIComponent(playlistId)}/items`, {
    method: "POST",
    ...json({ songId, ...(transposeSemitones != null ? { transposeSemitones } : {}) }),
  });
}

export async function removeItem(playlistId: string, itemId: string): Promise<void> {
  await call(
    `/api/playlists/${encodeURIComponent(playlistId)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
  );
}

export async function setItemPosition(
  playlistId: string,
  itemId: string,
  position: number,
): Promise<void> {
  await call(
    `/api/playlists/${encodeURIComponent(playlistId)}/items/${encodeURIComponent(itemId)}`,
    { method: "PATCH", ...json({ position }) },
  );
}

/** İki kaydın sırasını takas eder — eski `writeBatch` takasının karşılığı. */
export async function swapItemPositions(
  playlistId: string,
  a: { id: string; order: number },
  b: { id: string; order: number },
): Promise<void> {
  await setItemPosition(playlistId, a.id, b.order);
  await setItemPosition(playlistId, b.id, a.order);
}

export async function setItemTranspose(
  playlistId: string,
  itemId: string,
  transposeSemitones: number | null,
): Promise<void> {
  await call(
    `/api/playlists/${encodeURIComponent(playlistId)}/items/${encodeURIComponent(itemId)}`,
    { method: "PATCH", ...json({ transposeSemitones }) },
  );
}

/**
 * Şarkıyı listeye transpoze bilgisiyle ekler; zaten varsa transpozeyi günceller.
 * Önizleme ekranındaki "kaydet ve listeye ekle" akışının ihtiyacı olan upsert.
 *
 * @returns `"added"` yeni kayıt, `"updated"` mevcut kaydın transpozesi değişti.
 */
export async function upsertSongWithTranspose(
  playlistId: string,
  songId: string,
  transposeSemitones: number,
): Promise<"added" | "updated"> {
  const items = await listItems(playlistId);
  const existing = items.find((i) => i.songId === songId);

  if (existing) {
    await setItemTranspose(playlistId, existing.id, transposeSemitones);
    return "updated";
  }

  await addItem(playlistId, songId, transposeSemitones);
  return "added";
}
