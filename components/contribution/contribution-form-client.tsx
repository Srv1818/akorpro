"use client";

import { useState, type FormEvent } from "react";

export function ContributionFormClient() {
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string" && v.trim()) body[k] = v.trim();
    });
    if (body.capo) body.capo = Number(body.capo);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Katkınız gönderildi! Moderatör onayı bekliyor.");
        e.currentTarget.reset();
      } else {
        setMsg(data.error ?? "Bir hata oluştu.");
      }
    } catch {
      setMsg("Ağ hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {msg ? (
        <p className={`rounded-lg p-3 text-sm ${msg.includes("gönderildi") ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
          {msg}
        </p>
      ) : null}

      <input name="songTitle" placeholder="Şarkı başlığı *" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
      <input name="artistName" placeholder="Sanatçı adı *" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
      <div className="grid gap-3 sm:grid-cols-4">
        <input name="originalKey" placeholder="Ton (Am, Em…) *" required className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        <select name="keyMode" required className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">
          <option value="">Ton modu *</option>
          <option value="major">Majör</option>
          <option value="natural">Doğal Minör</option>
          <option value="harmonic">Harmonik Minör</option>
          <option value="melodic">Melodik Minör</option>
        </select>
        <select name="difficulty" required className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">
          <option value="">Zorluk *</option>
          <option value="kolay">Kolay</option>
          <option value="orta">Orta</option>
          <option value="zor">Zor</option>
        </select>
        <input name="genre" placeholder="Tür (Rock, Pop…) *" required className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="tempo" placeholder="Tempo (120)" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        <input name="timeSignature" placeholder="Ölçü (4/4)" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        <input name="capo" type="number" min="0" placeholder="Kapo (0)" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
      </div>
      <textarea
        name="chordBody"
        placeholder={"[Verse]\nAm          F\nŞarkı sözleri burada\nC           G\nAkorlarla birlikte *"}
        required
        rows={10}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground"
      />
      <input name="copyrightSource" placeholder="Kaynak / telif notu (opsiyonel)" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-muted disabled:opacity-50"
      >
        {submitting ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
