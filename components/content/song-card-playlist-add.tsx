"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListPlus, Plus } from "lucide-react";
import { useSessionUid } from "@/lib/auth/use-session-user";
import { addItem, createPlaylist, listPlaylists } from "@/lib/playlists/client";
import type { SongSummary } from "@/lib/types/content";

type PlaylistRow = { id: string; name: string };

type PopoverCoords = { top: number; right: number };
type SongCardPlaylistAddSong = Pick<SongSummary, "id" | "title" | "artistSlug" | "slug">;

function formatError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "Bilinmeyen hata";
}

export function SongCardPlaylistAdd({ song }: { song: SongCardPlaylistAddSong }) {
  const pathname = usePathname();
  const uid = useSessionUid();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<PopoverCoords | null>(null);
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const loginHref = `/giris?returnTo=${encodeURIComponent(pathname || "/")}`;

  const loadPlaylists = useCallback(async () => {
    if (!uid) return;
    setListsLoading(true);
    setNotice(null);
    try {
      const rows = await listPlaylists();
      setPlaylists(rows.map((r) => ({ id: r.id, name: r.name })));
    } catch (e) {
      setNotice({ variant: "error", message: formatError(e) });
      setPlaylists([]);
    } finally {
      setListsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!open || !uid) return;
    void loadPlaylists();
  }, [open, uid, loadPlaylists]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const updatePopoverPosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    setPopoverCoords({
      top: rect.bottom + gap,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverCoords(null);
      return;
    }
    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const addToPlaylist = useCallback(
    async (playlistId: string, playlistName: string) => {
      if (!uid) return;
      setBusy(true);
      setNotice(null);
      const listLabel = playlistName.trim() || "Liste";
      try {
        // Tekrar kontrolü ve sıra sunucuda; duplicate 409 ile geri döner.
        await addItem(playlistId, song.id);
        setNotice({
          variant: "success",
          message: `“${listLabel}” listesine eklendi.`,
        });
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
          closeTimerRef.current = null;
          setOpen(false);
        }, 1400);
      } catch (e) {
        setNotice({ variant: "error", message: formatError(e) });
      } finally {
        setBusy(false);
      }
    },
    [uid, song.id],
  );

  const createPlaylistAndAdd = useCallback(async () => {
    if (!uid) return;
    const name = newName.trim();
    if (!name) {
      setNotice({ variant: "error", message: "Liste adı girin." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const playlist = await createPlaylist(name);
      await addItem(playlist.id, song.id);
      setNewName("");
      setNotice({
        variant: "success",
        message: `“${name}” listesine eklendi.`,
      });
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setOpen(false);
      }, 1400);
    } catch (e) {
      setNotice({ variant: "error", message: formatError(e) });
    } finally {
      setBusy(false);
    }
  }, [uid, newName, song.id]);

  const panel =
    open && popoverCoords ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Çalma listesi seç"
        className="fixed z-[100] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
        style={{ top: popoverCoords.top, right: popoverCoords.right }}
        onClick={(e) => e.stopPropagation()}
      >
        {uid === undefined ? (
          <p className="text-xs text-muted">Oturum kontrol ediliyor…</p>
        ) : uid === null ? (
          <p className="text-sm text-foreground">
            Çalma listesine eklemek için{" "}
            <Link href={loginHref} className="text-accent underline-offset-2 hover:underline">
              giriş yapın
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted">Listeye ekle</p>
            {listsLoading ? (
              <p className="text-xs text-muted">Listeler yükleniyor…</p>
            ) : playlists.length === 0 ? (
              <p className="text-xs text-muted">Henüz listeniz yok. Aşağıdan oluşturun.</p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-0.5 text-sm">
                {playlists.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void addToPlaylist(p.id, p.name)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-foreground transition hover:bg-bg disabled:opacity-50"
                    >
                      <ListPlus className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                      <span className="min-w-0 truncate">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border pt-3">
              <label htmlFor={`new-pl-${song.id}`} className="sr-only">
                Yeni çalma listesi adı
              </label>
              <input
                id={`new-pl-${song.id}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={busy}
                placeholder="Yeni liste adı"
                className="mb-2 w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-foreground outline-none ring-accent/25 focus:ring-2"
                maxLength={120}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void createPlaylistAndAdd();
                  }
                }}
              />
              <button
                type="button"
                disabled={busy || !newName.trim()}
                onClick={() => void createPlaylistAndAdd()}
                className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition hover:bg-accent-muted disabled:opacity-50"
              >
                Liste oluştur ve şarkıyı ekle
              </button>
            </div>

            {notice ? (
              <p
                className={
                  notice.variant === "success" ? "text-xs text-accent" : "text-xs text-red-200"
                }
                role="status"
              >
                {notice.message}
              </p>
            ) : null}
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className="pointer-events-auto relative z-20 shrink-0 self-start">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
          if (!open) setNotice(null);
        }}
        disabled={uid === undefined}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface/95 p-0 text-accent shadow-sm backdrop-blur-sm transition hover:border-accent/40 hover:bg-bg disabled:opacity-50 sm:h-7 sm:w-7"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Çalma listesine ekle"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
