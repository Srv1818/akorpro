"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DiscoverSection = "popular" | "new" | "featured";

type SongRow = { id: string; title: string; artistName: string; moderationStatus?: string };

const SECTION_META: Record<DiscoverSection, { title: string; hint: string }> = {
  popular: {
    title: "Popüler",
    hint: "Ana sayfadaki “Popüler” sırası bu listedir. Üstteki ID önce gösterilir.",
  },
  new: {
    title: "Yeni eklenenler (kürasyon)",
    hint: "Bu liste, dinamik “en yeni onaylı şarkılar” ile birleştirilir; buraya eklediklerin öne alınır.",
  },
  featured: {
    title: "Editör seçimi",
    hint: "Ana sayfadaki “Editör seçimi” sırası bu listedir.",
  },
};

function parseIds(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function AdminDiscoverClient() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [popularText, setPopularText] = useState("");
  const [newText, setNewText] = useState("");
  const [featuredText, setFeaturedText] = useState("");
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [saving, setSaving] = useState<DiscoverSection | null>(null);

  const songMap = useMemo(() => {
    const m = new Map<string, SongRow>();
    for (const s of songs) m.set(s.id, s);
    return m;
  }, [songs]);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const [dRes, sRes] = await Promise.all([
        fetch("/api/admin/discover", { cache: "no-store" }),
        fetch("/api/admin/songs", { cache: "no-store" }),
      ]);
      const dJson = (await dRes.json()) as {
        sections?: Record<DiscoverSection, string[]>;
        error?: string;
      };
      const sJson = (await sRes.json()) as { songs?: SongRow[]; error?: string };

      if (!dRes.ok) {
        setMsg(dJson.error ?? "Keşfet yüklenemedi.");
        return;
      }
      if (sRes.ok && Array.isArray(sJson.songs)) {
        setSongs(sJson.songs);
      }

      const sec = dJson.sections;
      if (sec) {
        setPopularText((sec.popular ?? []).join("\n"));
        setNewText((sec.new ?? []).join("\n"));
        setFeaturedText((sec.featured ?? []).join("\n"));
      }
    } catch {
      setMsg("Veri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSection(section: DiscoverSection, text: string) {
    setSaving(section);
    setMsg("");
    try {
      const songIds = parseIds(text);
      const res = await fetch("/api/admin/discover", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, songIds }),
      });
      const data = (await res.json()) as { ok?: boolean; songIds?: string[]; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Kayıt başarısız.");
        return;
      }
      if (Array.isArray(data.songIds)) {
        const joined = data.songIds.join("\n");
        if (section === "popular") setPopularText(joined);
        if (section === "new") setNewText(joined);
        if (section === "featured") setFeaturedText(joined);
      }
      setMsg(`“${SECTION_META[section].title}” kaydedildi. Ana sayfa önbelleği yenilendi.`);
    } catch {
      setMsg("Kayıt başarısız.");
    } finally {
      setSaving(null);
    }
  }

  function Preview({ text }: { text: string }) {
    const ids = parseIds(text);
    if (ids.length === 0) return <p className="text-xs text-muted">Önizleme için en az bir ID girin.</p>;
    return (
      <ol className="mt-2 max-h-40 list-decimal space-y-1 overflow-y-auto pl-5 text-xs text-muted">
        {ids.map((id) => {
          const s = songMap.get(id);
          return (
            <li key={id}>
              <code className="text-foreground">{id}</code>
              {s ? (
                <span className="text-muted">
                  {" "}
                  — {s.title} ({s.artistName})
                  {s.moderationStatus && s.moderationStatus !== "approved" ? (
                    <span className="text-yellow-600 dark:text-yellow-400"> · {s.moderationStatus}</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-yellow-600 dark:text-yellow-400"> — listede yok / yanlış ID</span>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="space-y-8">
      {msg ? <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">{msg}</p> : null}

      <p className="text-sm text-muted">
        Her satıra bir şarkı <strong className="text-foreground">Firestore doküman ID</strong> yazın (en fazla 24). ID’yi{" "}
        <a href="/admin/sarkilar" className="text-accent hover:underline">
          Şarkılar
        </a>{" "}
        tablosundaki “Firestore ID” sütunundan kopyalayın. Sıra = ana sayfadaki gösterim sırası.
      </p>

      {(Object.keys(SECTION_META) as DiscoverSection[]).map((section) => {
        const text =
          section === "popular" ? popularText : section === "new" ? newText : featuredText;
        const setText =
          section === "popular" ? setPopularText : section === "new" ? setNewText : setFeaturedText;
        const meta = SECTION_META[section];
        return (
          <section key={section} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">{meta.title}</h2>
            <p className="mt-1 text-sm text-muted">{meta.hint}</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="mt-4 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-foreground"
              spellCheck={false}
              placeholder="örn.&#10;abcSongDocId1&#10;abcSongDocId2"
              aria-label={`${meta.title} şarkı ID listesi`}
            />
            <Preview text={text} />
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => void saveSection(section, text)}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted disabled:opacity-50"
            >
              {saving === section ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </section>
        );
      })}
    </div>
  );
}
