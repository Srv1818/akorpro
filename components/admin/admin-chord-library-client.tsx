"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { GUITAR_QUALITY_OPTIONS } from "@/lib/chords-db/guitar";

type ChordShape = {
  id: string;
  name: string;
  root: string;
  quality: string;
  fingering: string;
  fingers?: string;
};

export function AdminChordLibraryClient() {
  const [shapes, setShapes] = useState<ChordShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchShapes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chord-library");
      if (res.ok) setShapes((await res.json()).shapes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShapes(); }, [fetchShapes]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (typeof v === "string" && v.trim()) body[k] = v.trim(); });

    const res = await fetch("/api/admin/chord-library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text();
    let data: { id?: string; error?: string } = {};
    try {
      data = raw ? (JSON.parse(raw) as { id?: string; error?: string }) : {};
    } catch {
      data = {};
    }
    setMsg(res.ok ? `Oluşturuldu: ${data.id}` : (data.error ?? "Hata."));
    if (res.ok) { setShowForm(false); fetchShapes(); }
  }

  async function onDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/chord-library?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchShapes();
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      {msg ? <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      <div className="mb-4">
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          {showForm ? "Formu kapat" : "Yeni akor"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <input name="name" placeholder="Akor adı (C maj açık) *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="root" placeholder="Kök nota (C, G, Am…) *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <select name="quality" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
            <option value="">Kalite *</option>
            {GUITAR_QUALITY_OPTIONS.map((q) => (
              <option key={q.suffix} value={q.suffix}>{q.label}</option>
            ))}
          </select>
          <input name="fingering" placeholder="Parmak (x32010) *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono" />
          <input name="fingers" placeholder="Parmak no (032010)" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono" />
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
              <th className="px-4 py-3 font-medium">Akor</th>
              <th className="px-4 py-3 font-medium">Kök</th>
              <th className="px-4 py-3 font-medium">Kalite</th>
              <th className="px-4 py-3 font-medium">Parmak</th>
              <th className="px-4 py-3 font-medium">Numara</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {shapes.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 font-mono text-chord-major">{c.root}</td>
                <td className="px-4 py-3 text-muted">{c.quality}</td>
                <td className="px-4 py-3 font-mono text-sm">{c.fingering}</td>
                <td className="px-4 py-3 font-mono text-sm">{c.fingers ?? "-"}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onDelete(c.id)} className="text-xs text-red-500 hover:underline">
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shapes.length === 0 ? <p className="p-6 text-center text-sm text-muted">Henüz akor şekli yok.</p> : null}
      </div>
    </div>
  );
}
