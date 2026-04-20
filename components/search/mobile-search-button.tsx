"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { chordPath, artistPath } from "@/lib/paths";

type Song = { id: string; title: string; slug: string; artistSlug: string; artistName: string };
type Artist = { id: string; name: string; slug: string; songCount: number };
type Results = { songs: Song[]; artists: Artist[]; empty: boolean };

export function MobileSearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: Results = await res.json();
      setResults(data);
      setActiveIndex(-1);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query.trim()), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey as unknown as EventListener);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey as unknown as EventListener);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const allItems: { href: string; primary: string; secondary?: string }[] = [
    ...(results?.artists ?? []).map((a) => ({ href: artistPath(a.slug), primary: a.name, secondary: `${a.songCount} şarkı` })),
    ...(results?.songs ?? []).map((s) => ({ href: chordPath(s.artistSlug, s.slug), primary: s.title, secondary: s.artistName })),
  ];

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!results || allItems.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item) { close(); router.push(item.href); }
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) { inputRef.current?.focus(); return; }
    close();
    router.push(`/arama?q=${encodeURIComponent(q)}`);
  }

  const hasArtists = (results?.artists.length ?? 0) > 0;
  const hasSongs = (results?.songs.length ?? 0) > 0;
  const artistOffset = 0;
  const songOffset = results?.artists.length ?? 0;

  return (
    <>
      <button
        type="button"
        aria-label="Aramayı aç"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface/80"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Aramayı kapat"
                className="fixed inset-0 z-[90] bg-zinc-950/50 backdrop-blur-sm dark:bg-black/60"
                onClick={close}
              />
              <div className="fixed inset-x-0 top-0 z-[100] border-b border-border bg-bg shadow-lg">
                <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3">
                  <div className="relative flex min-w-0 flex-1 items-center">
                    {loading ? (
                      <svg className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 animate-spin text-muted" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                      </svg>
                    ) : (
                      <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-muted" />
                    )}
                    <input
                      ref={inputRef}
                      type="text"
                      enterKeyHint="search"
                      inputMode="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Şarkı veya sanatçı ara..."
                      className="min-w-0 w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                      aria-label="Arama"
                      aria-expanded={allItems.length > 0}
                      aria-haspopup="listbox"
                      aria-autocomplete="list"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="shrink-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface/80"
                  >
                    İptal
                  </button>
                </form>

                {results && allItems.length > 0 && (
                  <div role="listbox" aria-label="Arama önerileri" className="overflow-hidden border-t border-border">
                    {hasArtists && (
                      <>
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Sanatçılar</p>
                        {results.artists.map((artist, i) => {
                          const idx = artistOffset + i;
                          const isActive = idx === activeIndex;
                          return (
                            <Link
                              key={artist.id}
                              href={artistPath(artist.slug)}
                              role="option"
                              aria-selected={isActive}
                              onClick={close}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-accent/10 text-accent" : "text-foreground"}`}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">♪</span>
                              <span className="min-w-0 flex-1 truncate font-medium">{artist.name}</span>
                              <span className="shrink-0 text-xs text-muted">{artist.songCount} şarkı</span>
                            </Link>
                          );
                        })}
                      </>
                    )}
                    {hasSongs && (
                      <>
                        <p className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted ${hasArtists ? "border-t border-border pt-2 mt-1" : "pt-2"}`}>Şarkılar</p>
                        {results.songs.map((song, i) => {
                          const idx = songOffset + i;
                          const isActive = idx === activeIndex;
                          return (
                            <Link
                              key={song.id}
                              href={chordPath(song.artistSlug, song.slug)}
                              role="option"
                              aria-selected={isActive}
                              onClick={close}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-accent/10 text-accent" : "text-foreground"}`}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">♫</span>
                              <span className="min-w-0 flex-1 truncate font-medium">{song.title}</span>
                              <span className="shrink-0 truncate text-xs text-muted">{song.artistName}</span>
                            </Link>
                          );
                        })}
                      </>
                    )}
                    <div className="border-t border-border px-3 py-2">
                      <button type="button" onClick={handleSubmit as unknown as React.MouseEventHandler} className="text-xs text-muted">
                        &ldquo;{query}&rdquo; için tüm sonuçlar →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
