"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { chordPath, artistPath } from "@/lib/paths";

type Song = { id: string; title: string; slug: string; artistSlug: string; artistName: string };
type Artist = { id: string; name: string; slug: string; songCount: number };
type Results = { songs: Song[]; artists: Artist[]; empty: boolean };

type SearchDialogProps = {
  placeholder?: string;
  defaultValue?: string;
};

export function SearchDialog({
  placeholder = "Şarkı veya sanatçı ara...",
  defaultValue = "",
}: SearchDialogProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: Results = await res.json();
      setResults(data);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      // network error — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query.trim()), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const allItems: { href: string; primary: string; secondary?: string }[] = [
    ...(results?.artists ?? []).map((a) => ({
      href: artistPath(a.slug),
      primary: a.name,
      secondary: `${a.songCount} şarkı`,
    })),
    ...(results?.songs ?? []).map((s) => ({
      href: chordPath(s.artistSlug, s.slug),
      primary: s.title,
      secondary: s.artistName,
    })),
  ];

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || allItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item) {
        setOpen(false);
        router.push(item.href);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/arama?q=${encodeURIComponent(q)}`);
  }

  const hasArtists = (results?.artists.length ?? 0) > 0;
  const hasSongs = (results?.songs.length ?? 0) > 0;
  let artistOffset = 0;
  let songOffset = results?.artists.length ?? 0;

  return (
    <div className="relative w-full min-w-0">
      <form onSubmit={handleSubmit} className="flex w-full min-w-0 items-center">
        <div className="relative flex min-w-0 flex-1 items-center">
          {loading ? (
            <svg
              className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 animate-spin text-muted md:left-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
          ) : (
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
              className="pointer-events-none absolute left-3 shrink-0 text-muted md:left-4"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results && allItems.length > 0) setOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            aria-label="Arama"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            className="min-w-0 w-full rounded-l-xl border border-r-0 border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent md:pl-12"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-r-xl border border-border bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-muted active:scale-95"
        >
          Ara
        </button>
      </form>

      {open && allItems.length > 0 && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Arama önerileri"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          {hasArtists && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Sanatçılar
              </p>
              {results!.artists.map((artist, i) => {
                const idx = artistOffset + i;
                const isActive = idx === activeIndex;
                return (
                  <Link
                    key={artist.id}
                    href={artistPath(artist.slug)}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-accent/10 text-accent" : "text-foreground hover:bg-accent/5"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs">🎤</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{artist.name}</span>
                    <span className="shrink-0 text-xs text-muted">{artist.songCount} şarkı</span>
                  </Link>
                );
              })}
            </>
          )}

          {hasSongs && (
            <>
              <p className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted ${hasArtists ? "border-t border-border pt-2 mt-1" : "pt-2"}`}>
                Şarkılar
              </p>
              {results!.songs.map((song, i) => {
                const idx = songOffset + i;
                const isActive = idx === activeIndex;
                return (
                  <Link
                    key={song.id}
                    href={chordPath(song.artistSlug, song.slug)}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-accent/10 text-accent" : "text-foreground hover:bg-accent/5"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs">🎵</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{song.title}</span>
                    <span className="shrink-0 truncate text-xs text-muted">{song.artistName}</span>
                  </Link>
                );
              })}
            </>
          )}

          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              &ldquo;{query}&rdquo; için tüm sonuçlar &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
