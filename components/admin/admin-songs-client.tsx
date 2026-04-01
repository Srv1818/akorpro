"use client";

import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { chordPath } from "@/lib/paths";
import { slugify } from "@/lib/seo/slug";

type Song = {
  id: string;
  title: string;
  slug: string;
  artistId?: string;
  artistSlug: string;
  artistName: string;
  originalKey: string;
  difficulty: string;
  keyMode?: string;
  genre: string;
  tempo?: number | string;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  popularity?: number;
  copyrightSource?: string;
  chordBody?: string;
  moderationStatus: string;
};

const EMPTY: Song[] = [];

export function AdminSongsClient() {
  const [songs, setSongs] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [songSlug, setSongSlug] = useState("");
  const [songSlugDirty, setSongSlugDirty] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [artistSlugDirty, setArtistSlugDirty] = useState(false);
  const [originalKey, setOriginalKey] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [keyMode, setKeyMode] = useState("");
  const [genre, setGenre] = useState("");
  const [tempo, setTempo] = useState("");
  const [timeSignature, setTimeSignature] = useState("");
  const [tuning, setTuning] = useState("");
  const [capo, setCapo] = useState("");
  const [popularity, setPopularity] = useState("");
  const [copyrightSource, setCopyrightSource] = useState("");
  const [chordBody, setChordBody] = useState("");

  function resetFormState() {
    setEditId(null);
    setTitle("");
    setSongSlug("");
    setSongSlugDirty(false);
    setArtistName("");
    setArtistSlug("");
    setArtistSlugDirty(false);
    setOriginalKey("");
    setDifficulty("");
    setKeyMode("");
    setGenre("");
    setTempo("");
    setTimeSignature("");
    setTuning("");
    setCapo("");
    setPopularity("");
    setCopyrightSource("");
    setChordBody("");
  }

  const nextSongSlug = useMemo(() => slugify(title), [title]);
  const nextArtistSlug = useMemo(() => slugify(artistName), [artistName]);

  useEffect(() => {
    if (!showForm) return;
    if (!songSlugDirty) setSongSlug(nextSongSlug);
  }, [nextSongSlug, showForm, songSlugDirty]);

  useEffect(() => {
    if (!showForm) return;
    if (!artistSlugDirty) setArtistSlug(nextArtistSlug);
  }, [nextArtistSlug, showForm, artistSlugDirty]);

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
    if (saving) return;
    setSaving(true);
    setMsg("");
    const body: Record<string, unknown> = {
      title: title.trim(),
      slug: songSlug.trim(),
      artistName: artistName.trim(),
      artistSlug: artistSlug.trim(),
      originalKey: originalKey.trim(),
      difficulty: difficulty.trim(),
      keyMode: keyMode.trim(),
      genre: genre.trim(),
      chordBody: chordBody.trim(),
    };
    if (tempo.trim()) body.tempo = tempo.trim();
    if (timeSignature.trim()) body.timeSignature = timeSignature.trim();
    if (tuning.trim()) body.tuning = tuning.trim();
    if (capo.trim()) body.capo = Number(capo.trim());
    if (popularity.trim()) body.popularity = Number(popularity.trim());
    if (copyrightSource.trim()) body.copyrightSource = copyrightSource.trim();

    const url = editId ? `/api/admin/songs/${editId}` : "/api/admin/songs";
    const method = editId ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: unknown = null;
      let text: string | null = null;
      try {
        data = await res.json();
      } catch {
        try {
          text = await res.text();
        } catch {
          text = null;
        }
      }

      const errFromJson =
        data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : null;

      if (!res.ok) {
        setMsg(errFromJson ?? (text && text.trim() ? text.trim() : "Hata."));
        return;
      }

      const createdId =
        data && typeof data === "object" && "id" in data && typeof (data as { id?: unknown }).id === "string"
          ? (data as { id: string }).id
          : null;

      setMsg(editId ? "Güncellendi." : `Oluşturuldu${createdId ? `: ${createdId}` : "."}`);
      setShowForm(false);
      resetFormState();
      fetchSongs();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "İstek başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/songs/${id}`, { method: "DELETE" });
    if (res.ok) fetchSongs();
  }

  async function startEdit(song: Song) {
    setEditId(song.id);
    setShowForm(true);
    setLoadingEdit(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/songs/${song.id}`);
      const data = (await res.json()) as { song?: Song; error?: string };
      if (!res.ok || !data.song) {
        setMsg(data.error ?? "Şarkı detayı alınamadı.");
        return;
      }
      const s = data.song;
      setTitle(s.title ?? "");
      setSongSlug(s.slug ?? "");
      setSongSlugDirty(false);
      setArtistName(s.artistName ?? "");
      setArtistSlug(s.artistSlug ?? "");
      setArtistSlugDirty(false);
      setOriginalKey(s.originalKey ?? "");
      setDifficulty(s.difficulty ?? "");
      setKeyMode(s.keyMode ?? "");
      setGenre(s.genre ?? "");
      setTempo(typeof s.tempo === "number" || typeof s.tempo === "string" ? String(s.tempo) : "");
      setTimeSignature(s.timeSignature ?? "");
      setTuning(s.tuning ?? "");
      setCapo(typeof s.capo === "number" ? String(s.capo) : "");
      setPopularity(typeof s.popularity === "number" ? String(s.popularity) : "");
      setCopyrightSource(s.copyrightSource ?? "");
      setChordBody(s.chordBody ?? "");
    } catch {
      setMsg("Şarkı detayı alınamadı.");
    } finally {
      setLoadingEdit(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      {msg ? <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetFormState();
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
        >
          {showForm ? "Formu kapat" : "Yeni şarkı"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <input
            name="title"
            placeholder="Başlık *"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="slug"
            placeholder="Slug *"
            required
            value={songSlug}
            onChange={(e) => { setSongSlugDirty(true); setSongSlug(e.currentTarget.value); }}
            onBlur={() => {
              const v = slugify(songSlug);
              setSongSlug(v);
              setSongSlugDirty(true);
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="artistName"
            placeholder="Sanatçı adı *"
            required
            value={artistName}
            onChange={(e) => setArtistName(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="artistSlug"
            placeholder="Sanatçı slug *"
            required
            value={artistSlug}
            onChange={(e) => { setArtistSlugDirty(true); setArtistSlug(e.currentTarget.value); }}
            onBlur={() => {
              const v = slugify(artistSlug);
              setArtistSlug(v);
              setArtistSlugDirty(true);
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="originalKey"
            placeholder="Ton (Am, Em…) *"
            required
            value={originalKey}
            onChange={(e) => setOriginalKey(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <select
            name="difficulty"
            required
            value={difficulty}
            onChange={(e) => setDifficulty(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          >
            <option value="">Zorluk *</option>
            <option value="kolay">Kolay</option>
            <option value="orta">Orta</option>
            <option value="zor">Zor</option>
          </select>
          <select
            name="keyMode"
            required
            value={keyMode}
            onChange={(e) => setKeyMode(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          >
            <option value="">Ton modu *</option>
            <option value="major">Majör</option>
            <option value="natural">Doğal Minör</option>
            <option value="harmonic">Harmonik Minör</option>
            <option value="melodic">Melodik Minör</option>
          </select>
          <input
            name="genre"
            placeholder="Tür (Rock, Pop…) *"
            required
            value={genre}
            onChange={(e) => setGenre(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="tempo"
            placeholder="Tempo (BPM)"
            value={tempo}
            onChange={(e) => setTempo(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="timeSignature"
            placeholder="Ölçü (4/4)"
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="tuning"
            placeholder="Akort (Standard)"
            value={tuning}
            onChange={(e) => setTuning(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="capo"
            type="number"
            min="0"
            placeholder="Kapo"
            value={capo}
            onChange={(e) => setCapo(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="popularity"
            type="number"
            placeholder="Popülerlik"
            value={popularity}
            onChange={(e) => setPopularity(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            name="copyrightSource"
            placeholder="Telif notu"
            value={copyrightSource}
            onChange={(e) => setCopyrightSource(e.currentTarget.value)}
            className="col-span-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <textarea
            name="chordBody"
            placeholder="Akor + söz gövdesi *"
            required
            rows={6}
            value={chordBody}
            onChange={(e) => setChordBody(e.currentTarget.value)}
            className="col-span-full rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono"
          />
          {loadingEdit ? <p className="col-span-full text-xs text-muted">Mevcut kayıt yükleniyor…</p> : null}
          <div className="col-span-full flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Kaydediliyor…" : (editId ? "Güncelle" : "Oluştur")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetFormState();
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted"
            >
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
