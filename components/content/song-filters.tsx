import Link from "next/link";
import { ArtistFilterSearch } from "@/components/content/artist-filter-search";
import { FilterSheet } from "@/components/content/filter-sheet";
import type { FilterFacets } from "@/lib/types/content";

type Props = {
  basePath: string;
  current: {
    harf?: string;
    sanatci?: string;
    ton?: string;
    zorluk?: string;
    sarkiAdi?: string;
    mod?: string;
    tur?: string;
    olcu?: string;
    bpm?: string;
  };
  facets: FilterFacets;
};

const inputCls =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40";

function countActive(current: Props["current"]) {
  return [current.sanatci, current.ton, current.zorluk, current.sarkiAdi, current.mod, current.tur, current.olcu, current.bpm]
    .filter(Boolean).length;
}

export function SongFilters({ basePath, current, facets }: Props) {
  const { artists, keys, difficulties, genres, timeSignatures } = facets;
  const active = countActive(current);

  /* ── Masaüstü formu ────────────────────────────────────────────── */
  const desktopForm = (
    <form method="get" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Sanatçı</span>
        <ArtistFilterSearch key={current.sanatci ?? ""} artists={artists} defaultSlug={current.sanatci} />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Şarkı adı</span>
        <input name="sarkiAdi" defaultValue={current.sarkiAdi ?? ""} placeholder="Şarkı ara..." className={inputCls} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Ton</span>
        <select name="ton" defaultValue={current.ton ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Zorluk</span>
        <select name="zorluk" defaultValue={current.zorluk ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Mod</span>
        <select name="mod" defaultValue={current.mod ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          <option value="major">Majör</option>
          <option value="natural">Doğal Minör</option>
          <option value="harmonic">Harmonik Minör</option>
          <option value="melodic">Melodik Minör</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Tür</span>
        <select name="tur" defaultValue={current.tur ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Ölçü</span>
        <select name="olcu" defaultValue={current.olcu ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {timeSignatures.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">BPM</span>
        <input name="bpm" type="number" defaultValue={current.bpm ?? ""} placeholder="BPM" className={inputCls} />
      </label>

      {current.harf ? <input type="hidden" name="harf" value={current.harf} /> : null}

      <div className="col-span-full flex flex-wrap items-end justify-end gap-3">
        <Link href={basePath} className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
          Sıfırla
        </Link>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          Uygula
        </button>
      </div>
    </form>
  );

  /* ── Mobil formu (bottom sheet içinde, tek sütun) ──────────────── */
  const mobileForm = (
    <form method="get" className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Sanatçı</span>
        <ArtistFilterSearch key={(current.sanatci ?? "") + "-m"} artists={artists} defaultSlug={current.sanatci} />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Şarkı adı</span>
        <input name="sarkiAdi" defaultValue={current.sarkiAdi ?? ""} placeholder="Şarkı ara..." className={inputCls} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Ton</span>
        <select name="ton" defaultValue={current.ton ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Zorluk</span>
        <select name="zorluk" defaultValue={current.zorluk ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Mod</span>
        <select name="mod" defaultValue={current.mod ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          <option value="major">Majör</option>
          <option value="natural">Doğal Minör</option>
          <option value="harmonic">Harmonik Minör</option>
          <option value="melodic">Melodik Minör</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Tür</span>
        <select name="tur" defaultValue={current.tur ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Ölçü</span>
        <select name="olcu" defaultValue={current.olcu ?? ""} className={inputCls}>
          <option value="">Tümü</option>
          {timeSignatures.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">BPM</span>
        <input name="bpm" type="number" defaultValue={current.bpm ?? ""} placeholder="BPM" className={inputCls} />
      </label>

      {current.harf ? <input type="hidden" name="harf" value={current.harf} /> : null}

      <div className="flex flex-wrap items-end justify-end gap-3 pt-2">
        <Link href={basePath} className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
          Sıfırla
        </Link>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          Uygula
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobil: sadece "Filtrele" butonu görünür, form bottom sheet'te açılır */}
      <div className="md:hidden">
        <FilterSheet activeCount={active}>
          {mobileForm}
        </FilterSheet>
      </div>

      {/* Masaüstü: form doğrudan sayfada görünür */}
      <div className="hidden md:block space-y-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        {desktopForm}
      </div>
    </>
  );
}
