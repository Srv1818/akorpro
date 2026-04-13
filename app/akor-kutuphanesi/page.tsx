import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { ChordLibraryExplorer } from "@/components/chord-library/chord-library-explorer";

export const metadata: Metadata = {
  title: "Akorlar",
  description:
    "Kök nota ve kalite seçerek gitar perdeleri üzerinde akor pozisyonları — chords-db ile çoklu varyasyonlar ve parmak numaraları.",
  alternates: { canonical: "/akor-kutuphanesi" },
  openGraph: {
    title: "Akorlar",
    description:
      "Kök nota ve kalite seçerek gitar perdeleri üzerinde akor pozisyonları — chords-db ile çoklu varyasyonlar ve parmak numaraları.",
    url: "/akor-kutuphanesi",
  },
};

export default function AkorKutuphanesiPage() {
  return (
    <>
      <PageHeader
        title="Akorlar"
        description="Kök nota ve kalite seçin; perdeler üzerinde chords-db verisiyle pozisyonlar, barre ve parmak numaraları gösterilir."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <ChordLibraryExplorer />
      </div>
    </>
  );
}
