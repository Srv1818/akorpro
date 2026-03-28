"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  originalKey: string;
  chordBody: string;
};

export function PreviewClient({ originalKey, chordBody }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sceneMode, setSceneMode] = useState(false);

  const fromUrl = Number(searchParams.get("transpose") ?? "0");
  const initial = Number.isFinite(fromUrl) ? fromUrl : 0;
  const [semitones, setSemitones] = useState(initial);

  useEffect(() => {
    setSemitones(initial);
  }, [initial]);

  const replaceTranspose = useCallback(
    (n: number) => {
      setSemitones(n);
      const q = n === 0 ? "" : `?transpose=${n}`;
      router.replace(`${pathname}${q}`, { scroll: false });
    },
    [pathname, router],
  );

  const resetOriginal = useCallback(() => {
    setSemitones(0);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <div className={sceneMode ? "rounded-2xl ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""}>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Önizleme görünümü</p>
          <p className="text-xs text-muted">
            Orijinal ton sunucuda sabit: <span className="font-mono text-foreground">{originalKey}</span> · Transpoze yalnızca
            görünüm (Faz 2 mock)
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={sceneMode}
            onChange={(e) => setSceneMode(e.target.checked)}
            className="h-4 w-4 rounded border-border text-accent"
          />
          Sahne modu (kontrast iskeleti)
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Transpoze:</span>
        {[-2, -1, 0, 1, 2].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => replaceTranspose(n)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              semitones === n
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-bg text-foreground hover:border-accent/50"
            }`}
          >
            {n === 0 ? "0" : n > 0 ? `+${n}` : `${n}`}
          </button>
        ))}
        <button
          type="button"
          onClick={resetOriginal}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
        >
          Orijinale dön
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Görüntülenen transpoze:{" "}
        <span className="font-mono text-foreground">
          {semitones === 0 ? "0" : semitones > 0 ? `+${semitones}` : semitones} yarım ton
        </span>
        {semitones !== 0 ? (
          <span className="block sm:inline sm:pl-2">· Parametreli URL kanonik değildir (ARCHITECTURE).</span>
        ) : null}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          title="Faz 3 — Firebase"
          className="rounded-lg bg-accent/50 px-4 py-2 text-sm font-medium text-accent-foreground opacity-60"
        >
          Kaydet
        </button>
        <button
          type="button"
          disabled
          title="Faz 3 — oturum gerekir"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted opacity-60"
        >
          Çalma listeme ekle
        </button>
      </div>

      <article className="mt-8 rounded-2xl border border-border bg-bg p-6">
        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">{chordBody}</pre>
      </article>
    </div>
  );
}
