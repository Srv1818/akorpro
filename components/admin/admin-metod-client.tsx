"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { slugify } from "@/lib/seo/slug";

type Metod = {
  id: string;
  title: string;
  slug: string;
  description: string;
  bolumler: { dersler: unknown[] }[];
};

function dersSayisi(m: Metod) {
  return m.bolumler?.reduce((t, b) => t + (b.dersler?.length ?? 0), 0) ?? 0;
}

export function AdminMetodClient() {
  const [metodlar, setMetodlar] = useState<Metod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [description, setDescription] = useState("");

  const nextSlug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    if (!showForm || slugDirty) return;
    setSlug(nextSlug);
  }, [nextSlug, showForm, slugDirty]);

  const fetchMetodlar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metodlar");
      if (res.ok) setMetodlar((await res.json()).metodlar ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetodlar(); }, [fetchMetodlar]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch("/api/admin/metodlar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), slug: slug.trim(), description: description.trim() }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Oluşturuldu. Düzenlemek için "Düzenle"ye tıkla.` : (data.error ?? "Hata."));
    if (res.ok) {
      setShowForm(false);
      setTitle(""); setSlug(""); setSlugDirty(false); setDescription("");
      fetchMetodlar();
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Bu metodu silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/metodlar?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchMetodlar();
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      {msg ? <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
        >
          {showForm ? "Formu kapat" : "Yeni metod ekle"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Başlık *"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <input
              placeholder="Slug *"
              required
              value={slug}
              onChange={(e) => { setSlugDirty(true); setSlug(e.currentTarget.value); }}
              onBlur={() => { setSlug(slugify(slug)); setSlugDirty(true); }}
              className="rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm"
            />
          </div>
          <input
            placeholder="Kısa açıklama"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <div>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              Oluştur
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-border bg-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Bölüm / Ders</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {metodlar.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{m.slug}</td>
                <td className="px-4 py-3 text-muted">
                  {m.bolumler?.length ?? 0} bölüm · {dersSayisi(m)} ders
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/metod/${m.id}`} className="text-xs text-accent hover:underline">
                      Düzenle
                    </Link>
                    <button type="button" onClick={() => onDelete(m.id)} className="text-xs text-red-500 hover:underline">
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {metodlar.length === 0 && <p className="p-6 text-center text-sm text-muted">Henüz metod yok.</p>}
      </div>
    </div>
  );
}
