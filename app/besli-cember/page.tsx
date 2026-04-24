import type { Metadata } from "next";
import { BesliCemberTools } from "@/components/besli-cember/besli-cember-tools";
import { PageHeader } from "@/components/content/page-header";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/paths";

export const metadata: Metadata = {
  title: "5'li Çember",
  description:
    "5'li çember: Gamlar sayfasıyla aynı gam ailesi ve mod seçimi; diyatonik üçlüler çemberde vurgulanır.",
  alternates: { canonical: "/besli-cember" },
  openGraph: {
    title: "5'li Çember",
    description: "5'li çember — gam aileleri, modlar ve tonal merkez; diyatonik akorlar çemberle eşlenir.",
    url: "/besli-cember",
  },
};

export default function BesliCemberPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "5'li Çember — İnteraktif Armoni Aracı",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/besli-cember`,
          description:
            "Tonal merkez ve mod seçimine göre diyatonik akorları 5'li çember üzerinde görselleştiren interaktif müzik teorisi aracı.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
          inLanguage: "tr",
        }}
      />
      <Breadcrumbs
        visuallyHidden
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "5'li Çember", href: "/besli-cember" },
        ]}
      />
      <PageHeader
        title="5'li Çember"
        description="Majör, doğal / harmonik / melodik minör ailelerinden mod seçin, kök notayı belirleyin — diyatonik üçlüler panellerde ve çemberde gösterilir (dış: majör, orta: minör, iç: dim)."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <BesliCemberTools />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="border-t border-border pt-10">
          <h2 className="mb-6 text-xl font-semibold text-display">5'li çember nedir?</h2>
          <div className="prose prose-sm max-w-none text-muted [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:mb-4 [&_p]:leading-relaxed">
            <p>
              5'li çember (circle of fifths), müzikteki 12 tonu aralarındaki tonal ilişkiye göre
              dairesel olarak düzenleyen bir referans aracıdır. Komşu tonlar arasında yalnızca bir
              diyez ya da bemol farkı vardır; bu yüzden birbirine yakın tonlar uyumlu akor
              geçişleri ve modülasyonlar için idealdir.
            </p>

            <h3>Gitarcılar için ne işe yarar?</h3>
            <p>
              Bir şarkının hangi akorlarının doğal hissettiğini anlamak için 5'li çember
              kullanılır. Örneğin C majör tonunda çalarken çembere bakarak Dm, Em, F, G, Am ve
              Bdim akorlarının diyatonik — yani o tona ait — olduğunu görebilirsiniz. Bu akorlar
              arasındaki geçişler kulağa "doğru" gelir çünkü aynı gam ailesinden gelirler.
            </p>

            <h3>Diyatonik üçlüler ve yedililer</h3>
            <p>
              Her tonun 7 derecesi, birer diyatonik üçlü akor üretir. Majör tonlarda bu akorların
              sırası her zaman aynıdır: majör, minör, minör, majör, majör, minör, azalmış (dim).
              Yedili akorlar ise caz ve pop armonisinde renk katmak için kullanılır. Bu araç,
              seçilen mod ve tonal merkeze göre tüm bu akorları çemberde anında gösterir.
            </p>

            <h3>Modlar ve tonal merkez</h3>
            <p>
              5'li çember yalnızca majör tonlarla sınırlı değildir. Dorian, Phrygian veya
              Mixolydian gibi bir mod seçildiğinde çember, o modun diyatonik akor yapısına göre
              yeniden düzenlenir. Bu sayede blues, rock ve caz gibi farklı türlerdeki armoni
              ilişkilerini de görselleştirebilirsiniz.
            </p>

            <h3>Bu araç nasıl kullanılır?</h3>
            <p>
              Üstteki araçta bir gam ailesi ve mod seçin, ardından kök notayı belirleyin. Çember,
              seçilen tona göre diyatonik akorları renklerle vurgular: dış halka majör, orta halka
              minör, iç halka dim akorlarını gösterir. Akor üzerine tıklayarak parmak pozisyonlarını
              ve tonal bağlamı inceleyebilirsiniz.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
