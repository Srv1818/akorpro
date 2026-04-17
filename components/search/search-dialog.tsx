"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

type SearchDialogProps = {
  placeholder?: string;
  defaultValue?: string;
};

export function SearchDialog({
  placeholder = "Şarkı veya sanatçı ara...",
  defaultValue = "",
}: SearchDialogProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/arama?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 items-center">
      <div className="relative flex min-w-0 flex-1 items-center">
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
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 w-full rounded-l-xl border border-r-0 border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent md:pl-12"
          aria-label="Arama"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-r-xl border border-border bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-muted active:scale-95"
      >
        Ara
      </button>
    </form>
  );
}
