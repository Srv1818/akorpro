"use client";

import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { chordPath } from "@/lib/paths";
import { gamlarModesForFamily } from "@/data/gamlar-scale-catalog";
import {
  inferKeyModeFromOriginalKey,
  keyModeToGamlarCatalogScaleId,
  keyModeToGamlarFamily,
  resolveSongGamlarScaleId,
} from "@/lib/music/key-mode-gamlar";
import { slugify } from "@/lib/seo/slug";
import type { KeyMode } from "@/lib/types/content";

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
  gamlarScaleId?: string;
  genre: string;
  tempo?: number | string;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  popularity?: number;
  copyrightSource?: string;
  chordBody?: string;
  showHarmonyDetails?: boolean;
  harmonyDetailsNotes?: string;
  moderationStatus: string;
};

type GeniusHit = {
  id: number;
  title: string;
  artist: string;
  fullTitle: string;
  url?: string;
  thumbnailUrl?: string;
};

const EMPTY: Song[] = [];

const KEY_MODES: readonly KeyMode[] = ["major", "natural", "harmonic", "melodic"];

export function AdminSongsClient() {
  const [songs, setSongs] = useState(EMPTY);
  const [publisherGateActive, setPublisherGateActive] = useState(false);
  const [canPublish, setCanPublish] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [songSlug, setSongSlug] = useState("");
  const [songSlugDirty, setSongSlugDirty] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [artistSlugDirty, setArtistSlugDirty] = useState(false);
  const [originalKey, setOriginalKey] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [keyMode, setKeyMode] = useState("");
  const [gamlarScaleId, setGamlarScaleId] = useState("");
  const [genre, setGenre] = useState("");
  const [tempo, setTempo] = useState("");
  const [timeSignature, setTimeSignature] = useState("");
  const [tuning, setTuning] = useState("");
  const [capo, setCapo] = useState("");
  const [popularity, setPopularity] = useState("");
  const [copyrightSource, setCopyrightSource] = useState("");
  const [showHarmonyDetails, setShowHarmonyDetails] = useState(true);
  const [harmonyDetailsNotes, setHarmonyDetailsNotes] = useState("");
  const [chordBody, setChordBody] = useState("");

  const [geniusQuery, setGeniusQuery] = useState("");
  const [geniusHits, setGeniusHits] = useState<GeniusHit[]>([]);
  const [geniusLoading, setGeniusLoading] = useState(false);
  const [geniusLyricsLoading, setGeniusLyricsLoading] = useState(false);
  const [geniusError, setGeniusError] = useState<string | null>(null);

  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

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
    setGamlarScaleId("");
    setGenre("");
    setTempo("");
    setTimeSignature("");
    setTuning("");
    setCapo("");
    setPopularity("");
    setCopyrightSource("");
    setShowHarmonyDetails(true);
    setHarmonyDetailsNotes("");
    setChordBody("");

    setGeniusQuery("");
    setGeniusHits([]);
    setGeniusLoading(false);
    setGeniusLyricsLoading(false);
    setGeniusError(null);

    setSpotifyLoading(false);
    setSpotifyError(null);
  }

  const nextSongSlug = useMemo(() => slugify(title), [title]);
  const nextArtistSlug = useMemo(() => slugify(artistName), [artistName]);

  const gamlarSubModes = useMemo(() => {
    if (!keyMode || !KEY_MODES.includes(keyMode as KeyMode)) return [];
    return [...gamlarModesForFamily(keyModeToGamlarFamily(keyMode as KeyMode))];
  }, [keyMode]);

  useEffect(() => {
    if (!editId) return;
    if (!songSlugDirty) setSongSlug(nextSongSlug);
  }, [nextSongSlug, editId, songSlugDirty]);

  useEffect(() => {
    if (!editId) return;
    if (!artistSlugDirty) setArtistSlug(nextArtistSlug);
  }, [nextArtistSlug, editId, artistSlugDirty]);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/songs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSongs(data.songs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { publisherGateActive?: boolean; canPublishSongs?: boolean }) => {
        if (typeof d.publisherGateActive === "boolean") setPublisherGateActive(d.publisherGateActive);
        if (typeof d.canPublishSongs === "boolean") setCanPublish(d.canPublishSongs);
      })
      .catch(() => {});
  }, []);

  const searchGenius = useCallback(async () => {
    const q = geniusQuery.trim();
    if (!q || geniusLoading) return;
    setGeniusLoading(true);
    setGeniusError(null);
    try {
      const res = await fetch("/api/admin/genius/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 8 }),
      });
      const data = (await res.json()) as { hits?: GeniusHit[]; error?: string };
      if (!res.ok) {
        setGeniusError(data.error ?? "Genius araması başarısız.");
        setGeniusHits([]);
        return;
      }
      setGeniusHits(Array.isArray(data.hits) ? data.hits : []);
    } catch (err) {
      setGeniusError(err instanceof Error ? err.message : "Genius araması başarısız.");
      setGeniusHits([]);
    } finally {
      setGeniusLoading(false);
    }
  }, [geniusLoading, geniusQuery]);

  const applyGeniusHit = useCallback(
    async (hit: GeniusHit) => {
      if (!hit?.id || geniusLyricsLoading) return;
      setGeniusLyricsLoading(true);
      setGeniusError(null);

      // Temel alanları doldur.
      setTitle(hit.title ?? "");
      setArtistName(hit.artist ?? "");
      setSongSlugDirty(false);
      setArtistSlugDirty(false);

      try {
        const res = await fetch("/api/admin/genius/lyrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId: hit.id }),
        });
        const data = (await res.json()) as { lyrics?: string; error?: string };
        if (!res.ok) {
          setGeniusError(data.error ?? "Lyrics alınamadı.");
          return;
        }
        const lyrics = typeof data.lyrics === "string" ? data.lyrics : "";
        if (lyrics.trim()) {
          setChordBody(lyrics.trim());
        }
      } catch (err) {
        setGeniusError(err instanceof Error ? err.message : "Lyrics alınamadı.");
      } finally {
        setGeniusLyricsLoading(false);
      }
    },
    [geniusLyricsLoading],
  );

  const fillFromSpotify = useCallback(async () => {
    if (spotifyLoading) return;
    const t = title.trim();
    const a = artistName.trim();
    if (!t || !a) {
      setSpotifyError("Spotify için önce başlık ve sanatçı adı girin.");
      return;
    }
    setSpotifyLoading(true);
    setSpotifyError(null);
    try {
      const res = await fetch("/api/admin/spotify/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, artist: a }),
      });
      const data = (await res.json()) as {
        resolved?: { tempo?: number; timeSignature?: string; originalKey?: string; keyMode?: "major" | "natural" };
        error?: string;
      };
      if (!res.ok) {
        setSpotifyError(data.error ?? "Spotify verisi alınamadı.");
        return;
      }
      const r = data.resolved;
      if (r?.tempo !== undefined) setTempo(String(Math.round(r.tempo)));
      if (r?.timeSignature) setTimeSignature(r.timeSignature);
      if (r?.originalKey) setOriginalKey(r.originalKey);

      if (r?.keyMode) {
        setKeyMode(r.keyMode);
        setGamlarScaleId(keyModeToGamlarCatalogScaleId(r.keyMode as KeyMode));
      }
    } catch (err) {
      setSpotifyError(err instanceof Error ? err.message : "Spotify verisi alınamadı.");
    } finally {
      setSpotifyLoading(false);
    }
  }, [artistName, spotifyLoading, title]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    if (!editId) {
      setMsg("Yeni şarkı ekleme bu sayfadan kaldırıldı. Üst menüden “Yeni şarkı ekle” ile ekleyin.");
      return;
    }
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
      gamlarScaleId: gamlarScaleId.trim(),
      genre: genre.trim(),
      chordBody: chordBody.trim(),
    };
    if (tempo.trim()) body.tempo = tempo.trim();
    if (timeSignature.trim()) body.timeSignature = timeSignature.trim();
    if (tuning.trim()) body.tuning = tuning.trim();
    if (capo.trim()) body.capo = Number(capo.trim());
    if (popularity.trim()) body.popularity = Number(popularity.trim());
    if (copyrightSource.trim()) body.copyrightSource = copyrightSource.trim();
    body.showHarmonyDetails = showHarmonyDetails;
    body.harmonyDetailsNotes = harmonyDetailsNotes;

    const url = `/api/admin/songs/${editId}`;
    const method = "PATCH";
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

      setMsg("Güncellendi.");
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
    if (publisherGateActive && !canPublish && song.moderationStatus === "approved") {
      setMsg("Yayında şarkıları yalnızca yayın yetkilisi düzenleyebilir.");
      return;
    }
    setEditId(song.id);
    setLoadingEdit(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/songs/${song.id}`, { cache: "no-store" });
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
      setGamlarScaleId(
        resolveSongGamlarScaleId(
          (s.keyMode as KeyMode | undefined) ?? inferKeyModeFromOriginalKey(s.originalKey ?? "C"),
          s.gamlarScaleId,
        ),
      );
      setGenre(s.genre ?? "");
      setTempo(typeof s.tempo === "number" || typeof s.tempo === "string" ? String(s.tempo) : "");
      setTimeSignature(s.timeSignature ?? "");
      setTuning(s.tuning ?? "");
      setCapo(typeof s.capo === "number" ? String(s.capo) : "");
      setPopularity(typeof s.popularity === "number" ? String(s.popularity) : "");
      setCopyrightSource(s.copyrightSource ?? "");
      setShowHarmonyDetails(s.showHarmonyDetails !== false);
      setHarmonyDetailsNotes(s.harmonyDetailsNotes ?? "");
      setChordBody(s.chordBody ?? "");
    } catch {
      setMsg("Şarkı detayı alınamadı.");
    } finally {
      setLoadingEdit(false);
    }
  }

  const lockedLive = publisherGateActive && !canPublish;
  const filteredSongs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => {
      const t = (s.title ?? "").toLowerCase();
      const a = (s.artistName ?? "").toLowerCase();
      return t.includes(q) || a.includes(q);
    });
  }, [songs, searchTerm]);

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      {msg ? <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      {publisherGateActive ? (
        <p className="mb-4 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-muted">
          {canPublish
            ? "Yayın yetkilisi olarak eklediğiniz şarkılar doğrudan yayına alınır; diğer adminlerinki önce beklemede kalır."
            : "Yeni şarkı ve içe aktarma kayıtlarınız beklemede kalır; yayın yetkilisi moderasyonda onaylar veya şarkıyı kendisi düzenleyip yayına alır. Yayında şarkıları siz düzenleyemezsiniz."}
        </p>
      ) : null}

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          placeholder="Şarkı veya sanatçı ara…"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between gap-2 text-xs text-muted sm:justify-end">
          <span>
            {filteredSongs.length} / {songs.length}
          </span>
          {searchTerm.trim() ? (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-muted hover:bg-surface"
            >
              Temizle
            </button>
          ) : null}
        </div>
      </div>

      {editId ? (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div className="col-span-full rounded-xl border border-border bg-bg/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs font-medium text-muted-foreground">
                Genius’tan getir (başlık + sanatçı + lyrics)
                <input
                  value={geniusQuery}
                  onChange={(e) => setGeniusQuery(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchGenius();
                    }
                  }}
                  placeholder="Örn: Sezen Aksu Gülümse"
                  className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground"
                />
              </label>
              <button
                type="button"
                disabled={!geniusQuery.trim() || geniusLoading}
                onClick={searchGenius}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {geniusLoading ? "Aranıyor…" : "Ara"}
              </button>
            </div>

            {geniusError ? (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                {geniusError}
              </p>
            ) : null}

            {geniusHits.length > 0 ? (
              <div className="mt-3 grid gap-2">
                <p className="text-xs text-muted-foreground">Sonuçlar (tıklayınca formu doldurur)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {geniusHits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => applyGeniusHit(h)}
                      disabled={geniusLyricsLoading}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-60"
                      title={h.fullTitle}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{h.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{h.artist}</div>
                      </div>
                      <div className="ml-auto text-[11px] text-muted-foreground">
                        {geniusLyricsLoading ? "Yükleniyor…" : "Seç"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="col-span-full rounded-xl border border-border bg-bg/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Spotify’dan getir (ton + BPM + ölçü)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Başlık + sanatçı adına göre arar; eşleşen ilk kayıttan tempo/ton çeker.
                </p>
              </div>
              <button
                type="button"
                onClick={fillFromSpotify}
                disabled={spotifyLoading}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {spotifyLoading ? "Çekiliyor…" : "Ton+BPM çek"}
              </button>
            </div>
            {spotifyError ? (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                {spotifyError}
              </p>
            ) : null}
          </div>

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
            onChange={(e) => {
              const v = e.currentTarget.value;
              setKeyMode(v);
              if (v && KEY_MODES.includes(v as KeyMode)) {
                setGamlarScaleId(keyModeToGamlarCatalogScaleId(v as KeyMode));
              } else {
                setGamlarScaleId("");
              }
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          >
            <option value="">Ton modu *</option>
            <option value="major">Majör</option>
            <option value="natural">Doğal Minör</option>
            <option value="harmonic">Harmonik Minör</option>
            <option value="melodic">Melodik Minör</option>
          </select>
          <select
            name="gamlarScaleId"
            required
            disabled={gamlarSubModes.length === 0}
            value={gamlarScaleId}
            onChange={(e) => setGamlarScaleId(e.currentTarget.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm disabled:opacity-60"
            title="Seçilen ton moduna göre gam / mod"
          >
            <option value="">{keyMode ? "Alt gam (mod) *" : "Önce ton modunu seçin"}</option>
            {gamlarSubModes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
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
          <label className="col-span-full flex cursor-pointer items-start gap-2 rounded-lg border border-border/80 bg-bg/50 px-3 py-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showHarmonyDetails}
              onChange={(e) => setShowHarmonyDetails(e.currentTarget.checked)}
              className="mt-0.5 rounded border-border text-accent"
            />
            <span>
              Önizlemede &quot;Meraklısına daha fazla detay&quot; (armoni özeti) gösterilsin. Kapatırsanız önizleme ve
              akor sayfasında bu bağlantı gizlenir.
            </span>
          </label>
          <label className="col-span-full block text-xs font-medium text-muted-foreground">
            Armoni penceresi metni (isteğe bağlı)
            <textarea
              name="harmonyDetailsNotes"
              rows={5}
              value={harmonyDetailsNotes}
              onChange={(e) => setHarmonyDetailsNotes(e.currentTarget.value)}
              placeholder={
                "Örn.: Köprüde II–V–I geçişi, nakarat majör moda kayar…\nBu kutu doluysa açılır pencerenin üstünde gösterilir; altta otomatik özet (ton, akor listesi) yine gelir."
              }
              className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70"
            />
          </label>
          {loadingEdit ? <p className="col-span-full text-xs text-muted">Mevcut kayıt yükleniyor…</p> : null}
          <div className="col-span-full flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Kaydediliyor…" : "Güncelle"}
            </button>
            <button
              type="button"
              onClick={() => {
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
              <th className="px-4 py-3 font-medium">Firestore ID</th>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Sanatçı</th>
              <th className="px-4 py-3 font-medium">Ton</th>
              <th className="px-4 py-3 font-medium">Zorluk</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredSongs.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="max-w-[10rem] px-4 py-3">
                  <code className="break-all text-[11px] text-muted" title={s.id}>
                    {s.id}
                  </code>
                </td>
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
                    s.moderationStatus === "approved" ? "bg-teal-500/10 text-teal-700 dark:text-teal-400"
                    : s.moderationStatus === "pending" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}>
                    {s.moderationStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/yeni-sarki?id=${encodeURIComponent(s.id)}`}
                      className={`text-xs text-accent hover:underline ${lockedLive && s.moderationStatus === "approved" ? "pointer-events-none opacity-40 no-underline" : ""}`}
                      title={lockedLive && s.moderationStatus === "approved" ? "Yayında — yalnız yayın yetkilisi" : undefined}
                    >
                      Düzenle
                    </Link>
                    <button
                      type="button"
                      disabled={lockedLive && s.moderationStatus === "approved"}
                      title={lockedLive && s.moderationStatus === "approved" ? "Yayında — yalnız yayın yetkilisi" : undefined}
                      onClick={() => onDelete(s.id)}
                      className="text-xs text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                    >
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
