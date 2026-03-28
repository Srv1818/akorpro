"use client";

import { useCallback, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function TakedownForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      songUrl: fd.get("songUrl") as string,
      originalWork: fd.get("originalWork") as string,
      proof: fd.get("proof") as string,
    };

    try {
      const res = await fetch("/api/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }, []);

  if (status === "sent") {
    return (
      <div className="my-6 rounded-xl border border-accent/30 bg-accent/5 px-6 py-5 text-sm text-foreground">
        Talebiniz alındı. En geç 72 saat içinde e-posta ile bilgilendirileceksiniz.
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="my-6 space-y-4">
      <fieldset disabled={status === "sending"} className="space-y-4">
        <div>
          <label htmlFor="tk-name" className="block text-sm font-medium text-foreground">
            Ad Soyad / Şirket
          </label>
          <input
            id="tk-name"
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="tk-email" className="block text-sm font-medium text-foreground">
            E-posta
          </label>
          <input
            id="tk-email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="tk-url" className="block text-sm font-medium text-foreground">
            Kaldırılmasını istediğiniz sayfa URL&apos;si
          </label>
          <input
            id="tk-url"
            name="songUrl"
            type="url"
            required
            placeholder="https://akorpro.com/akor/..."
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="tk-original" className="block text-sm font-medium text-foreground">
            Orijinal eser bilgisi (şarkı adı, sanatçı, albüm)
          </label>
          <input
            id="tk-original"
            name="originalWork"
            required
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="tk-proof" className="block text-sm font-medium text-foreground">
            Sahiplik belgesi / açıklama
          </label>
          <textarea
            id="tk-proof"
            name="proof"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
          />
        </div>

        {errorMsg ? (
          <p className="text-sm text-red-400" role="alert">{errorMsg}</p>
        ) : null}

        <button
          type="submit"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Gönderiliyor…" : "Talep gönder"}
        </button>
      </fieldset>
    </form>
  );
}
