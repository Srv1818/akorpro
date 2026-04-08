"use client";

import { useState, useEffect } from "react";

type Contribution = {
  id: string;
  songTitle: string;
  artistName: string;
  status: string;
  moderatorNote?: string;
  approvedSongId?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  draft: "Taslak",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
  draft: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export function ContributionListClient() {
  const [contribs, setContribs] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contributions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setContribs(d.contributions ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (contribs.length === 0) return <p className="text-sm text-muted">Henüz katkınız yok.</p>;

  return (
    <ul className="space-y-3">
      {contribs.map((c) => (
        <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{c.songTitle}</p>
              <p className="text-xs text-muted">{c.artistName}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ""}`}>
              {STATUS_LABELS[c.status] ?? c.status}
            </span>
          </div>
          {c.moderatorNote ? (
            <p className="mt-2 text-xs text-muted">Not: {c.moderatorNote}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
