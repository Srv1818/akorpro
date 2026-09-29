import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { ContributionSection } from "@/components/contribution/contribution-section";

export const metadata: Metadata = {
  title: "Katkı girişi",
  description: "Yönetici katkı formu — akor ve şarkı gönderimi.",
  alternates: { canonical: "/katki" },
  robots: { index: false, follow: false },
};

export default async function KatkiPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/giris?returnTo=/katki");
  }
  if (!user.admin) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Katkı girişi</h1>
      <p className="mt-2 text-sm text-muted">
        Bu sayfa yalnızca yöneticiler içindir. Gönderiler moderasyon kuyruğuna düşer.
      </p>
      <div className="mt-8">
        <ContributionSection />
      </div>
    </div>
  );
}
