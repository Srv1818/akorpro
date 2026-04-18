"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postSessionCookie } from "@/lib/auth/post-session-client";
import { getClientAuth } from "@/lib/firebase/client";

const RETURN_TO_KEY = "auth_return_to";

type AuthStatus = "idle" | "checking" | "redirecting" | "processing";

function errorCode(err: unknown): string {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: string }).code)
    : "";
}

function mapGoogleAuthError(code: string): string {
  switch (code) {
    case "auth/user-disabled":
      return "Bu hesap devre dışı bırakılmış.";
    case "auth/too-many-requests":
      return "Çok fazla deneme. Lütfen sonra tekrar deneyin.";
    case "auth/popup-closed-by-user":
      return "Giriş penceresi kapatıldı.";
    case "auth/account-exists-with-different-credential":
      return "Bu e-posta başka bir giriş yöntemiyle kayıtlı.";
    case "auth/operation-not-allowed":
      return "Google girişi kapalı. Firebase Console'da Google sağlayıcısını açın.";
    case "auth/unauthorized-domain":
      return "Bu domain Firebase'de yetkili değil. Firebase Console → Authentication → Authorized domains listesine 'localhost' ekleyin.";
    default:
      return "Giriş başarısız. Lütfen tekrar deneyin.";
  }
}

const statusLabel: Record<AuthStatus, string> = {
  idle: "Google ile devam et",
  checking: "Kontrol ediliyor…",
  redirecting: "Google'a yönlendiriliyor…",
  processing: "Oturum açılıyor…",
};

export function LoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  // Redirect fallback'ten (veya önceki redirect testinden) kalan sonucu işle
  useEffect(() => {
    const auth = getClientAuth();
    getRedirectResult(auth)
      .then(async (cred) => {
        if (!cred) {
          setStatus("idle");
          return;
        }
        setStatus("processing");
        const idToken = await cred.user.getIdToken();
        const sessionErr = await postSessionCookie(idToken);
        if (sessionErr) {
          setError(sessionErr);
          setStatus("idle");
          return;
        }
        const savedReturnTo = sessionStorage.getItem(RETURN_TO_KEY) ?? returnTo;
        sessionStorage.removeItem(RETURN_TO_KEY);
        router.push(savedReturnTo);
        router.refresh();
      })
      .catch((err: unknown) => {
        setError(mapGoogleAuthError(errorCode(err)));
        setStatus("idle");
      });
  }, [router, returnTo]);

  async function onGoogleSignIn() {
    setError(null);
    setStatus("redirecting");
    const auth = getClientAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // Birincil yöntem: popup (masaüstünde daha iyi UX)
      const cred = await signInWithPopup(auth, provider);
      setStatus("processing");
      const idToken = await cred.user.getIdToken();
      const sessionErr = await postSessionCookie(idToken);
      if (sessionErr) {
        setError(sessionErr);
        setStatus("idle");
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch (err: unknown) {
      const code = errorCode(err);
      // Popup engellenirse redirect fallback'e geç
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        sessionStorage.setItem(RETURN_TO_KEY, returnTo);
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: unknown) {
          setError(mapGoogleAuthError(errorCode(redirectErr)));
          setStatus("idle");
        }
        return;
      }
      setError(mapGoogleAuthError(code));
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      {error ? (
        <p
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p className="text-center text-sm text-muted">
        Oturum açmak için Google hesabınızı kullanın.
      </p>

      <button
        type="button"
        onClick={() => void onGoogleSignIn()}
        disabled={status !== "idle"}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-bg py-2.5 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-60"
      >
        <GoogleGlyph className="h-5 w-5 shrink-0" aria-hidden />
        {statusLabel[status]}
      </button>
    </div>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
