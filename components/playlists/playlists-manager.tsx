"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronRight,
  PencilLine,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { useFirebaseUidFromSession } from "@/lib/auth/use-firebase-uid-from-session";
import { chordPath } from "@/lib/paths";
import { getClientFirestore } from "@/lib/firebase/client";

type ApiSearchSong = {
  id: string;
  title: string;
  slug: string;
  artistSlug: string;
  artistName: string;
};

const PLAYLIST_SCHEMA_VERSION = 1;

type PlaylistRow = { id: string; data: PlaylistDoc };

type ItemRow = { id: string; data: PlaylistItemDoc };

function chordHrefWithPlaylistReturn(artistSlug: string, songSlug: string, playlistId: string): string {
  const returnTo = `/calma-listeleri?p=${encodeURIComponent(playlistId)}`;
  return `${chordPath(artistSlug, songSlug)}?returnTo=${encodeURIComponent(returnTo)}`;
}

function chordHrefWithPlaylistReturnAndScene(artistSlug: string, songSlug: string, playlistId: string): string {
  const returnTo = `/calma-listeleri?p=${encodeURIComponent(playlistId)}`;
  return `${chordPath(artistSlug, songSlug)}?returnTo=${encodeURIComponent(returnTo)}&scene=1`;
}

function formatError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "permission-denied") {
      return [
        "Firestore erişimi reddedildi.",
        "Çıkış yapıp Google ile yeniden giriş yapın.",
        "Firebase Console’da App Check → Firestore zorlaması açıksa .env.local içinde NEXT_PUBLIC_RECAPTCHA_SITE_KEY ekleyin veya geliştirmede zorlamayı kapatın.",
      ].join(" ");
    }
    return code;
  }
  return "Bilinmeyen hata";
}

function PlaylistSongSearch({
  disabled,
  busy,
  onAdd,
}: {
  disabled: boolean;
  busy: boolean;
  onAdd: (song: ApiSearchSong) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ApiSearchSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setResults([]);
      setLocalError(null);
      return;
    }
    const id = window.setTimeout(() => {
      setLoading(true);
      setLocalError(null);
      void fetch(`/api/search?q=${encodeURIComponent(t)}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json() as Promise<{ songs?: ApiSearchSong[] }>;
        })
        .then((data) => setResults(data.songs ?? []))
        .catch(() => {
          setResults([]);
          setLocalError("Arama yapılamadı. Tekrar deneyin.");
        })
        .finally(() => setLoading(false));
    }, 320);
    return () => window.clearTimeout(id);
  }, [q]);

  return (
    <div className="space-y-2">
      <label htmlFor="playlist-song-search" className="text-xs text-muted">
        Şarkı ara ve listeye ekle
      </label>
      <input
        id="playlist-song-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled || busy}
        placeholder="En az 2 harf (şarkı veya sanatçı adı)"
        autoComplete="off"
        className="w-full max-w-xl rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
      />
      {localError ? <p className="text-xs text-red-200">{localError}</p> : null}
      {loading ? <p className="text-xs text-muted">Aranıyor…</p> : null}
      {!loading && q.trim().length >= 2 && results.length === 0 && !localError ? (
        <p className="text-xs text-muted">Sonuç yok.</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-border bg-surface text-sm">
          {results.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 last:border-b-0"
            >
              <span className="min-w-0 text-foreground">
                <span className="font-medium">{s.title}</span>
                <span className="text-muted"> — {s.artistName}</span>
              </span>
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => onAdd(s)}
                className="shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent-muted disabled:opacity-50"
              >
                Ekle
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
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
  const firebaseUid = useFirebaseUidFromSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pParam = searchParams.get("p");

  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [playlistListReady, setPlaylistListReady] = useState(false);
  const [itemsByPlaylist, setItemsByPlaylist] = useState<Record<string, ItemRow[]>>({});
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});
  /** Yeniden adlandır tıklanınca açılan düzenleme alanı (tek seferde bir liste) */
  const [renamingPlaylistId, setRenamingPlaylistId] = useState<string | null>(null);

  const openPlaylistId =
    pParam && playlists.some((pl) => pl.id === pParam) ? pParam : null;

  const setOpenPlaylist = useCallback(
    (id: string | null) => {
      const path = pathname || "/calma-listeleri";
      if (id) {
        router.replace(`${path}?p=${encodeURIComponent(id)}`, { scroll: false });
      } else {
        router.replace(path, { scroll: false });
      }
    },
    [pathname, router],
  );

  useEffect(() => {
    if (!pParam || !playlistListReady) return;
    if (!playlists.some((pl) => pl.id === pParam)) {
      router.replace(pathname || "/calma-listeleri", { scroll: false });
    }
  }, [pParam, playlists, playlistListReady, pathname, router]);

  useEffect(() => {
    if (firebaseUid === undefined || firebaseUid === null) return;
    setPlaylistListReady(false);
    const db = getClientFirestore();
    const q = query(collection(db, "users", firebaseUid, "playlists"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPlaylistListReady(true);
        setPlaylists(
          snap.docs.map((d) => ({
            id: d.id,
            data: d.data() as PlaylistDoc,
          })),
        );
      },
      (err) => {
        setPlaylistListReady(true);
        setError(formatError(err));
      },
    );
    return () => unsub();
  }, [firebaseUid]);

  useEffect(() => {
    if (!firebaseUid || !openPlaylistId) {
      return;
    }
    const db = getClientFirestore();
    const q = query(
      collection(db, "users", firebaseUid, "playlists", openPlaylistId, "items"),
      orderBy("order", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItemsByPlaylist((prev) => ({
          ...prev,
          [openPlaylistId]: snap.docs.map((d) => ({
            id: d.id,
            data: d.data() as PlaylistItemDoc,
          })),
        }));
      },
      (err) => setError(formatError(err)),
    );
    return () => unsub();
  }, [firebaseUid, openPlaylistId]);

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
        setRenamingPlaylistId((id) => (id === playlistId ? null : id));
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
        if (openPlaylistId === playlistId) setOpenPlaylist(null);
        setRenamingPlaylistId((id) => (id === playlistId ? null : id));
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUid, openPlaylistId, setOpenPlaylist],
  );

  const onAddSong = useCallback(
    async (playlistId: string, song: ApiSearchSong) => {
      if (!firebaseUid) return;
      setBusy(true);
      setError(null);
      try {
        const db = getClientFirestore();
        const itemsCol = collection(db, "users", firebaseUid, "playlists", playlistId, "items");
        const allItems = await getDocs(itemsCol);
        if (allItems.docs.some((d) => (d.data() as PlaylistItemDoc).songId === song.id)) {
          setError("Bu şarkı zaten bu listede.");
          return;
        }
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

  const onMoveItem = useCallback(
    async (playlistId: string, itemId: string, delta: -1 | 1) => {
      if (!firebaseUid) return;
      const items = itemsByPlaylist[playlistId] ?? [];
      const sorted = [...items].sort((a, b) => a.data.order - b.data.order);
      const idx = sorted.findIndex((i) => i.id === itemId);
      const j = idx + delta;
      if (idx < 0 || j < 0 || j >= sorted.length) return;
      const a = sorted[idx]!;
      const b = sorted[j]!;
      const orderA = a.data.order;
      const orderB = b.data.order;
      setBusy(true);
      setError(null);
      try {
        const db = getClientFirestore();
        const batch = writeBatch(db);
        const refA = doc(db, "users", firebaseUid, "playlists", playlistId, "items", a.id);
        const refB = doc(db, "users", firebaseUid, "playlists", playlistId, "items", b.id);
        batch.update(refA, { order: orderB });
        batch.update(refB, { order: orderA });
        await batch.commit();
        await updateDoc(doc(db, "users", firebaseUid, "playlists", playlistId), {
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUid, itemsByPlaylist],
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

  const detailRow = openPlaylistId ? playlists.find((pl) => pl.id === openPlaylistId) : null;
  const waitingUrlPlaylist = Boolean(pParam) && !playlistListReady;

  if (waitingUrlPlaylist) {
    return (
      <div className="space-y-6">
        {error ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-center text-sm text-muted" aria-live="polite">
          Liste açılıyor…
        </p>
      </div>
    );
  }

  if (detailRow) {
    const row = detailRow;
    const rawItems = itemsByPlaylist[row.id];
    const itemsKnown = rawItems !== undefined;
    const items = rawItems ?? [];
    const sortedItems = [...items].sort((a, b) => a.data.order - b.data.order);
    const countLabel =
      !itemsKnown ? "Şarkılar yükleniyor…" : sortedItems.length === 0 ? "Henüz şarkı yok" : `${sortedItems.length} şarkı`;
    const first = sortedItems[0]?.data ?? null;
    const sceneHref = first
      ? chordHrefWithPlaylistReturnAndScene(first.artistSlug, first.songSlug, row.id)
      : null;

    return (
      <div className="space-y-6">
        {error ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setOpenPlaylist(null)}
          className="inline-flex items-center gap-2 py-1 text-sm font-normal text-accent transition hover:text-accent-muted focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          Listelere dön
        </button>

        <article className="rounded-xl border border-border bg-surface p-4 shadow-sm ring-1 ring-accent/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-foreground">{row.data.name}</h2>
              <p className="mt-0.5 text-xs text-muted">{countLabel}</p>
            </div>
            <div
              className="flex flex-col gap-2 sm:shrink-0 sm:items-end"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Link
                href={sceneHref ?? "#"}
                aria-disabled={!sceneHref}
                onClick={(e) => {
                  if (!sceneHref) e.preventDefault();
                }}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/35 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                  sceneHref
                    ? "border border-white/10 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-300"
                    : "cursor-not-allowed border border-border bg-surface/60 text-muted shadow-none opacity-60"
                }`}
                title={sceneHref ? "Sahne modunu 1. şarkıdan başlat" : "Listede şarkı yok"}
              >
                Sahne Modu
              </Link>
              {renamingPlaylistId === row.id ? (
                <div className="rounded-xl border border-border bg-bg p-3 shadow-sm">
                  <label htmlFor={`rename-playlist-${row.id}`} className="mb-1.5 block text-xs font-medium text-muted">
                    Yeni ad
                  </label>
                  <input
                    id={`rename-playlist-${row.id}`}
                    autoFocus
                    aria-label="Yeni liste adı"
                    value={renameDraft[row.id] ?? row.data.name}
                    onChange={(e) => setRenameDraft((r) => ({ ...r, [row.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onRename(row.id);
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setRenamingPlaylistId(null);
                        setRenameDraft((r) => {
                          const next = { ...r };
                          delete next[row.id];
                          return next;
                        });
                      }
                    }}
                    maxLength={120}
                    className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
                  />
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      disabled={busy || !(renameDraft[row.id] ?? row.data.name).trim()}
                      onClick={() => void onRename(row.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent/50 text-accent transition hover:bg-accent/10 disabled:opacity-50"
                      aria-label="Yeni adı uygula"
                      title="Uygula"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setRenamingPlaylistId(null);
                        setRenameDraft((r) => {
                          const next = { ...r };
                          delete next[row.id];
                          return next;
                        });
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
                      aria-label="İptal"
                      title="İptal"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              ) : null}
              {renamingPlaylistId !== row.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRenamingPlaylistId((cur) => {
                        if (cur && cur !== row.id) {
                          setRenameDraft((r) => {
                            const next = { ...r };
                            delete next[cur];
                            return next;
                          });
                        }
                        return row.id;
                      });
                      setRenameDraft((r) => ({ ...r, [row.id]: row.data.name }));
                    }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/50 text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    aria-label="Yeniden adlandır"
                    title="Yeniden adlandır"
                  >
                    <PencilLine className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDeletePlaylist(row.id)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/40 text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
                    aria-label="Listeyi sil"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-4">
              <PlaylistSongSearch disabled={busy} busy={busy} onAdd={(s) => void onAddSong(row.id, s)} />
            </div>
            {sortedItems.length === 0 ? (
              <p className="text-sm text-muted">Bu listede henüz şarkı yok. Yukarıdan arayıp ekleyin.</p>
            ) : (
              <ol className="space-y-2" aria-label={`${row.data.name} şarkı sırası`}>
                {sortedItems.map((it, pos, arr) => {
                  const href = chordHrefWithPlaylistReturn(it.data.artistSlug, it.data.songSlug, row.id);
                  const openLabel = `${it.data.title} akor sayfasını aç`;
                  return (
                    <li
                      key={it.id}
                      className="relative flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5 shadow-sm"
                    >
                      <Link
                        href={href}
                        className="absolute inset-0 z-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        aria-label={openLabel}
                      />
                      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2 pointer-events-none">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-xs font-medium text-muted">
                          {pos + 1}
                        </span>
                        <span className="min-w-0 truncate font-medium text-accent">{it.data.title}</span>
                      </div>
                      <div className="relative z-10 flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          disabled={busy || pos === 0}
                          onClick={() => void onMoveItem(row.id, it.id, -1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-foreground hover:bg-surface disabled:opacity-40"
                          aria-label="Yukarı taşı"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy || pos >= arr.length - 1}
                          onClick={() => void onMoveItem(row.id, it.id, 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-foreground hover:bg-surface disabled:opacity-40"
                          aria-label="Aşağı taşı"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onRemoveItem(row.id, it.id)}
                          className="rounded-lg bg-bg px-2 py-1.5 text-xs text-muted hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
                        >
                          Kaldır
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </article>
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

      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
      </div>

      {playlists.length === 0 ? (
        <p className="text-center text-sm text-muted">Henüz liste yok. Yukarıdan bir tane oluşturun.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {playlists.map((row) => {
            const rawItems = itemsByPlaylist[row.id];
            const itemsKnown = rawItems !== undefined;
            const items = rawItems ?? [];
            const sortedItems = [...items].sort((a, b) => a.data.order - b.data.order);
            const countLabel = !itemsKnown
              ? "Açarak şarkıları düzenleyin"
              : sortedItems.length === 0
                ? "Henüz şarkı yok"
                : `${sortedItems.length} şarkı`;

            return (
              <li key={row.id}>
                <article className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-accent/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 text-left -m-1 outline-none ring-accent/30 transition hover:bg-bg focus-visible:ring-2"
                      onClick={() => setOpenPlaylist(row.id)}
                    >
                      <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-foreground">{row.data.name}</span>
                        <span className="mt-0.5 block text-xs text-muted">{countLabel}</span>
                      </span>
                    </button>

                    <div
                      className="flex flex-col gap-2 sm:shrink-0 sm:items-end"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      {renamingPlaylistId === row.id ? (
                        <div className="rounded-xl border border-border bg-bg p-3 shadow-sm">
                          <label
                            htmlFor={`rename-playlist-${row.id}`}
                            className="mb-1.5 block text-xs font-medium text-muted"
                          >
                            Yeni ad
                          </label>
                          <input
                            id={`rename-playlist-${row.id}`}
                            autoFocus
                            aria-label="Yeni liste adı"
                            value={renameDraft[row.id] ?? row.data.name}
                            onChange={(e) => setRenameDraft((r) => ({ ...r, [row.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void onRename(row.id);
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setRenamingPlaylistId(null);
                                setRenameDraft((r) => {
                                  const next = { ...r };
                                  delete next[row.id];
                                  return next;
                                });
                              }
                            }}
                            maxLength={120}
                            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
                          />
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={busy || !(renameDraft[row.id] ?? row.data.name).trim()}
                              onClick={() => void onRename(row.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent/50 text-accent transition hover:bg-accent/10 disabled:opacity-50"
                              aria-label="Yeni adı uygula"
                              title="Uygula"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setRenamingPlaylistId(null);
                                setRenameDraft((r) => {
                                  const next = { ...r };
                                  delete next[row.id];
                                  return next;
                                });
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
                              aria-label="İptal"
                              title="İptal"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {renamingPlaylistId !== row.id ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setRenamingPlaylistId((cur) => {
                                if (cur && cur !== row.id) {
                                  setRenameDraft((r) => {
                                    const next = { ...r };
                                    delete next[cur];
                                    return next;
                                  });
                                }
                                return row.id;
                              });
                              setRenameDraft((r) => ({ ...r, [row.id]: row.data.name }));
                            }}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/50 text-accent transition hover:bg-accent/10 disabled:opacity-50"
                            aria-label="Yeniden adlandır"
                            title="Yeniden adlandır"
                          >
                            <PencilLine className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onDeletePlaylist(row.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/40 text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
                            aria-label="Listeyi sil"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
