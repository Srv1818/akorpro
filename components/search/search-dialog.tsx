"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { chordPath, artistPath } from "@/lib/paths";

type SongHit = {
  id: string;
  title: string;
  slug: string;
  artistSlug: string;
  artistName: string;
  originalKey: string;
  difficulty: string;
};

type ArtistHit = {
  id: string;
  name: string;
  slug: string;
  songCount: number;
};

type PopularArtist = ArtistHit;

type SearchResponse = {
  songs: SongHit[];
  artists: ArtistHit[];
  popular?: PopularArtist[];
  empty: boolean;
};

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const openDialog = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    dialogRef.current?.close();
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (open) closeDialog();
        else openDialog();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openDialog, closeDialog]);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: SearchResponse = await res.json();
        setResults(data);
        setActiveIndex(-1);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const onQueryChange = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchResults(val), 300);
    },
    [fetchResults],
  );

  const allItems = results
    ? [
        ...results.songs.map((s) => ({
          type: "song" as const,
          href: chordPath(s.artistSlug, s.slug),
          label: `${s.title} — ${s.artistName}`,
          sub: `${s.originalKey} · ${s.difficulty}`,
        })),
        ...results.artists.map((a) => ({
          type: "artist" as const,
          href: artistPath(a.slug),
          label: a.name,
          sub: `${a.songCount} şarkı`,
        })),
      ]
    : [];

  const popularItems =
    results?.empty && results?.popular
      ? results.popular.map((a) => ({
          href: artistPath(a.slug),
          label: a.name,
          sub: `${a.songCount} şarkı`,
        }))
      : [];

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const totalItems = allItems.length > 0 ? allItems.length : popularItems.length;
    if (totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const items = allItems.length > 0 ? allItems : popularItems;
      const item = items[activeIndex];
      if (item) {
        closeDialog();
        window.location.href = item.href;
      }
    } else if (e.key === "Escape") {
      closeDialog();
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
        aria-label="Ara (Ctrl+K)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline">Ara…</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
          Ctrl+K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-0 h-full w-full max-w-none bg-transparent p-0 backdrop:bg-black/50"
        onClose={closeDialog}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
        aria-label="Arama"
      >
        <div
          className="mx-auto mt-[10vh] w-full max-w-xl rounded-2xl border border-border bg-bg shadow-2xl"
          role="search"
          onKeyDown={onKeyDown}
        >
          <div className="flex items-center border-b border-border px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              className="flex-1 bg-transparent px-3 py-4 text-foreground outline-none placeholder:text-muted"
              placeholder="Şarkı veya sanatçı ara…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              role="combobox"
              aria-expanded={allItems.length > 0 || popularItems.length > 0}
              aria-autocomplete="list"
              aria-controls="search-listbox"
              aria-activedescendant={
                activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
              }
            />
            {loading ? (
              <span className="text-xs text-muted" aria-live="polite">
                Aranıyor…
              </span>
            ) : null}
            <button
              type="button"
              onClick={closeDialog}
              className="ml-2 rounded px-2 py-1 text-xs text-muted hover:text-foreground"
              aria-label="Kapat"
            >
              ESC
            </button>
          </div>

          <ul
            ref={listRef}
            id="search-listbox"
            role="listbox"
            className="max-h-[50vh] overflow-y-auto p-2"
          >
            {/* Main results */}
            {allItems.map((item, i) => (
              <li
                key={`${item.type}-${item.href}`}
                id={`search-item-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                className={`rounded-lg px-3 py-2.5 transition ${
                  activeIndex === i
                    ? "bg-accent/10 text-foreground"
                    : "text-foreground hover:bg-surface"
                }`}
              >
                <Link
                  href={item.href}
                  onClick={closeDialog}
                  className="block"
                  tabIndex={-1}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-2 text-xs text-muted">{item.sub}</span>
                </Link>
              </li>
            ))}

            {/* Empty: popular artists + CTA */}
            {results?.empty && popularItems.length > 0 ? (
              <>
                <li className="px-3 py-2 text-xs font-medium text-muted">
                  {query.length >= 2
                    ? "Sonuç bulunamadı. Popüler sanatçılar:"
                    : "Popüler sanatçılar"}
                </li>
                {popularItems.map((item, i) => (
                  <li
                    key={`pop-${item.href}`}
                    id={`search-item-${i}`}
                    role="option"
                    aria-selected={activeIndex === i}
                    className={`rounded-lg px-3 py-2.5 transition ${
                      activeIndex === i
                        ? "bg-accent/10 text-foreground"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={closeDialog}
                      className="block"
                      tabIndex={-1}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-2 text-xs text-muted">{item.sub}</span>
                    </Link>
                  </li>
                ))}
                <li className="mt-2 border-t border-border px-3 pt-3 pb-1">
                  <Link
                    href="/katki"
                    onClick={closeDialog}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Bu şarkı eksik mi? Katkıda bulunun &rarr;
                  </Link>
                </li>
              </>
            ) : null}

            {/* Idle state */}
            {!results && !loading ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                Şarkı veya sanatçı adı yazın (min. 2 karakter)
              </li>
            ) : null}
          </ul>
        </div>
      </dialog>
    </>
  );
}
