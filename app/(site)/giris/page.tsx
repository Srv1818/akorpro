import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { googleLoginUrl } from "@/lib/auth/sso";
import { PasswordLoginForm } from "@/components/auth/password-login-form";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Oturum açma.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/giris" },
};

function safeReturnTo(raw: string | string[] | undefined): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw === "/giris" || raw.startsWith("/giris?")) return "/";
  return raw;
}

/**
 * Giriş — Payload.
 *
 * İki yol var: Google ile tek tıkla (OAuth2 eklentisi) ve e-posta + parola
 * (Payload'ın yerleşik ucu). İkincisi bilinçli olarak duruyor — tek giriş yolu
 * Google olsaydı, Google tarafında bir aksilikte panele hiç girilemezdi.
 *
 * Google yapılandırılmamışsa o düğme hiç görünmez; parola girişi her zaman var.
 */
export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[]; reason?: string; hata?: string }>;
}) {
  const sp = await searchParams;
  const returnTo = safeReturnTo(sp.returnTo);

  const sessionUser = await getServerSessionUser();
  if (sessionUser) {
    redirect(returnTo);
  }

  const loginUrl = googleLoginUrl(returnTo);

  return (
    <>
      <PageHeader title="Giriş" description="Devam etmek için oturum aç." />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        {sp.reason || sp.hata ? (
          <p role="alert" className="mb-6 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            Giriş tamamlanamadı. Lütfen tekrar dene.
          </p>
        ) : null}

        {loginUrl ? (
          <>
            <a
              href={loginUrl}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:bg-bg"
            >
              Google ile giriş yap
            </a>
            <div className="my-6 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              veya
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}

        <PasswordLoginForm returnTo={returnTo} />
      </div>
    </>
  );
}
