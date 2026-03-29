import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { ChordLibraryExplorer } from "@/components/chord-library/chord-library-explorer";
import { chordPath } from "@/lib/paths";

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
        <p className="mt-6 text-sm text-muted">
          Örnek şarkı bağlamı için{" "}
          <Link href={chordPath("duman", "kufi")} className="font-medium text-accent hover:underline">
            Duman — Kufi
          </Link>{" "}
          sayfasına gidin.
        </p>
      </div>
    </>
  );
}
