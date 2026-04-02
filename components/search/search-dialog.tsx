"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
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

type SearchDialogProps = {
  placeholder?: string;
};

export function SearchDialog({ placeholder = "Şarkı veya sanatçı ara..." }: SearchDialogProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Dropdown'ın açık/kapalı durumu
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Dışarı tıklanınca dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ctrl+K kısayolu
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setIsOpen(true);
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
      if (val.length >= 2) setIsOpen(true);
      else setIsOpen(false);

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

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const totalItems = allItems.length > 0 ? allItems.length : popularItems.length;
    
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || totalItems === 0) return;

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
        setIsOpen(false);
        window.location.href = item.href;
      }
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="relative isolate z-0 w-full max-w-full min-w-0">
      {/* Doğrudan yazılabilir arama kutusu */}
      <div className="relative z-0 flex w-full min-w-0 items-center">
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

        <input
          id={inputId}
          name="q"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="min-w-0 w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent md:pl-12 md:pr-20"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-dropdown"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
        />

        {loading ? (
          <div className="pointer-events-none absolute right-3 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-accent" />
          </div>
        ) : (
          <kbd className="pointer-events-none absolute right-3 hidden rounded border border-border bg-bg px-2 py-0.5 font-mono text-[10px] text-muted shadow-sm md:inline">
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* Sonuçların gösterildiği açılır liste (Dropdown) */}
      {isOpen && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-bg shadow-xl">
          <ul
            ref={listRef}
            id="search-dropdown"
            role="listbox"
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {/* Şarkı ve Sanatçı Sonuçları */}
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
                  onClick={() => setIsOpen(false)}
                  className="block"
                  tabIndex={-1}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-2 text-xs text-muted">{item.sub}</span>
                </Link>
              </li>
            ))}

            {/* Sonuç Yoksa Popüler Sanatçılar */}
            {results?.empty && popularItems.length > 0 && (
              <>
                <li className="px-3 py-2 text-xs font-medium text-muted">
                  Sonuç bulunamadı. Popüler sanatçılar:
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
                      onClick={() => setIsOpen(false)}
                      className="block"
                      tabIndex={-1}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-2 text-xs text-muted">{item.sub}</span>
                    </Link>
                  </li>
                ))}
                <li className="mt-2 border-t border-border px-3 pb-1 pt-3">
                  <Link
                    href="/katki"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Bu şarkı eksik mi? Katkıda bulunun &rarr;
                  </Link>
                </li>
              </>
            )}

            {/* Arıyor (Yükleniyor) ve Sonuç Yok Durumu */}
            {!results && !loading && (
              <li className="px-3 py-6 text-center text-sm text-muted">
                Aranıyor...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}