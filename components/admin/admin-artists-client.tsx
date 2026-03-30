"use client";

import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import { slugify } from "@/lib/seo/slug";

type Artist = {
  id: string;
  name: string;
  slug: string;
  genre?: string;
  songCount: number;
  popularity?: number;
};

export function AdminArtistsClient() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);

  const nextSlug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!showForm) return;
    if (slugDirty) return;
    setSlug(nextSlug);
  }, [nextSlug, showForm, slugDirty]);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/artists");
      if (res.ok) setArtists((await res.json()).artists ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (typeof v === "string" && v.trim()) body[k] = v.trim(); });
    if (body.songCount) body.songCount = Number(body.songCount);
    if (body.popularity) body.popularity = Number(body.popularity);

    const res = await fetch("/api/admin/artists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg(res.ok ? `Oluşturuldu: ${data.id}` : (data.error ?? "Hata."));
    if (res.ok) {
      setShowForm(false);
      setName("");
      setSlug("");
      setSlugDirty(false);
      fetchArtists();
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/artists?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchArtists();
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      {msg ? <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      <div className="mb-4">
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          {showForm ? "Formu kapat" : "Yeni sanatçı"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Sanatçı adı *"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="slug"
            placeholder="Slug *"
            required
            value={slug}
            onChange={(e) => { setSlugDirty(true); setSlug(e.currentTarget.value); }}
            onBlur={() => {
              const v = slugify(slug);
              setSlug(v);
              setSlugDirty(true);
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input name="genre" placeholder="Tür" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="imageUrl" placeholder="Görsel URL" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="songCount" type="number" placeholder="Şarkı sayısı" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="popularity" type="number" placeholder="Popülerlik" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <div className="col-span-full">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              Oluştur
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-border bg-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Sanatçı</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Tür</th>
              <th className="px-4 py-3 font-medium">Şarkı</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{a.slug}</td>
                <td className="px-4 py-3 text-muted">{a.genre ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{a.songCount}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onDelete(a.id)} className="text-xs text-red-500 hover:underline">
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {artists.length === 0 ? <p className="p-6 text-center text-sm text-muted">Henüz sanatçı yok.</p> : null}
      </div>
    </div>
  );
}
