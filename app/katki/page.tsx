import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/content/page-header";
import { ContributionFormClient } from "@/components/contribution/contribution-form-client";
import { ContributionListClient } from "@/components/contribution/contribution-list-client";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Katkıda bulun",
  description: "Şarkı akorlarını paylaşarak topluluğa katkıda bulunun. Moderatör onayı sonrası yayına alınır.",
  alternates: { canonical: "/katki" },
  openGraph: {
    title: "Katkıda bulun",
    description: "Şarkı akorlarını paylaşarak topluluğa katkıda bulunun. Moderatör onayı sonrası yayına alınır.",
    url: "/katki",
  },
};

export default async function ContributionPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/giris?returnTo=/katki");

  return (
    <>
      <PageHeader
        title="Katkıda bulun"
        description="Şarkı akor ve sözlerini gönderin. Moderatör onayı sonrası siteye eklenir ve katkıcı profilinizde görünür."
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-foreground">Yeni katkı gönder</h2>
            <div className="mt-4">
              <ContributionFormClient />
            </div>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">Katkılarım</h2>
            <div className="mt-4">
              <ContributionListClient />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
