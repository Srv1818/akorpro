import type { Metadata } from "next";
import { BesliCemberTools } from "@/components/besli-cember/besli-cember-tools";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "5'li Çember",
  description:
    "5'li çember: Gamlar sayfasıyla aynı gam ailesi ve mod seçimi; diyatonik üçlüler çemberde vurgulanır.",
  alternates: { canonical: "/besli-cember" },
  openGraph: {
    title: "5'li Çember",
    description: "5'li çember — gam aileleri, modlar ve tonal merkez; diyatonik akorlar çemberle eşlenir.",
    url: "/besli-cember",
  },
};

export default function BesliCemberPage() {
  return (
    <>
      <PageHeader
        title="5'li Çember"
        description="Majör, doğal / harmonik / melodik minör ailelerinden mod seçin, kök notayı belirleyin — diyatonik üçlüler panellerde ve çemberde gösterilir (dış: majör, orta: minör, iç: dim)."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <BesliCemberTools />
      </div>
    </>
  );
}
