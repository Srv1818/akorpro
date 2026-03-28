"use client";

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseApp } from "@/lib/firebase/client";

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi.";
    case "auth/user-disabled":
      return "Bu hesap devre dışı bırakılmış.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-posta veya şifre hatalı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme. Lütfen sonra tekrar deneyin.";
    default:
      return "Giriş başarısız. Lütfen tekrar deneyin.";
  }
}

export function LoginForm({ returnTo }: { returnTo: string }) {
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
      const auth = getAuth(getFirebaseApp());
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Oturum çerezi oluşturulamadı.");
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch (err: unknown) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border border-border bg-surface p-6" onSubmit={onSubmit}>
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="text-muted">E-posta</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-foreground"
          placeholder="ornek@akorpro.app"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Şifre</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-foreground"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-muted disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
