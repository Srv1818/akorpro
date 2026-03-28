import type { Metadata } from "next";
import { BesliCemberTools } from "@/components/besli-cember/besli-cember-tools";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "5'li çember",
  description: "5'li çember ve tonal merkez — Preview store ile fretboard (akor modu) aynı state'i paylaşır.",
  alternates: { canonical: "/besli-cember" },
  openGraph: {
    title: "5'li çember",
    description: "5'li çember ve tonal merkez — Preview store ile fretboard (akor modu) aynı state'i paylaşır.",
    url: "/besli-cember",
  },
};

export default function BesliCemberPage() {
  return (
    <>
      <PageHeader
        title="5'li çember"
        description="Tıklama → tonal merkez güncellenir; fretboard majör üçlü vurgusu aynı Zustand store üzerinden okunur (ARCHITECTURE Faz 1)."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <BesliCemberTools />
      </div>
    </>
  );
}
