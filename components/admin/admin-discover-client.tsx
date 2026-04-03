"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SongRow = { id: string; title: string; artistName: string; moderationStatus?: string };

function parseIds(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function AdminDiscoverClient() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [featuredText, setFeaturedText] = useState("");
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [saving, setSaving] = useState(false);

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
      const dJson = (await dRes.json()) as { featured?: string[]; error?: string };
      const sJson = (await sRes.json()) as { songs?: SongRow[]; error?: string };

      if (!dRes.ok) {
        setMsg(dJson.error ?? "Keşfet yüklenemedi.");
        return;
      }
      if (sRes.ok && Array.isArray(sJson.songs)) {
        setSongs(sJson.songs);
      }
      setFeaturedText((dJson.featured ?? []).join("\n"));
    } catch {
      setMsg("Veri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveFeatured() {
    setSaving(true);
    setMsg("");
    try {
      const songIds = parseIds(featuredText);
      const res = await fetch("/api/admin/discover", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds }),
      });
      const data = (await res.json()) as { ok?: boolean; songIds?: string[]; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Kayıt başarısız.");
        return;
      }
      if (Array.isArray(data.songIds)) {
        setFeaturedText(data.songIds.join("\n"));
      }
      setMsg("Editör seçimi kaydedildi. Ana sayfa önbelleği yenilendi.");
    } catch {
      setMsg("Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  }

  function Preview() {
    const ids = parseIds(featuredText);
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

      <section className="rounded-2xl border border-border bg-bg/50 p-4 text-sm text-muted">
        <p>
          <span className="font-medium text-foreground">Popüler:</span> Onaylı şarkılar{" "}
          <code className="text-foreground">popularity</code> alanına göre sıralanır; liste sunucu önbelleğinde yaklaşık{" "}
          <span className="font-medium text-foreground">23 saatte</span> bir yenilenir. Puanı şarkı formunda veya içe aktarımda
          verebilirsin.
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">Yeni eklenenler:</span> Otomatik —{" "}
          <code className="text-foreground">createdAt</code> en yeni onaylı şarkılar.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Editör seçimi</h2>
        <p className="mt-1 text-sm text-muted">
          Ana sayfadaki sıra buradaki listedir. Her satıra bir{" "}
          <a href="/admin/sarkilar" className="text-accent hover:underline">
            Firestore şarkı ID
          </a>{" "}
          (en fazla 24).
        </p>
        <textarea
          value={featuredText}
          onChange={(e) => setFeaturedText(e.target.value)}
          rows={10}
          className="mt-4 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-foreground"
          spellCheck={false}
          placeholder="Şarkı doküman ID'leri, her satırda biri"
          aria-label="Editör seçimi şarkı ID listesi"
        />
        <Preview />
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveFeatured()}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </section>
    </div>
  );
}
