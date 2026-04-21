import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { webPageJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "AkorPro ile iletişim — hata bildirimi, katkı, şarkı talebi ve genel sorular için info@akorpro.com.tr.",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    title: "İletişim",
    description:
      "Hata bildirimi, katkı, şarkı talebi ve genel sorular için AkorPro ile iletişim.",
    url: "/iletisim",
  },
};

const CONTACT_EMAIL = "info@akorpro.com.tr";
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}`;

export default function IletisimPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          name: "İletişim",
          description:
            "AkorPro ile iletişim — hata bildirimi, katkı, şarkı talebi ve genel sorular için info@akorpro.com.tr.",
          url: "/iletisim",
        })}
      />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="prose-custom">
        <h1 id="iletisim-baslik" className="!mb-2">
          İletişim
        </h1>
        <p className="!mb-3 text-sm leading-snug">
          Aşağıdaki konularda bize ulaşabilirsiniz; hepsi için aynı adresi kullanın. Mesajınızda mümkün
          olduğunca net bilgi ve varsa bağlantı vermeniz işlemleri hızlandırır.
        </p>

        <div className="not-prose mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="text-xs font-medium text-muted">E-posta</span>
          <a
            href={MAILTO_HREF}
            className="break-all text-base font-semibold text-accent underline-offset-4 hover:underline sm:text-lg"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <ul className="not-prose mt-0 list-none space-y-3 pl-0 text-sm leading-relaxed text-foreground sm:text-[15px]">
          <li className="rounded-lg border border-border/60 bg-surface/50 px-3 py-3">
            <strong className="text-foreground">Hata bildirimi</strong>
            <p className="mt-1.5 text-muted">
              Bir şarkı sayfasındaki akor, söz veya başka bir hatayı fark ettiyseniz bize yazın.
              Mümkünse ilgili sayfanın adresini kopyalayın; yoksa sanatçı ve şarkı adını açıkça belirtin.
            </p>
          </li>
          <li className="rounded-lg border border-border/60 bg-surface/50 px-3 py-3">
            <strong className="text-foreground">Katkı (akor paylaşımı)</strong>
            <p className="mt-1.5 text-muted">
              Hazırladığınız akor ve düzenlemeleri paylaşmak için{" "}
              <a href={MAILTO_HREF} className="font-medium text-accent">
                {CONTACT_EMAIL}
              </a>{" "}
              adresine doğrudan e-posta gönderin. İnceleyebilmemiz için mümkün olduğunca ayrıntı verin:
              şarkı ve sanatçı adı, ton veya kapo, tempo veya ölçü (varsa), akor gövdesi (bölümlerle birlikte),
              varsa kaynak veya telif notu. Eklemek istediğiniz dosyaları e-postaya ek olarak da
              gönderebilirsiniz.
            </p>
          </li>
          <li className="rounded-lg border border-border/60 bg-surface/50 px-3 py-3">
            <strong className="text-foreground">Şarkı talebi</strong>
            <p className="mt-1.5 text-muted">
              Sitede henüz yer almayan bir şarkının eklenmesini istiyorsanız sanatçı ve şarkı adını
              yazın; mümkünse orijinal kaynak, albüm veya referans linki ekleyin. Talepler topluluk ve
              editör uygunluğuna göre sıraya alınır.
            </p>
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted">
          Telif ve içerik kaldırma talepleri için lütfen{" "}
          <Link href="/telif" className="font-medium text-accent underline-offset-4 hover:underline">
            Telif
          </Link>{" "}
          sayfasındaki süreci izleyin.
        </p>
      </article>
    </div>
    </>
  );
}
