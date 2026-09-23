"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * E-posta + parola girişi — Payload'ın yerleşik oturum ucu.
 *
 * Directus kurulumunda yalnız Google SSO vardı ve bu bir risk yaratıyordu:
 * Google tarafında bir aksilikte panele hiç girilemezdi (SMTP de kurulu değil,
 * parola sıfırlama da yok). Parola girişi o kapıyı açık tutuyor.
 *
 * Payload başarılı girişte oturum çerezini kendisi yazıyor; burada token
 * saklanmıyor.
 */
export function PasswordLoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/payload-api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        setError("E-posta veya parola hatalı.");
        setPending(false);
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Bağlantı kurulamadı. Tekrar dene.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-muted">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-muted">
          Parola
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:bg-bg disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
    </form>
  );
}
