import type { Metadata } from "next";
import { GamlarToolsLazy } from "@/components/gamlar/gamlar-tools-lazy";
import { PageHeader } from "@/components/content/page-header";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Gamlar",
  description: "Diyatonik modlar, pentatonik diziler, blues, harmonik/melodik minör ve simetrik gamlar — fretboard ve 5'li çember ile interaktif keşif.",
  alternates: { canonical: "/gamlar" },
  openGraph: {
    title: "Gamlar",
    description: "Diyatonik modlar, pentatonik diziler, blues, harmonik/melodik minör ve simetrik gamlar — fretboard ve 5'li çember ile interaktif keşif.",
    url: "/gamlar",
  },
};

export default function GamlarPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Gam nedir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Gam, belirli bir kurallar dizisine göre seçilmiş notalar topluluğudur. Gitarda bir gamı öğrenmek; hangi perdelerin birlikte uyumlu çalındığını, solo çalarken hangi notaların güvenli olduğunu ve bir şarkının hangi ton duygusunu taşıdığını anlamak demektir.",
              },
            },
            {
              "@type": "Question",
              name: "Majör ve minör gamlar arasındaki fark nedir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Majör gam neşeli ve parlak bir tını verir; pop, rock ve folk müziğinin temelini oluşturur. Minör gamlar ise hüzünlü ve dramatik bir his yaratır. Doğal minör (Aeolian), harmonik minör ve melodik minör olmak üzere üç temel minör aile vardır. Harmonik minörün yükseltilmiş 7. derecesi, Orta Doğu ve flamenco müziğindeki egzotik karakteri verir.",
              },
            },
            {
              "@type": "Question",
              name: "Müzikal modlar nedir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Modlar, majör dizinin farklı derecelerinden başlatılmış gamlardır. Dorian modu hafifçe minör ama enerjik bir his verirken, Phrygian İspanyol flamencosunu çağrıştırır. Mixolydian ise blues ve rock gitaristlerinin sıkça başvurduğu, dominant-seventh akorlarıyla uyumlu bir moddur.",
              },
            },
            {
              "@type": "Question",
              name: "Pentatonik ve blues gamları nedir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Minör pentatonik gam, gitaristlerin en popüler başlangıç noktasıdır; yalnızca 5 nota içerir ve çoğu müzikal bağlamda yanlış nota yoktur. Blues gamı, pentatoniğe blue note (b5) eklenerek elde edilir ve karakteristik kirli blues tınısını yaratır. Majör pentatonik ise country ve soul melodilerinin temelidir.",
              },
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Gamlar — İnteraktif Gam Keşif Aracı",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/gamlar`,
          description:
            "Majör, minör, pentatonik ve blues gamlarını fretboard üzerinde görselleştiren interaktif müzik teorisi aracı.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
          inLanguage: "tr",
        }}
      />
      <Breadcrumbs
        visuallyHidden
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Gamlar", href: "/gamlar" },
        ]}
      />
      <PageHeader
        title="Gamlar"
        description="Gam seçin, tonal merkezi belirleyin — fretboard ve 5'li çember otomatik güncellenir."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <GamlarToolsLazy />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="border-t border-border pt-10">
          <h2 className="mb-6 text-xl font-semibold text-display">Gam nedir?</h2>
          <div className="prose prose-sm max-w-none text-muted [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:mb-4 [&_p]:leading-relaxed">
            <p>
              Gam, belirli bir kurallar dizisine göre seçilmiş notalar topluluğudur. Gitarda bir gamı
              öğrenmek; hangi perdelerin birlikte uyumlu çalındığını, solo çalarken hangi notaların
              güvenli olduğunu ve bir şarkının hangi ton duygusunu taşıdığını anlamak demektir.
            </p>

            <h3>Majör ve minör gamlar</h3>
            <p>
              Majör gam (Ionian modu) neşeli ve parlak bir tını verir; pop, rock ve folk müziğinin
              temelini oluşturur. Minör gamlar ise hüzünlü ve dramatik bir his yaratır. Doğal minör
              (Aeolian), harmonik minör ve melodik minör olmak üzere üç temel minör aile vardır.
              Harmonik minörün yükseltilmiş 7. derecesi, Orta Doğu ve flamenco müziğindeki egzotik
              karakteri verir.
            </p>

            <h3>Modlar</h3>
            <p>
              Modlar, majör dizinin farklı derecelerinden başlatılmış gamlar olarak düşünülebilir.
              Dorian modu hafifçe minör ama enerjik bir his verirken, Phrygian İspanyol flamencosunu
              çağrıştırır. Mixolydian ise blues ve rock gitaristlerinin sıkça başvurduğu,
              dominant-seventh akorlarıyla uyumlu bir moddur.
            </p>

            <h3>Pentatonik ve blues gamları</h3>
            <p>
              Minör pentatonik gam, gitaristlerin en popüler başlangıç noktasıdır; yalnızca
              5 nota içerir ve çoğu müzikal bağlamda "yanlış" nota yoktur. Blues gamı, pentatoniğe
              blue note (b5) eklenerek elde edilir ve o karakteristik kirli blues tınısını yaratır.
              Majör pentatonik ise country ve soul melodilerinin temelidir.
            </p>

            <h3>Bu araç nasıl kullanılır?</h3>
            <p>
              Üstteki araçla bir gam ailesi ve mod seçin, ardından kök notayı (tonal merkez)
              belirleyin. Fretboard, seçilen gamın gitardaki tüm pozisyonlarını anında gösterir.
              5'li çember panelinde ise o gama ait diyatonik üçlü ve yedili akorlar vurgulanır.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
