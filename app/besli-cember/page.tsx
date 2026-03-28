import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "5'li çember",
  description: "Çember aracı iskeleti — SVG/Canvas ve Preview store senkronu ileride.",
};

export default function BesliCemberPage() {
  return (
    <>
      <PageHeader
        title="5'li çember"
        description="Ton merkezi ve mod seçimi burada tek bir görsel bileşende toplanacak. Şimdilik yer tutucu; tıklama → merkez güncelleme akışı ARCHITECTURE’daki Preview store ile hizalanacak."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex aspect-square max-h-[min(28rem,70vw)] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-bg">
          <div className="text-center text-muted">
            <p className="text-sm font-medium text-foreground">CircleOfFifths</p>
            <p className="mt-1 text-xs">Tam sayfa + widget varyantı (Faz 1 bileşen iskelesi)</p>
          </div>
        </div>
      </div>
    </>
  );
}
