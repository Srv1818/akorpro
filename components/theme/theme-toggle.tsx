"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const ready = resolvedTheme !== undefined;
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={dark ? "Açık tema" : "Koyu tema"}
    >
      {ready ? (
        dark ? (
          <SunIcon className="h-[1.125rem] w-[1.125rem] text-amber-300" />
        ) : (
          <MoonIcon className="h-[1.125rem] w-[1.125rem] text-zinc-600" />
        )
      ) : (
        <span className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      )}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
