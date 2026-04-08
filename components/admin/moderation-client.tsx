"use client";

import { useState, useEffect, useCallback } from "react";

type PendingSong = {
  id: string;
  title: string;
  artistName: string;
  slug: string;
  artistSlug: string;
  originalKey: string;
  moderationStatus: string;
};

type PendingContrib = {
  id: string;
  songTitle: string;
  artistName: string;
  originalKey: string;
  difficulty: string;
  genre: string;
  contributorDisplayName: string;
  status: string;
  chordBody: string;
};

export function ModerationClient() {
  const [pendingSongs, setPendingSongs] = useState<PendingSong[]>([]);
  const [contribs, setContribs] = useState<PendingContrib[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [canPublishSongs, setCanPublishSongs] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsRes, contribsRes, meRes] = await Promise.all([
        fetch("/api/admin/songs"),
        fetch("/api/admin/contributions"),
        fetch("/api/auth/me", { credentials: "include" }),
      ]);
      if (meRes.ok) {
        const me = (await meRes.json()) as { canPublishSongs?: boolean };
        if (typeof me.canPublishSongs === "boolean") setCanPublishSongs(me.canPublishSongs);
      }
      if (songsRes.ok) {
        const data = await songsRes.json();
        setPendingSongs((data.songs as PendingSong[]).filter((s) => s.moderationStatus === "pending"));
      }
      if (contribsRes.ok) {
        const data = await contribsRes.json();
        setContribs(data.contributions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function moderateSong(id: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/admin/songs/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    let errText = "Hata.";
    try {
      const data = (await res.json()) as { error?: string };
      if (!res.ok && typeof data.error === "string") errText = data.error;
    } catch {
      /* ignore */
    }
    setMsg(res.ok ? `Şarkı ${status === "approved" ? "onaylandı" : "reddedildi"}.` : errText);
    fetchData();
  }

  async function moderateContrib(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Katkı ${action === "approve" ? "onaylandı" : "reddedildi"}.${data.songId ? ` → songId: ${data.songId}` : ""}` : (data.error ?? "Hata."));
    fetchData();
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="space-y-8">
      {msg ? <p className="rounded-lg bg-surface p-3 text-sm text-foreground">{msg}</p> : null}

      {/* Pending Songs */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">Bekleyen şarkılar ({pendingSongs.length})</h2>
        {!canPublishSongs ? (
          <p className="mt-2 text-sm text-muted">
            Şarkıyı yayına alma (onaylama) yalnızca yayın yetkilisindedir. Siz reddedebilir veya şarkıları Şarkılar sekmesinde düzenleyebilirsiniz.
          </p>
        ) : null}
        {pendingSongs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Bekleyen şarkı yok.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pendingSongs.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="font-medium text-foreground">{s.title}</p>
                  <p className="text-sm text-muted">{s.artistName} · {s.originalKey}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!canPublishSongs}
                    title={!canPublishSongs ? "Yayın yetkilisi onaylar" : undefined}
                    onClick={() => moderateSong(s.id, "approved")}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Onayla
                  </button>
                  <button type="button" onClick={() => moderateSong(s.id, "rejected")} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Contributions */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">Topluluk katkıları ({contribs.length})</h2>
        {contribs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Bekleyen katkı yok.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {contribs.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{c.songTitle}</p>
                    <p className="text-sm text-muted">{c.artistName} · {c.originalKey} · {c.difficulty} · {c.genre}</p>
                    <p className="mt-1 text-xs text-muted">Katkıcı: {c.contributorDisplayName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moderateContrib(c.id, "approve")} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">
                      Onayla
                    </button>
                    <button type="button" onClick={() => moderateContrib(c.id, "reject")} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                      Reddet
                    </button>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-accent hover:underline">Akor gövdesini göster</summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-bg p-3 font-mono text-xs text-foreground">
                    {c.chordBody}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
