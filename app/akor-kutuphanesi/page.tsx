import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { ChordLibraryExplorer } from "@/components/chord-library/chord-library-explorer";
import { getAllChordShapesCached } from "@/lib/firestore/chord-library";

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

/** ISR: 1 hour (TTL.CHORD_LIBRARY). Admin write'ları tag invalidation ile anlık yansıtır. */
export const revalidate = 3600;

export default async function AkorKutuphanesiPage() {
  let customShapes: Array<{
    id: string;
    name: string;
    root: string;
    quality: string;
    fingering: string;
    fingers?: string;
    sortOrder?: number;
    barreFret?: number;
  }> = [];
  try {
    const rows = await getAllChordShapesCached();
    customShapes = rows.map((row) => ({
      id: row.id,
      name: row.name,
      root: row.root,
      quality: row.quality,
      fingering: row.fingering,
      fingers: row.fingers,
      sortOrder: row.sortOrder,
      barreFret: row.barreFret,
    }));
  } catch {
    // Firestore erişimi yoksa sayfayı paket verisi fallback ile çalıştır.
  }

  return (
    <>
      <PageHeader
        title="Akorlar"
        description="Kök nota ve kalite seçin; perdeler üzerinde chords-db verisiyle pozisyonlar, barre ve parmak numaraları gösterilir."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <ChordLibraryExplorer customShapes={customShapes} />
      </div>
    </>
  );
}
