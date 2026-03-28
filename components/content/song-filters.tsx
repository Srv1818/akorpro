import Link from "next/link";
import type { FilterFacets } from "@/lib/types/content";

type Props = {
  basePath: string;
  current: {
    harf?: string;
    sanatci?: string;
    ton?: string;
    zorluk?: string;
  };
  facets: FilterFacets;
};

function buildQuery(next: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  Object.entries(next).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

function withoutKey(c: Props["current"], key: keyof Props["current"]): Props["current"] {
  const n = { ...c };
  delete n[key];
  return n;
}

export function SongFilters({ basePath, current, facets }: Props) {
  const { artists, keys, difficulties, letters } = facets;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div>
        <p className="text-sm font-medium text-foreground">Harf</p>
        <div className="mt-2 flex max-w-full flex-wrap gap-1">
          <FilterPill href={basePath + buildQuery(withoutKey(current, "harf"))} active={!current.harf}>
            Tümü
          </FilterPill>
          {letters.map((L) => {
            if (L === current.harf) {
              return (
                <FilterPill key={L} href={basePath + buildQuery(withoutKey(current, "harf"))} active>
                  {L}
                </FilterPill>
              );
            }
            return (
              <FilterPill key={L} href={basePath + buildQuery({ ...current, harf: L })} active={false}>
                {L}
              </FilterPill>
            );
          })}
        </div>
      </div>

      <form method="get" className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Sanatçı</span>
          <select
            name="sanatci"
            defaultValue={current.sanatci ?? ""}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-foreground"
          >
            <option value="">Tümü</option>
            {artists.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Ton</span>
          <select
            name="ton"
            defaultValue={current.ton ?? ""}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-foreground"
          >
            <option value="">Tümü</option>
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Zorluk</span>
          <select
            name="zorluk"
            defaultValue={current.zorluk ?? ""}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-foreground"
          >
            <option value="">Tümü</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        {current.harf ? <input type="hidden" name="harf" value={current.harf} /> : null}
        <div className="flex flex-wrap items-end gap-2 sm:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
          >
            Uygula
          </button>
          <Link
            href={basePath}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-bg"
          >
            Sıfırla
          </Link>
        </div>
      </form>

      <p className="text-xs text-muted">
        Filtreli liste URL’leri kanonik değildir; arama motorları için noindex (ARCHITECTURE Faz 2).
      </p>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium ${
        active ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted hover:bg-bg"
      }`}
    >
      {children}
    </Link>
  );
}
