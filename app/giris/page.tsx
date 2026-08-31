import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { googleLoginUrl } from "@/lib/auth/sso";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Google ile oturum açma.",
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
 * Giriş — Directus Google SSO.
 *
 * Firebase istemci SDK'sıyla popup/redirect açan `LoginForm` kalktı: giriş artık
 * tek bir tam sayfa yönlendirmesi. Directus Google ile kimliği doğrulayıp oturum
 * çerezini kendisi yazıyor ve `redirect` parametresindeki adrese geri döndürüyor.
 * Bu yüzden burada istemci tarafı JavaScript'e gerek yok.
 */
export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[]; reason?: string }>;
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
      <PageHeader title="Giriş" description="Devam etmek için Google hesabınla giriş yap." />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        {sp.reason ? (
          <p className="mb-6 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            Giriş tamamlanamadı. Lütfen tekrar dene.
          </p>
        ) : null}

        {loginUrl ? (
          <a
            href={loginUrl}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:bg-bg"
          >
            Google ile giriş yap
          </a>
        ) : (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            Giriş yapılandırması eksik.{" "}
            <code className="text-foreground">NEXT_PUBLIC_DIRECTUS_URL</code> ve{" "}
            <code className="text-foreground">NEXT_PUBLIC_SITE_URL</code> tanımlanmalı.
          </p>
        )}
      </div>
    </>
  );
}
