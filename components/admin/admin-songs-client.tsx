"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { chordPath } from "@/lib/paths";

type Song = {
  id: string;
  title: string;
  slug: string;
  artistSlug: string;
  artistName: string;
  originalKey: string;
  difficulty: string;
  keyMode?: string;
  genre: string;
  moderationStatus: string;
};

const EMPTY: Song[] = [];

export function AdminSongsClient() {
  const [songs, setSongs] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/songs");
      if (res.ok) {
        const data = await res.json();
        setSongs(data.songs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (typeof v === "string" && v.trim()) body[k] = v.trim(); });
    if (body.capo) body.capo = Number(body.capo);
    if (body.popularity) body.popularity = Number(body.popularity);

    const url = editId ? `/api/admin/songs/${editId}` : "/api/admin/songs";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg(res.ok ? (editId ? "Güncellendi." : `Oluşturuldu: ${data.id}`) : (data.error ?? "Hata."));
    if (res.ok) { setShowForm(false); setEditId(null); fetchSongs(); }
  }

  async function onDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/songs/${id}`, { method: "DELETE" });
    if (res.ok) fetchSongs();
  }

  function startEdit(song: Song) {
    setEditId(song.id);
    setShowForm(true);
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      {msg ? <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => { setShowForm(!showForm); setEditId(null); }} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          {showForm ? "Formu kapat" : "Yeni şarkı"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <input name="title" placeholder="Başlık *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="slug" placeholder="Slug *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="artistName" placeholder="Sanatçı adı *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="artistSlug" placeholder="Sanatçı slug *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="originalKey" placeholder="Ton (Am, Em…) *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <select name="difficulty" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
            <option value="">Zorluk *</option>
            <option value="kolay">Kolay</option>
            <option value="orta">Orta</option>
            <option value="zor">Zor</option>
          </select>
          <select name="keyMode" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
            <option value="">Ton modu *</option>
            <option value="major">Majör</option>
            <option value="natural">Doğal Minör</option>
            <option value="harmonic">Harmonik Minör</option>
            <option value="melodic">Melodik Minör</option>
          </select>
          <input name="genre" placeholder="Tür (Rock, Pop…) *" required className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="tempo" placeholder="Tempo (BPM)" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="timeSignature" placeholder="Ölçü (4/4)" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="tuning" placeholder="Akort (Standard)" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="capo" type="number" min="0" placeholder="Kapo" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="popularity" type="number" placeholder="Popülerlik" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <input name="copyrightSource" placeholder="Telif notu" className="col-span-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
          <textarea name="chordBody" placeholder="Akor + söz gövdesi *" required rows={6} className="col-span-full rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono" />
          <div className="col-span-full flex gap-2">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              {editId ? "Güncelle" : "Oluştur"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="rounded-lg border border-border px-4 py-2 text-sm text-muted">
              İptal
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-border bg-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Sanatçı</th>
              <th className="px-4 py-3 font-medium">Ton</th>
              <th className="px-4 py-3 font-medium">Zorluk</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={chordPath(s.artistSlug, s.slug)} className="font-medium text-foreground hover:text-accent">
                    {s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{s.artistName}</td>
                <td className="px-4 py-3 font-mono text-chord-major">{s.originalKey}</td>
                <td className="px-4 py-3 capitalize text-muted">{s.difficulty}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.moderationStatus === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : s.moderationStatus === "pending" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}>
                    {s.moderationStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(s)} className="text-xs text-accent hover:underline">
                      Düzenle
                    </button>
                    <button type="button" onClick={() => onDelete(s.id)} className="text-xs text-red-500 hover:underline">
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {songs.length === 0 ? <p className="p-6 text-center text-sm text-muted">Henüz şarkı yok.</p> : null}
      </div>
    </div>
  );
}
