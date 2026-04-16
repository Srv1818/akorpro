"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  inferKeyModeFromOriginalKey,
  keyModeToGamlarCatalogScaleId,
  keyModeToGamlarFamily,
  resolveSongGamlarScaleId,
} from "@/lib/music/key-mode-gamlar";
import { gamlarModesForFamily } from "@/data/gamlar-scale-catalog";
import { slugify } from "@/lib/seo/slug";
import type { KeyMode } from "@/lib/types/content";

type GeniusHit = {
  id: number;
  title: string;
  artist: string;
  fullTitle: string;
};

const KEY_MODES: readonly KeyMode[] = ["major", "natural", "harmonic", "melodic"];

function isSectionLine(line: string): boolean {
  const s = line.trim();
  return s === "[Verse]" || s === "[Chorus]";
}

function buildChordProLine(line: string, chordInput: string): string {
  const l = line ?? "";
  if (!l.trim()) return l;
  if (isSectionLine(l)) return l.trim();
  const tokens = chordInput
    .trim()
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return l;
  return `${tokens.map((t) => `[${t}]`).join("")}${l}`;
}

function buildChordProPair(
  line: string,
  chordInput: string,
  mode: "inline" | "above",
): string[] {
  const l = line ?? "";
  if (!l.trim()) return [l];
  if (isSectionLine(l)) return [l.trim()];
  // Eğer kullanıcı satırın içine zaten ChordPro akor tag'leri yerleştirdiyse,
  // o satırı aynen kullan (orta sütundaki "satır akorları" bu satır için devre dışı kalsın).
  if (/\[[^\]\n]+\]/.test(l)) return [l];

  const raw = chordInput ?? "";
  if (!raw.trim()) return [l];

  // Akor satırını "pozisyonel" yorumla: kullanıcı boşluklarla alttaki söz satırına hizalar.
  // chordInput içindeki akor token'larının başladığı karakter index'ini alıp,
  // aynı index'e ChordPro tag'i enjekte ederiz.
  const looksLikeChordToken = (t: string) =>
    /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\([^)]+\))?(?:\/[A-G](?:#|b)?)?$/i.test(t);

  const positions: Array<{ pos: number; chord: string }> = [];
  for (const m of raw.matchAll(/[^\s]+/g)) {
    const tok = (m[0] ?? "").trim();
    const pos = typeof m.index === "number" ? m.index : -1;
    if (pos >= 0 && looksLikeChordToken(tok)) {
      positions.push({ pos, chord: tok });
    }
  }
  if (positions.length === 0) return [l];

  const inserts = new Map<number, string>();
  for (const p of positions) {
    // Clamp to line length; if beyond, place at end.
    const at = Math.min(Math.max(0, p.pos), l.length);
    inserts.set(at, `[${p.chord}]`);
  }

  // Inline: tag'leri kelime başına ekle.
  if (mode === "inline") {
    let out = "";
    for (let i = 0; i < l.length; i++) {
      const ins = inserts.get(i);
      if (ins) out += ins;
      out += l[i];
    }
    // Insert at end if word starts at l.length (shouldn't happen)
    const tailIns = inserts.get(l.length);
    if (tailIns) out += tailIns;
    return [out];
  }

  // Üst satır: akor tag'lerini kelime başlarına hizalı (boşluklar + tag) bir satıra yaz.
  // Kullanıcının hizalama satırını görmesi için, chordInput'u olduğu gibi üst satır olarak kullan.
  return [raw.trimEnd(), l];
}

function cleanLyricsText(raw: string): string {
  // 1) Normalize newlines
  let s = (raw ?? "").replace(/\r\n/g, "\n");

  // 1.5) Normalize section tags to ChordPro-friendly English tags
  // [Nakarat] -> [Chorus]
  // [Bölüm 1], [Bolum 2], [Kıta], [Kita 3] -> [Verse]
  s = s
    .replace(/^\s*\[(?:nakarat|chorus)\]\s*$/gim, "[Chorus]")
    .replace(/^\s*\[(?:bölüm|bolum|kıta|kita|verse)(?:\s*\d+)?\]\s*$/gim, "[Verse]");

  // 2) Remove common quotation marks (keep apostrophes, remove double quotes & variants)
  //    “ ” „ « » ‹ › ＂
  s = s.replace(/["“”„«»‹›＂]/g, "");

  // 3) Line-based cleanup (preserve stanza spacing as much as possible)
  const lines = s.split("\n").map((line) => line.trimEnd());
  const out: string[] = [];

  const isTag = (line: string) => line === "[Verse]" || line === "[Chorus]";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Remove common Genius junk lines that may appear in scraped text
    // Example: "Ben... Read More [..]"
    if (/Read More/i.test(line)) continue;

    if (isTag(line)) {
      // Ensure a blank line before section tags (avoids "sticking" visually)
      const prev = out.length > 0 ? out[out.length - 1] ?? "" : "";
      if (prev.trim() !== "") out.push("");
      out.push(line);
      continue;
    }

    out.push(line);
  }

  s = out.join("\n");

  // Boş satır sayısını ve baştaki/sondaki boşlukları (kıtalar arası) koru.
  return s;
}

export function AdminSongStudioClient({ initialSongId }: { initialSongId?: string }) {
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(initialSongId ?? null);
  const [loadingEdit, setLoadingEdit] = useState(false);

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

  // Genius
  const [geniusQuery, setGeniusQuery] = useState("");
  const [geniusHits, setGeniusHits] = useState<GeniusHit[]>([]);
  const [geniusLoading, setGeniusLoading] = useState(false);
  const [geniusLyricsLoading, setGeniusLyricsLoading] = useState(false);
  const [geniusError, setGeniusError] = useState<string | null>(null);

  // Spotify
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  // ChordPro studio
  const [lyricsRaw, setLyricsRaw] = useState("");
  const [chordsByLine, setChordsByLine] = useState<string[]>([]);
  const chordInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const lastAlignedLinesRef = useRef<string[]>([]);
  const [chordProMode, setChordProMode] = useState<"inline" | "above">("inline");
  const [studioFullscreen, setStudioFullscreen] = useState(false);
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const next = initialSongId ?? (typeof idFromUrl === "string" && idFromUrl.trim() ? idFromUrl.trim() : undefined);
    if (!next) return;
    setEditId(next);
  }, [initialSongId, searchParams]);

  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);
    setMsg("");
    fetch(`/api/admin/songs/${editId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { song?: Record<string, unknown>; error?: string };
        if (!res.ok || !data.song) throw new Error(data.error ?? "Şarkı detayı alınamadı.");
        const s = data.song as Record<string, unknown>;

        const v = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : "");
        setTitle(v("title"));
        setSongSlug(v("slug"));
        setSongSlugDirty(false);
        setArtistName(v("artistName"));
        setArtistSlug(v("artistSlug"));
        setArtistSlugDirty(false);
        setOriginalKey(v("originalKey"));
        setDifficulty(v("difficulty"));
        setKeyMode(v("keyMode"));
        setGamlarScaleId(
          resolveSongGamlarScaleId(
            (typeof s.keyMode === "string" ? (s.keyMode as KeyMode) : undefined) ?? inferKeyModeFromOriginalKey(v("originalKey") || "C"),
            typeof s.gamlarScaleId === "string" ? (s.gamlarScaleId as string) : undefined,
          ),
        );
        setGenre(v("genre"));
        setTempo(typeof s.tempo === "number" || typeof s.tempo === "string" ? String(s.tempo) : "");
        setTimeSignature(v("timeSignature"));
        setTuning(v("tuning"));
        setCapo(typeof s.capo === "number" ? String(s.capo) : "");
        setPopularity(typeof s.popularity === "number" ? String(s.popularity) : "");
        setCopyrightSource(v("copyrightSource"));
        setShowHarmonyDetails(typeof s.showHarmonyDetails === "boolean" ? (s.showHarmonyDetails as boolean) : true);
        setHarmonyDetailsNotes(v("harmonyDetailsNotes"));

        const body = v("chordBody");
        setChordBody(body);
        // Studio için başlangıç lyrics: chordBody'den chord tag'lerini kaldır.
        const plainLyrics = body ? body.replace(/\[[^\]\n]+\]/g, "") : "";
        setLyricsRaw(plainLyrics.trimEnd());
        setChordsByLine([]);
        lastAlignedLinesRef.current = plainLyrics.replace(/\r\n/g, "\n").split("\n");
      })
      .catch((err) => {
        setMsg(err instanceof Error ? err.message : "Şarkı detayı alınamadı.");
      })
      .finally(() => setLoadingEdit(false));
  }, [editId]);
  const fullscreenGridRef = useRef<HTMLDivElement | null>(null);
  const [fsCols, setFsCols] = useState<{ left: number; mid: number; right: number }>({
    left: 0.4,
    mid: 0.2,
    right: 0.4,
  });

  const nextSongSlug = useMemo(() => slugify(title), [title]);
  const nextArtistSlug = useMemo(() => slugify(artistName), [artistName]);

  useEffect(() => {
    if (!songSlugDirty) setSongSlug(nextSongSlug);
  }, [nextSongSlug, songSlugDirty]);

  useEffect(() => {
    if (!artistSlugDirty) setArtistSlug(nextArtistSlug);
  }, [nextArtistSlug, artistSlugDirty]);

  const gamlarSubModes = useMemo(() => {
    if (!keyMode || !KEY_MODES.includes(keyMode as KeyMode)) return [];
    return [...gamlarModesForFamily(keyModeToGamlarFamily(keyMode as KeyMode))];
  }, [keyMode]);

  const lyricLines = useMemo(() => lyricsRaw.replace(/\r\n/g, "\n").split("\n"), [lyricsRaw]);

  useEffect(() => {
    // Keep chordsByLine length in sync with lyric lines.
    setChordsByLine((prev) => {
      if (prev.length === lyricLines.length) return prev;
      const next = [...prev];
      if (next.length < lyricLines.length) {
        while (next.length < lyricLines.length) next.push("");
      } else {
        next.length = lyricLines.length;
      }
      return next;
    });
  }, [lyricLines.length]);

  useEffect(() => {
    // İlk kurulumda referansı doldur (ilk "yenile" için).
    if (lastAlignedLinesRef.current.length === 0 && lyricLines.length > 0) {
      lastAlignedLinesRef.current = [...lyricLines];
    }
  }, [lyricLines]);

  const chordProPreview = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < lyricLines.length; i++) {
      const line = lyricLines[i] ?? "";
      const chordInput = chordsByLine[i] ?? "";
      out.push(...buildChordProPair(line, chordInput, chordProMode));
    }
    return out.join("\n").trimEnd();
  }, [chordProMode, chordsByLine, lyricLines]);

  useEffect(() => {
    if (!studioFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStudioFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [studioFullscreen]);

  useEffect(() => {
    if (!studioFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [studioFullscreen]);

  const startResize = useCallback(
    (which: "lm" | "mr") => (e: React.PointerEvent<HTMLDivElement>) => {
      const el = fullscreenGridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Subtract splitter widths (2 * 8px) from total.
      const total = Math.max(0, rect.width - 16);
      if (total <= 0) return;

      const startX = e.clientX;
      const start = { ...fsCols };
      const minPx = 320;
      const min = minPx / total;

      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const d = dx / total;

        setFsCols(() => {
          let left = start.left;
          let mid = start.mid;
          let right = start.right;

          if (which === "lm") {
            left = start.left + d;
            mid = start.mid - d;
          } else {
            mid = start.mid + d;
            right = start.right - d;
          }

          left = Math.max(min, left);
          mid = Math.max(min, mid);
          right = Math.max(min, right);

          // Re-normalize to sum 1 while preserving the non-involved side mostly.
          const sum = left + mid + right;
          if (sum <= 0) return start;
          left /= sum;
          mid /= sum;
          right /= sum;

          // If any got pushed below min after normalization, bail to last valid.
          if (left < min || mid < min || right < min) return start;
          return { left, mid, right };
        });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [fsCols],
  );

  const applyChordProToBody = useCallback(() => {
    setChordBody(chordProPreview);
    setMsg("ChordPro çıktısı `Akor + söz gövdesi` alanına aktarıldı.");
  }, [chordProPreview]);

  const refreshStudioLines = useCallback(() => {
    const oldLines = lastAlignedLinesRef.current;
    const oldChords = chordsByLine;
    const newLines = lyricLines;

    // Index + exact-line heuristic:
    // 1) Aynı index ve aynı satır metni ise akoru koru.
    // 2) Değilse, eski satırlar içinde aynı metni ara ve akorunu taşı.
    const usedOldIdx = new Set<number>();
    const nextChords: string[] = new Array(newLines.length).fill("");

    for (let i = 0; i < newLines.length; i++) {
      const nl = newLines[i] ?? "";
      if (!nl.trim() || isSectionLine(nl)) continue;

      if (oldLines[i] === nl && typeof oldChords[i] === "string" && oldChords[i].trim()) {
        nextChords[i] = oldChords[i];
        usedOldIdx.add(i);
        continue;
      }

      const found = oldLines.findIndex((ol, idx) => !usedOldIdx.has(idx) && ol === nl);
      if (found >= 0 && typeof oldChords[found] === "string" && oldChords[found].trim()) {
        nextChords[i] = oldChords[found];
        usedOldIdx.add(found);
      }
    }

    setChordsByLine(nextChords);
    lastAlignedLinesRef.current = [...newLines];
    setMsg("Satırlar yenilendi (akorlarda mümkün olduğunca eşleştirme yapıldı).");
  }, [chordsByLine, lyricLines]);

  const cleanLyrics = useCallback(() => {
    setLyricsRaw((prev) => cleanLyricsText(prev));
    setMsg("Sözler temizlendi (tırnak/alıntı işaretleri kaldırıldı).");
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
          setLyricsRaw(lyrics.trim());
          setChordsByLine([]); // reset
          lastAlignedLinesRef.current = lyrics.trim().replace(/\r\n/g, "\n").split("\n");
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
    if (!editId) body.source = "studio";
    if (tempo.trim()) body.tempo = tempo.trim();
    if (timeSignature.trim()) body.timeSignature = timeSignature.trim();
    if (tuning.trim()) body.tuning = tuning.trim();
    if (capo.trim()) body.capo = Number(capo.trim());
    if (popularity.trim()) body.popularity = Number(popularity.trim());
    if (copyrightSource.trim()) body.copyrightSource = copyrightSource.trim();
    body.showHarmonyDetails = showHarmonyDetails;
    body.harmonyDetailsNotes = harmonyDetailsNotes;

    try {
      const url = editId ? `/api/admin/songs/${editId}` : "/api/admin/songs";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => null)) as { id?: string; error?: string; moderationStatus?: string } | null;
      if (!res.ok) {
        setMsg(data?.error ?? "Hata.");
        return;
      }
      if (editId) {
        setMsg("Güncellendi.");
      } else {
        setMsg(`Oluşturuldu${data?.id ? `: ${data.id}` : "."}`);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "İstek başarısız.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {msg ? <p className="rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}
      {loadingEdit ? <p className="text-sm text-muted">Şarkı yükleniyor…</p> : null}

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
        <div className="col-span-full rounded-xl border border-border bg-bg/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-medium text-muted-foreground">
              Genius’tan getir (başlık + sanatçı + sözler)
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
              <p className="text-xs text-muted-foreground">Sonuçlar (tıklayınca sözleri getirir)</p>
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
          onChange={(e) => {
            setSongSlugDirty(true);
            setSongSlug(e.currentTarget.value);
          }}
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
          onChange={(e) => {
            setArtistSlugDirty(true);
            setArtistSlug(e.currentTarget.value);
          }}
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
          placeholder="Tür (Pop, Rock, Halk müziği…) *"
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

        <div className="col-span-full grid gap-3 rounded-xl border border-border bg-bg/40 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">ChordPro Studio</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sol: sözleri düzenle. Orta: her satıra “A B G Am” gibi akor dizisi yaz. Sağ: ChordPro çıktısı.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-2 py-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Çıktı</span>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="chordpro-mode"
                  checked={chordProMode === "inline"}
                  onChange={() => setChordProMode("inline")}
                />
                Inline
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="chordpro-mode"
                  checked={chordProMode === "above"}
                  onChange={() => setChordProMode("above")}
                />
                Üst satır
              </label>
            </div>
            <button
              type="button"
              onClick={() => setStudioFullscreen(true)}
              className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              title="ChordPro Studio’yu tam ekranda aç"
            >
              Tam ekran
            </button>
            <button
              type="button"
              onClick={cleanLyrics}
              className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              title="Sözlerdeki tırnak/alıntı işaretlerini temizle"
            >
              Metni temizle
            </button>
            <button
              type="button"
              onClick={refreshStudioLines}
              className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              title="Sözler düzenlendiyse satırları yeniden eşleştir"
            >
              Satırları yenile
            </button>
            <button
              type="button"
              onClick={applyChordProToBody}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
              title="Üretilen ChordPro’yu form gövdesine aktar"
            >
              ChordPro’yu gövdeye aktar
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Sözler (düzenlenebilir)
              <textarea
                rows={14}
                value={lyricsRaw}
                onChange={(e) => setLyricsRaw(e.currentTarget.value)}
                placeholder={"[Verse]\n...\n\n[Chorus]\n..."}
                className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground"
              />
            </label>

            <div className="rounded-lg border border-border bg-bg/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Satır akorları</p>
              <div className="mt-2 grid gap-2">
                {lyricLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border border-border bg-surface p-2 ${!line.trim() ? "opacity-70" : ""}`}
                  >
                    {!line.trim() || isSectionLine(line) ? null : (
                      <input
                        ref={(el) => {
                          chordInputsRef.current[idx] = el;
                        }}
                        value={chordsByLine[idx] ?? ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setChordsByLine((prev) => {
                            const next = [...prev];
                            next[idx] = v;
                            return next;
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            chordInputsRef.current[idx + 1]?.focus();
                          }
                          if (e.key === "ArrowDown") chordInputsRef.current[idx + 1]?.focus();
                          if (e.key === "ArrowUp") chordInputsRef.current[idx - 1]?.focus();
                        }}
                        placeholder={'Akor satırı: boşluklarla alttaki söze hizala (örn: "Em     Am")'}
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono"
                      />
                    )}

                    <div
                      className={`${!line.trim() || isSectionLine(line) ? "" : "mt-2"} w-full min-w-0 flex-1 px-3 py-2 text-sm font-mono text-muted-foreground`}
                      style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
                    >
                      {line.trim() ? (isSectionLine(line) ? line.trim() : line) : "— boş satır —"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="block text-xs font-medium text-muted-foreground">
              ChordPro çıktısı (önizleme)
              <textarea
                readOnly
                rows={14}
                value={chordProPreview}
                className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
        </div>

        <textarea
          name="chordBody"
          placeholder="Akor + söz gövdesi *"
          required
          rows={10}
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
            Önizlemede &quot;Meraklısına daha fazla detay&quot; (armoni özeti) gösterilsin. Kapatırsanız önizleme ve akor
            sayfasında bu bağlantı gizlenir.
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

        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Oluştur"}
          </button>
        </div>
      </form>

      {studioFullscreen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 p-0"
          role="dialog"
          aria-modal="true"
          aria-label="ChordPro Studio tam ekran"
          onMouseDown={(e) => {
            // backdrop click
            if (e.target === e.currentTarget) setStudioFullscreen(false);
          }}
        >
          <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-none border border-border bg-surface shadow-2xl">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">ChordPro Studio</div>
                <div className="text-xs text-muted-foreground">
                  Esc ile kapat. Dışarı tıklayarak da kapatabilirsin.
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-2 py-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Çıktı</span>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="chordpro-mode-full"
                    checked={chordProMode === "inline"}
                    onChange={() => setChordProMode("inline")}
                  />
                  Inline
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="chordpro-mode-full"
                    checked={chordProMode === "above"}
                    onChange={() => setChordProMode("above")}
                  />
                  Üst satır
                </label>
              </div>
              <button
                type="button"
                onClick={refreshStudioLines}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                Satırları yenile
              </button>
              <button
                type="button"
                onClick={cleanLyrics}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
                title="Sözlerdeki tırnak/alıntı işaretlerini temizle"
              >
                Metni temizle
              </button>
              <button
                type="button"
                onClick={applyChordProToBody}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
              >
                Gövdeye aktar
              </button>
              <button
                type="button"
                onClick={() => setStudioFullscreen(false)}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                Kapat
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-3">
              <div
                className="grid h-full gap-3"
                ref={fullscreenGridRef}
                style={{
                  gridTemplateColumns: `${fsCols.left}fr 8px ${fsCols.mid}fr 8px ${fsCols.right}fr`,
                }}
              >
                <div className="flex h-full min-h-0 flex-col">
                  <div className="text-xs font-medium text-muted-foreground">Sözler (düzenlenebilir)</div>
                  <textarea
                    value={lyricsRaw}
                    onChange={(e) => setLyricsRaw(e.currentTarget.value)}
                    placeholder={"[Verse]\n...\n\n[Chorus]\n..."}
                    className="mt-1.5 h-full w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div
                  role="separator"
                  aria-label="Sol ve orta sütun ayırıcı"
                  onPointerDown={startResize("lm")}
                  className="h-full cursor-col-resize rounded-md bg-border/60 hover:bg-accent/60"
                  title="Sürükleyerek sütun genişliğini ayarla"
                />

                <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-bg/30 p-3">
                  <div className="text-xs font-medium text-muted-foreground">Satır akorları</div>
                  <div className="mt-2 flex-1 overflow-auto pr-1">
                    <div className="grid gap-2">
                      {lyricLines.map((line, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border border-border bg-surface p-2 ${!line.trim() ? "opacity-70" : ""}`}
                        >
                          {!line.trim() || isSectionLine(line) ? null : (
                            <input
                              value={chordsByLine[idx] ?? ""}
                              onChange={(e) => {
                                const v = e.currentTarget.value;
                                setChordsByLine((prev) => {
                                  const next = [...prev];
                                  next[idx] = v;
                                  return next;
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  chordInputsRef.current[idx + 1]?.focus();
                                }
                                if (e.key === "ArrowDown") chordInputsRef.current[idx + 1]?.focus();
                                if (e.key === "ArrowUp") chordInputsRef.current[idx - 1]?.focus();
                              }}
                              placeholder={'Akor satırı: boşluklarla alttaki söze hizala (örn: "Em     Am")'}
                              className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono"
                            />
                          )}

                          <div
                            className={`${!line.trim() || isSectionLine(line) ? "" : "mt-2"} w-full min-w-0 flex-1 px-3 py-2 text-sm font-mono text-muted-foreground`}
                            style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
                          >
                            {line.trim() ? (isSectionLine(line) ? line.trim() : line) : "— boş satır —"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  role="separator"
                  aria-label="Orta ve sağ sütun ayırıcı"
                  onPointerDown={startResize("mr")}
                  className="h-full cursor-col-resize rounded-md bg-border/60 hover:bg-accent/60"
                  title="Sürükleyerek sütun genişliğini ayarla"
                />

                <div className="flex h-full min-h-0 flex-col">
                  <div className="text-xs font-medium text-muted-foreground">ChordPro çıktısı (önizleme)</div>
                  <textarea
                    readOnly
                    value={chordProPreview}
                    className="mt-1.5 h-full w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

