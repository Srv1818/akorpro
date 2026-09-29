import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { ChordLibraryExplorer } from "@/components/chord-library/chord-library-explorer";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllChordShapesCached } from "@/lib/firestore/chord-library";
import { SITE_URL } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Akorlar",
  description:
    "Gitar akor kütüphanesi: majör, minör, dominant 7, sus, dim ve daha fazlası. Kök nota ve kalite seçerek perde pozisyonlarını, barre ve parmak numaralarını görün.",
  alternates: { canonical: "/akor-kutuphanesi" },
  openGraph: {
    title: "Akorlar",
    description:
      "Gitar akor kütüphanesi: majör, minör, dominant 7, sus, dim ve daha fazlası. Kök nota ve kalite seçerek perde pozisyonlarını, barre ve parmak numaralarını görün.",
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Akor Kütüphanesi — İnteraktif Gitar Akor Aracı",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/akor-kutuphanesi`,
          description:
            "Kök nota ve kalite seçerek gitar perdelerinde akor pozisyonları, barre ve parmak numaralarını gösteren interaktif araç.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
          inLanguage: "tr",
        }}
      />
      <Breadcrumbs
        visuallyHidden
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Akor Kütüphanesi", href: "/akor-kutuphanesi" },
        ]}
      />
      <PageHeader
        title="Akorlar"
        description="Kök nota ve kalite seçin; perdeler üzerinde chords-db verisiyle pozisyonlar, barre ve parmak numaraları gösterilir."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <ChordLibraryExplorer customShapes={customShapes} />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="border-t border-border pt-10">
          <h2 className="mb-6 text-xl font-semibold text-display">Gitar akorları hakkında</h2>
          <div className="prose prose-sm max-w-none text-muted [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:mb-4 [&_p]:leading-relaxed">
            <p>
              Gitar akorları, aynı anda basılan iki veya daha fazla notanın oluşturduğu armonik
              yapılardır. Bir şarkıyı çalarken ritim gitaristi genellikle akorları tutar, melodi
              ise tek tek notalardan oluşur. Akorları öğrenmek; şarkı eşliği yapmanın, şarkı
              yazmanın ve müzik teorisini kavramanın en hızlı yoludur.
            </p>

            <h3>Temel akor kaliteleri</h3>
            <p>
              <strong>Majör akorlar</strong> parlak ve neşeli hissettirirken, <strong>minör
              akorlar</strong> hüzünlü ve içe dönük bir karakter taşır. <strong>Dominant 7
              (7)</strong> akorlar blues ve funk müziğinin vazgeçilmez yapı taşlarıdır; gergin
              ama enerjik bir his verirler. <strong>Majör 7 (maj7)</strong> ve <strong>minör 7
              (m7)</strong> akorlar ise caz ve R&B'de sıkça karşılaşılan daha zengin, renkli
              varyanttır.
            </p>

            <h3>Sus, dim ve aug akorlar</h3>
            <p>
              <strong>Sus2 ve sus4</strong> akorlar, 3. dereceyi kaldırarak majör ya da minör
              olmayan belirsiz ama modern bir his yaratır; pop ve rock geçişlerinde renk katmak
              için kullanılır. <strong>Azalmış (dim)</strong> akorlar gerilimli ve dramatik bir
              karakter taşır. <strong>Artık (aug)</strong> akorlar ise yükseltilmiş 5. derece
              sayesinde tuhaf ve gergin bir his üretir.
            </p>

            <h3>Bare akorlar</h3>
            <p>
            İşaret parmağınızı bir perde boyunca birden fazla teli kapatacak şekilde yatırarak uyguladığınız bare tekniği, açık akor pozisyonlarını klavyenin her yerine taşımanıza olanak tanır. E majör ve A majör pozisyonları en yaygın bare şekilleridir; sadece bu iki şekil öğrenildiğinde gitarda 24 farklı majör ve minör akora ulaşmak mümkündür.
            </p>

            <h3>Bu araç nasıl kullanılır?</h3>
            <p>
              Üstteki araçta kök nota (C, D, E…) ve akor kalitesini (majör, minör, 7, maj7…)
              seçin. Seçilen akora ait tüm perde pozisyonları, hangi parmağın nereye basacağı
              ve varsa bare perdesinin konumu otomatik olarak gösterilir. Birden fazla varyasyon
              arasında geçiş yaparak klavyenin farklı bölgelerindeki pozisyonları karşılaştırabilirsiniz.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
