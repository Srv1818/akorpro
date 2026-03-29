"use client";

import { useMemo, useRef, useState, useEffect } from "react";

type Artist = { slug: string; name: string };

type Props = {
  artists: Artist[];
  defaultSlug?: string;
};

function norm(s: string) {
  return s.toLocaleLowerCase("tr-TR").trim();
}

export function ArtistFilterSearch({ artists, defaultSlug }: Props) {
  const [query, setQuery] = useState(() => {
    if (!defaultSlug) return "";
    return artists.find((a) => a.slug === defaultSlug)?.name ?? "";
  });
  const [committedSlug, setCommittedSlug] = useState(defaultSlug ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return artists.filter((a) => norm(a.name).includes(q)).slice(0, 80);
  }, [artists, query]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function onInputChange(v: string) {
    setQuery(v);
    setCommittedSlug("");
    setOpen(v.trim().length > 0);
  }

  function pick(a: Artist) {
    setQuery(a.name);
    setCommittedSlug(a.slug);
    setOpen(false);
  }

  function clear() {
    setQuery("");
    setCommittedSlug("");
    setOpen(false);
  }

  const showList = open && norm(query).length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="sanatci" value={committedSlug} />
      <div className="flex gap-1">
        <input
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            if (norm(query).length > 0) setOpen(true);
          }}
          placeholder="Sanatçı ara…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-foreground placeholder:text-muted"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls="artist-filter-suggestions"
        />
        {(query || committedSlug) && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-bg"
          >
            Temizle
          </button>
        )}
      </div>
      {showList ? (
        <ul
          id="artist-filter-suggestions"
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-bg py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Eşleşen sanatçı yok</li>
          ) : (
            filtered.map((a) => (
              <li key={a.slug} role="option">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(a)}
                  className="flex w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface"
                >
                  {a.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
