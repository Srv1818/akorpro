"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { PlaylistDoc, PlaylistItemDoc } from "@/lib/types/playlist";
import { chordPath } from "@/lib/paths";
import { mockSongs } from "@/data/mock/songs";
import { getClientAuth, getClientFirestore } from "@/lib/firebase/client";

const PLAYLIST_SCHEMA_VERSION = 1;

type PlaylistRow = { id: string; data: PlaylistDoc };

type ItemRow = { id: string; data: PlaylistItemDoc };

function formatError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "Bilinmeyen hata";
}

async function deletePlaylistAndItems(uid: string, playlistId: string): Promise<void> {
  const db = getClientFirestore();
  const itemsCol = collection(db, "users", uid, "playlists", playlistId, "items");
  const snap = await getDocs(itemsCol);
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 500) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + 500)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
  await deleteDoc(doc(db, "users", uid, "playlists", playlistId));
}

export function PlaylistsManager({ serverUid }: { serverUid: string | null }) {
  const [firebaseUid, setFirebaseUid] = useState<string | null | undefined>(undefined);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [itemsByPlaylist, setItemsByPlaylist] = useState<Record<string, ItemRow[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const auth = getClientAuth();
    const unsub = auth.onAuthStateChanged((u) => {
      setFirebaseUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (firebaseUid === undefined || firebaseUid === null) return;
    const db = getClientFirestore();
    const q = query(collection(db, "users", firebaseUid, "playlists"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPlaylists(
          snap.docs.map((d) => ({
            id: d.id,
            data: d.data() as PlaylistDoc,
          })),
        );
      },
      (err) => setError(formatError(err)),
    );
    return () => unsub();
  }, [firebaseUid]);

  const expanded = expandedId;

  useEffect(() => {
    if (!firebaseUid || !expanded) {
      return;
    }
    const db = getClientFirestore();
    const q = query(
      collection(db, "users", firebaseUid, "playlists", expanded, "items"),
      orderBy("order", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItemsByPlaylist((prev) => ({
          ...prev,
          [expanded]: snap.docs.map((d) => ({
            id: d.id,
            data: d.data() as PlaylistItemDoc,
          })),
        }));
      },
      (err) => setError(formatError(err)),
    );
    return () => unsub();
  }, [firebaseUid, expanded]);

  const songOptions = useMemo(
    () => mockSongs.map((s) => ({ value: s.id, label: `${s.artistName} — ${s.title}` })),
    [],
  );

  const onCreate = useCallback(async () => {
    if (!firebaseUid || !newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const db = getClientFirestore();
      await addDoc(collection(db, "users", firebaseUid, "playlists"), {
        name: newName.trim(),
        schemaVersion: PLAYLIST_SCHEMA_VERSION,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewName("");
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  }, [firebaseUid, newName]);

  const onRename = useCallback(
    async (playlistId: string) => {
      if (!firebaseUid) return;
      const name = (renameDraft[playlistId] ?? "").trim();
      if (!name) return;
      setBusy(true);
      setError(null);
      try {
        const db = getClientFirestore();
        await updateDoc(doc(db, "users", firebaseUid, "playlists", playlistId), {
          name,
          updatedAt: serverTimestamp(),
        });
        setRenameDraft((r) => {
          const next = { ...r };
          delete next[playlistId];
          return next;
        });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUid, renameDraft],
  );

  const onDeletePlaylist = useCallback(
    async (playlistId: string) => {
      if (!firebaseUid) return;
      if (!window.confirm("Bu listeyi ve içindeki şarkıları silmek istediğinize emin misiniz?")) return;
      setBusy(true);
      setError(null);
      try {
        await deletePlaylistAndItems(firebaseUid, playlistId);
        if (expandedId === playlistId) setExpandedId(null);
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUid, expandedId],
  );

  const onAddSong = useCallback(
    async (playlistId: string, songId: string) => {
      if (!firebaseUid) return;
      const song = mockSongs.find((s) => s.id === songId);
      if (!song) return;
      setBusy(true);
      setError(null);
      try {
        const db = getClientFirestore();
        const itemsCol = collection(db, "users", firebaseUid, "playlists", playlistId, "items");
        const existing = await getDocs(query(itemsCol, orderBy("order", "desc")));
        const top = existing.docs[0]?.data() as PlaylistItemDoc | undefined;
        const nextOrder = typeof top?.order === "number" ? top.order + 1 : 0;
        await addDoc(itemsCol, {
          order: nextOrder,
          songId: song.id,
          title: song.title,
          artistSlug: song.artistSlug,
          songSlug: song.slug,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "users", firebaseUid, "playlists", playlistId), {
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUid],
  );

  const onRemoveItem = useCallback(
    async (playlistId: string, itemId: string) => {
      if (!firebaseUid) return;
      setBusy(true);
      setError(null);
      try {
        const db = getClientFirestore();
        await deleteDoc(doc(db, "users", firebaseUid, "playlists", playlistId, "items", itemId));
        await updateDoc(doc(db, "users", firebaseUid, "playlists", playlistId), {
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUid],
  );

  if (firebaseUid === undefined) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Oturum kontrol ediliyor…
      </p>
    );
  }

  if (firebaseUid === null) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
        <p>
          Listeler Firestore kuralları için tarayıcıda Firebase oturumu gerekir. HTTP-only çerez tek başına
          yeterli değil; lütfen{" "}
          <Link href="/giris?returnTo=/calma-listeleri" className="text-accent underline-offset-2 hover:underline">
            tekrar giriş
          </Link>{" "}
          yapın (Google ile aynı sekmede oturum açık kalmalı).
        </p>
      </div>
    );
  }

  if (serverUid && serverUid !== firebaseUid) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
        Sunucu oturumu ile tarayıcı Firebase oturumu eşleşmiyor. Çıkış yapıp yeniden giriş yapın.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="new-playlist-name" className="block text-xs font-medium text-muted">
            Yeni liste adı
          </label>
          <input
            id="new-playlist-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={120}
            placeholder="Örn. Akşam provası"
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <button
          type="button"
          disabled={busy || !newName.trim()}
          onClick={() => void onCreate()}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-muted disabled:opacity-50"
        >
          Liste oluştur
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-center text-sm text-muted">Henüz liste yok. Yukarıdan bir tane oluşturun.</p>
      ) : (
        <ul className="space-y-3">
          {playlists.map((row) => {
            const isOpen = expandedId === row.id;
            const items = itemsByPlaylist[row.id] ?? [];
            return (
              <li key={row.id} className="rounded-2xl border border-border bg-bg">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : row.id)}
                      className="text-left text-base font-medium text-foreground hover:underline"
                    >
                      {row.data.name}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {isOpen ? "▲ gizle" : "▼ şarkılar"}
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      aria-label={`Yeni ad: ${row.data.name}`}
                      value={renameDraft[row.id] ?? row.data.name}
                      onChange={(e) => setRenameDraft((r) => ({ ...r, [row.id]: e.target.value }))}
                      className="min-w-[8rem] flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground sm:max-w-xs"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRename(row.id)}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:bg-surface/80 disabled:opacity-50"
                    >
                      Adı kaydet
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDeletePlaylist(row.id)}
                      className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="border-t border-border px-4 py-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label htmlFor={`add-song-${row.id}`} className="text-xs text-muted">
                        Mock kütüphaneden şarkı ekle
                      </label>
                      <select
                        id={`add-song-${row.id}`}
                        defaultValue=""
                        disabled={busy}
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (v) void onAddSong(row.id, v);
                        }}
                        className="max-w-md rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground"
                      >
                        <option value="">Şarkı seçin…</option>
                        {songOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted">Bu listede henüz şarkı yok.</p>
                    ) : (
                      <ol className="space-y-2">
                        {items.map((it) => (
                          <li
                            key={it.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                          >
                            <div className="min-w-0">
                              <Link
                                href={chordPath(it.data.artistSlug, it.data.songSlug)}
                                className="font-medium text-accent underline-offset-2 hover:underline"
                              >
                                {it.data.title}
                              </Link>
                              <span className="ml-2 text-xs text-muted">#{it.data.order}</span>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onRemoveItem(row.id, it.id)}
                              className="shrink-0 text-xs text-muted hover:text-red-200 disabled:opacity-50"
                            >
                              Kaldır
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
