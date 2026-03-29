import type { Metadata } from "next";
import { BesliCemberTools } from "@/components/besli-cember/besli-cember-tools";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "5'li çember",
  description:
    "Doğal, harmonik ve melodik ana dizilerin 21 modu — Tonal.js ile diyatonik üçlüler ve 5'li çember vurgusu.",
  alternates: { canonical: "/besli-cember" },
  openGraph: {
    title: "5'li çember",
    description:
      "Doğal, harmonik ve melodik ana dizilerin 21 modu — Tonal.js ile diyatonik üçlüler ve 5'li çember.",
    url: "/besli-cember",
  },
};

export default function BesliCemberPage() {
  return (
    <>
      <PageHeader
        title="5'li çember"
        description="Ana dizi (doğal / harmonik / melodik) ve mod seçimi Tonal.js ile hesaplanır; çemberde diyatonik vurgu, yan panellerde Roma rakamları."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <BesliCemberTools />
      </div>
    </>
  );
}
