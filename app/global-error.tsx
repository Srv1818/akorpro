"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-100">
        <h1 className="text-lg font-semibold">Kritik hata</h1>
        <p className="max-w-md text-sm text-zinc-400">Uygulama yüklenemedi. Lütfen sayfayı yenileyin.</p>
        {error.digest ? (
          <p className="font-mono text-xs text-zinc-500" suppressHydrationWarning>
            Ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Yeniden dene
        </button>
      </body>
    </html>
  );
}
