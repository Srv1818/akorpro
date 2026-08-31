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
import type { PlaylistDoc, PlaylistItemDoc } from "@/lib/types/playlist";
import { chordPath } from "@/lib/paths";
import {
  addItem,
  createPlaylist,
  deletePlaylist,
  listItems,
  listPlaylists,
  removeItem,
  renamePlaylist,
  swapItemPositions,
  type Playlist,
  type PlaylistItem,
} from "@/lib/playlists/client";

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

/**
 * Liste öğelerinden akor sayfasına giderken önce songId ile kanonik slug’a yönlendirir;
 * snapshot’taki slug’lar güncel değilse veya eksikse doğrudan /akor/... 404 vermez.
 */
function playlistChordHref(item: PlaylistItemDoc, playlistId: string, opts: { scene: boolean }): string | null {
  const returnTo = `/calma-listeleri?p=${encodeURIComponent(playlistId)}`;
  const params = new URLSearchParams({ returnTo });
  if (opts.scene) params.set("scene", "1");
  const qs = params.toString();
  if (item.songId?.trim()) {
    return `/api/songs/${encodeURIComponent(item.songId)}/open?${qs}`;
  }
  const a = item.artistSlug?.trim();
  const s = item.songSlug?.trim();
  if (a && s) {
    return `${chordPath(a, s)}?${qs}`;
  }
  return null;
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
      queueMicrotask(() => {
        setResults([]);
        setLocalError(null);
      });
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

/** API biçimini bileşenin beklediği satır biçimine çevirir. */
function toPlaylistRow(p: Playlist): PlaylistRow {
  return { id: p.id, data: { name: p.name, schemaVersion: PLAYLIST_SCHEMA_VERSION, createdAt: p.createdAt, updatedAt: p.updatedAt } };
}

function toItemRow(i: PlaylistItem): ItemRow {
  return {
    id: i.id,
    data: {
      order: i.order,
      songId: i.songId,
      title: i.title,
      artistSlug: i.artistSlug,
      songSlug: i.songSlug,
      ...(i.transposeSemitones != null ? { transposeSemitones: i.transposeSemitones } : {}),
      createdAt: i.createdAt,
    },
  };
}

export function PlaylistsManager({ serverUid }: { serverUid: string | null }) {
  // Kimlik artık sunucudan geliyor; istemcide ayrı bir oturum eşitlemesi yok
  // (Firebase custom-token senkronizasyonu kaldırıldı).
  const uid = serverUid;
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

  const refreshPlaylists = useCallback(async () => {
    try {
      const rows = await listPlaylists();
      setPlaylists(rows.map(toPlaylistRow));
    } catch (e) {
      setError(formatError(e));
    } finally {
      setPlaylistListReady(true);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    setPlaylistListReady(false);
    void refreshPlaylists();
  }, [uid, refreshPlaylists]);

  const refreshItems = useCallback(async (playlistId: string) => {
    try {
      const rows = await listItems(playlistId);
      setItemsByPlaylist((prev) => ({ ...prev, [playlistId]: rows.map(toItemRow) }));
    } catch (e) {
      setError(formatError(e));
    }
  }, []);

  useEffect(() => {
    if (!uid || !openPlaylistId) return;
    void refreshItems(openPlaylistId);
  }, [uid, openPlaylistId, refreshItems]);

  const onCreate = useCallback(async () => {
    if (!uid || !newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createPlaylist(newName.trim());
      setNewName("");
      await refreshPlaylists();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
}, [uid, newName, refreshPlaylists]);

  const onRename = useCallback(
    async (playlistId: string) => {
      if (!uid) return;
      const name = (renameDraft[playlistId] ?? "").trim();
      if (!name) return;
      setBusy(true);
      setError(null);
      try {
        await renamePlaylist(playlistId, name);
        await refreshPlaylists();
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
    [uid, renameDraft, refreshPlaylists],
  );

  const onDeletePlaylist = useCallback(
    async (playlistId: string) => {
      if (!uid) return;
      if (!window.confirm("Bu listeyi ve içindeki şarkıları silmek istediğinize emin misiniz?")) return;
      setBusy(true);
      setError(null);
      try {
        // playlist_items şemada CASCADE — kayıtları ayrıca silmeye gerek yok.
        await deletePlaylist(playlistId);
        await refreshPlaylists();
        if (openPlaylistId === playlistId) setOpenPlaylist(null);
        setRenamingPlaylistId((id) => (id === playlistId ? null : id));
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [uid, openPlaylistId, setOpenPlaylist, refreshPlaylists],
  );

  const onAddSong = useCallback(
    async (playlistId: string, song: ApiSearchSong) => {
      if (!uid) return;
      setBusy(true);
      setError(null);
      try {
        // Sıra, tekrar kontrolü ve liste sınırı sunucuda uygulanıyor.
        await addItem(playlistId, song.id);
        await Promise.all([refreshItems(playlistId), refreshPlaylists()]);
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [uid, refreshItems, refreshPlaylists],
  );

  const onMoveItem = useCallback(
    async (playlistId: string, itemId: string, delta: -1 | 1) => {
      if (!uid) return;
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
        await swapItemPositions(
          playlistId,
          { id: a.id, order: orderA },
          { id: b.id, order: orderB },
        );
        await refreshItems(playlistId);
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [uid, itemsByPlaylist, refreshItems],
  );

  const onRemoveItem = useCallback(
    async (playlistId: string, itemId: string) => {
      if (!uid) return;
      setBusy(true);
      setError(null);
      try {
        await removeItem(playlistId, itemId);
        await refreshItems(playlistId);
      } catch (e) {
        setError(formatError(e));
      } finally {
        setBusy(false);
      }
    },
    [uid, refreshItems],
  );

  // Firestore kuralları için tarayıcıda ayrı bir Firebase oturumu tutma zorunluluğu
  // kalktı; sunucu oturumu tek kaynak. "Oturum kontrol ediliyor" ve "oturumlar
  // eşleşmiyor" durumları da bu yüzden ortadan kalktı.
  if (!uid) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
        <p>
          Çalma listelerini görmek için{" "}
          <Link href="/giris?returnTo=/calma-listeleri" className="text-accent underline-offset-2 hover:underline">
            giriş yap
          </Link>
          .
        </p>
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
    const sceneHref = first ? playlistChordHref(first, row.id, { scene: true }) : null;

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
                prefetch={false}
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
                  const href = playlistChordHref(it.data, row.id, { scene: false });
                  const openLabel = `${it.data.title} akor sayfasını aç`;
                  return (
                    <li
                      key={it.id}
                      className="relative flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5 shadow-sm"
                    >
                      <Link
                        href={href ?? "#"}
                        prefetch={false}
                        aria-disabled={!href}
                        onClick={(e) => {
                          if (!href) e.preventDefault();
                        }}
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
