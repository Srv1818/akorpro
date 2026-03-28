import type { Metadata } from "next";
import { GamlarTools } from "@/components/gamlar/gamlar-tools";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "Gamlar",
  description: "Diyatonik modlar, pentatonik diziler, blues, harmonik/melodik minör ve simetrik gamlar — fretboard ve 5'li çember ile interaktif keşif.",
};

export default function GamlarPage() {
  return (
    <>
      <PageHeader
        title="Gamlar"
        description="Gam seçin, tonal merkezi belirleyin — fretboard ve 5'li çember otomatik güncellenir."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <GamlarTools />
      </div>
    </>
  );
}
