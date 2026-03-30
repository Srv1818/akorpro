import Link from "next/link";
import { ArtistFilterSearch } from "@/components/content/artist-filter-search";
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

export function SongFilters({ basePath, current, facets }: Props) {
  const { artists, keys, difficulties } = facets;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <form method="get" className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Sanatçı</span>
          <ArtistFilterSearch
            key={current.sanatci ?? ""}
            artists={artists}
            defaultSlug={current.sanatci}
          />
        </div>
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
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-muted"
          >
            Uygula
          </button>
          <Link
            href={basePath}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-bg"
          >
            Sıfırla
          </Link>
        </div>
      </form>
    </div>
  );
}
