import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { PageHeader } from "@/components/content/page-header";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Google ile oturum açma.",
  robots: { index: false, follow: true },
};

function safeReturnTo(raw: string | string[] | undefined): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw === "/giris" || raw.startsWith("/giris?")) return "/";
  return raw;
}

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const sp = await searchParams;
  const returnTo = safeReturnTo(sp.returnTo);
  const firebaseClient = getFirebasePublicConfig();

  const sessionUser = await getServerSessionUser();
  if (sessionUser) {
    redirect(returnTo);
  }

  return (
    <>
      <PageHeader
        title="Giriş"
        description="Yalnızca Google ile giriş. Firebase Console’da Authentication → Google sağlayıcısını açın; canlı ortamda yetkili domain’leri ekleyin."
      />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        {firebaseClient ? (
          <LoginForm returnTo={returnTo} />
        ) : (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            Firebase istemci yapılandırması eksik. Depodaki{" "}
            <code className="text-foreground">.env.example</code> dosyasına bakıp{" "}
            <code className="text-foreground">NEXT_PUBLIC_FIREBASE_*</code> değişkenlerini{" "}
            <code className="text-foreground">.env.local</code> içinde tanımlayın.
          </p>
        )}
      </div>
    </>
  );
}
