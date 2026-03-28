import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "AkorPro çerez politikası — kullanılan çerez türleri, amaçları ve yönetim seçenekleri.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CerezPolitikasiPage() {
  return (
    <article className="prose-custom mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1>Çerez Politikası</h1>
      <p className="lead">Son güncelleme: Mart 2026</p>

      <h2>1. Çerez Nedir?</h2>
      <p>
        Çerezler, tarayıcınız tarafından cihazınıza kaydedilen küçük metin
        dosyalarıdır. Web sitelerinin sizi tanımasına, tercihlerinizi hatırlamasına
        ve kullanım istatistikleri toplamasına olanak tanır.
      </p>

      <h2>2. Kullandığımız Çerez Türleri</h2>
      <table>
        <thead>
          <tr>
            <th>Çerez</th>
            <th>Tür</th>
            <th>Süre</th>
            <th>Amaç</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>__session</code></td>
            <td>Zorunlu</td>
            <td>Oturum / 14 gün</td>
            <td>Firebase kimlik doğrulama oturumu (HTTP-only).</td>
          </tr>
          <tr>
            <td><code>akorpro-theme</code></td>
            <td>İşlevsel</td>
            <td>1 yıl</td>
            <td>Tema tercihi (dark/light) — FOUC önleme.</td>
          </tr>
          <tr>
            <td><code>akorpro-consent</code></td>
            <td>Zorunlu</td>
            <td>1 yıl</td>
            <td>Çerez rıza tercihinin saklanması.</td>
          </tr>
          <tr>
            <td><code>_ga</code>, <code>_ga_*</code></td>
            <td>Analitik</td>
            <td>2 yıl</td>
            <td>Google Analytics 4 — anonim kullanım ölçümü. Yalnızca rıza verildiğinde etkinleşir.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Zorunlu ve İsteğe Bağlı Çerezler</h2>
      <p>
        <strong>Zorunlu çerezler</strong> (oturum, rıza kaydı) platformun
        çalışması için gereklidir ve kapatılamaz.
      </p>
      <p>
        <strong>Analitik çerezler</strong> yalnızca çerez banner&apos;ında &quot;Kabul
        Et&quot; seçeneğini onaylamanız halinde etkinleştirilir. Google Analytics
        4, <em>consent mode v2</em> ile çalışır: rıza verilmeden veri
        toplanmaz.
      </p>

      <h2>4. Çerezleri Yönetme</h2>
      <ul>
        <li>Sayfanın altındaki çerez banner&apos;ından tercihlerinizi değiştirebilirsiniz.</li>
        <li>Tarayıcı ayarlarından tüm çerezleri silebilir veya engelleyebilirsiniz.</li>
        <li>Zorunlu çerezleri engellemek bazı özelliklerin çalışmamasına neden olabilir.</li>
      </ul>

      <h2>5. Üçüncü Taraf Çerezleri</h2>
      <p>
        Google Analytics dışında üçüncü taraf çerezi kullanılmaz. GA4 çerezleri
        Google&apos;ın <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
        Gizlilik Politikası</a>&apos;na tabidir.
      </p>

      <h2>6. İletişim</h2>
      <p>
        Çerezlerle ilgili sorularınız için{" "}
        <Link href="/gizlilik">Gizlilik Politikası</Link> sayfamızdaki
        iletişim adresini kullanabilirsiniz.
      </p>
    </article>
  );
}
