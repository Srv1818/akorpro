import type { Metadata } from "next";
import { BesliCemberTools } from "@/components/besli-cember/besli-cember-tools";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "5'li Çember",
  description:
    "5'li çember: Majör, Doğal Minör, Harmonik Minör ve Melodik Minör diyatonik akorlar.",
  alternates: { canonical: "/besli-cember" },
  openGraph: {
    title: "5'li Çember",
    description: "5'li çember — Majör / Doğal / Harmonik / Melodik Minör diyatonik akorlar.",
    url: "/besli-cember",
  },
};

export default function BesliCemberPage() {
  return (
    <>
      <PageHeader
        title="5'li Çember"
        description="Majör, Doğal Minör, Harmonik Minör ve Melodik Minör modlarını destekler. Çemberdeki bir tona tıklayarak diyatonik akor listesini görüntüleyin."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <BesliCemberTools />
      </div>
    </>
  );
}
