import type { Metadata } from "next";
import { GamlarTools } from "@/components/gamlar/gamlar-tools";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "Gamlar",
  description: "Gam mock verisi, 5'li çember ve fretboard scale modu — ortak Preview store.",
};

export default function GamlarPage() {
  return (
    <>
      <PageHeader
        title="Gamlar"
        description="Liste mock’tan; seçilen gam ve tonal merkez tek store ile fretboard’a bağlanır (ARCHITECTURE). Veri kaynağı ileride JSON/Firestore olabilir."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <GamlarTools />
      </div>
    </>
  );
}
