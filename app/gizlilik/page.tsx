import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Politikası",
  description:
    "AkorPro gizlilik politikası — kişisel verilerin korunması, KVKK hakları ve veri işleme ilkeleri.",
  alternates: { canonical: "/gizlilik" },
};

export default function GizlilikPage() {
  return (
    <article className="prose-custom mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1>Gizlilik ve KVKK Politikası</h1>
      <p className="lead">
        Son güncelleme: Mart 2026
      </p>

      <p>
        AkorPro (&quot;biz&quot;, &quot;Platform&quot;), kullanıcılarının gizliliğini
        ciddiye alır. Bu politika 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (KVKK) kapsamında kişisel verilerinizin nasıl toplandığını, işlendiğini ve
        korunduğunu açıklar.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <p>
        Veri sorumlusu AkorPro platformunun işletmecisidir. İletişim bilgileri{" "}
        <Link href="/kullanim-kosullari">Kullanım Koşulları</Link> sayfasında
        yer almaktadır.
      </p>

      <h2>2. Toplanan Veriler</h2>
      <table>
        <thead>
          <tr>
            <th>Veri kategorisi</th>
            <th>Örnekler</th>
            <th>Hukuki dayanak</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hesap bilgileri</td>
            <td>E-posta, görünen ad (Google oturumu ile)</td>
            <td>Açık rıza / sözleşmenin ifası</td>
          </tr>
          <tr>
            <td>Kullanıcı tercihleri</td>
            <td>Tema, transpoze ayarı, çalma listeleri</td>
            <td>Sözleşmenin ifası</td>
          </tr>
          <tr>
            <td>Çerezler &amp; analitik</td>
            <td>Oturum çerezi, GA4 anonim ölçüm verileri</td>
            <td>Meşru menfaat / açık rıza</td>
          </tr>
          <tr>
            <td>Katkı içerikleri</td>
            <td>Akor/söz gönderileri, moderasyon notları</td>
            <td>Sözleşmenin ifası</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Verilerin İşlenme Amaçları</h2>
      <ul>
        <li>Platformun çalıştırılması ve hizmet sunulması.</li>
        <li>Oturum yönetimi ve kimlik doğrulama.</li>
        <li>Kullanıcı tercihlerinin saklanması (transpoze, liste vb.).</li>
        <li>İçerik moderasyonu ve topluluk güvenliği.</li>
        <li>Performans ve hata izleme (Web Vitals, Sentry).</li>
        <li>Anonim kullanım istatistikleri (GA4 — rıza sonrası).</li>
      </ul>

      <h2>4. Veri Saklama ve Güvenlik</h2>
      <p>
        Verileriniz Google Firebase (Firestore, Authentication) altyapısında
        şifreli olarak saklanır. Sunucu tarafı erişim Admin SDK ile, güvenlik
        kuralları (Firestore Rules) ile korunur. HTTPS zorunludur.
      </p>

      <h2>5. Üçüncü Taraf Paylaşım</h2>
      <p>
        Kişisel veriler reklam amacıyla üçüncü taraflara satılmaz. Yalnızca
        aşağıdaki hizmet sağlayıcılarla teknik zorunluluk çerçevesinde paylaşılır:
      </p>
      <ul>
        <li>Google Firebase — kimlik doğrulama, veritabanı, barındırma.</li>
        <li>Google Analytics 4 — anonim kullanım verileri (consent mode ile).</li>
        <li>Sentry — hata raporlama (anonim, IP maskeleme).</li>
      </ul>

      <h2>6. KVKK Kapsamındaki Haklarınız</h2>
      <p>KVKK m.11 uyarınca aşağıdaki haklara sahipsiniz:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
        <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
        <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme.</li>
        <li>İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.</li>
        <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme.</li>
      </ul>

      <h2>7. Hesap Silme ve Veri Dışa Aktarma</h2>
      <p>
        Hesap silme talebinizi e-posta ile iletebilirsiniz. Hesap silindiğinde
        kimlik bilgileri, çalma listeleri, songOverrides ve katkı geçmişiniz
        kalıcı olarak kaldırılır. İşlem en geç 30 gün içinde tamamlanır.
      </p>
      <p>
        Verilerinizin bir kopyasını JSON formatında talep edebilirsiniz (veri
        taşınabilirliği hakkı).
      </p>

      <h2>8. Çerezler</h2>
      <p>
        Çerez kullanım detayları için{" "}
        <Link href="/cerez-politikasi">Çerez Politikası</Link> sayfamızı
        ziyaret edin.
      </p>

      <h2>9. Değişiklikler</h2>
      <p>
        Bu politikada yapılacak değişiklikler bu sayfada yayımlanır. Önemli
        değişikliklerde kayıtlı kullanıcılara bildirim yapılabilir.
      </p>

      <h2>10. İletişim</h2>
      <p>
        Gizlilik ile ilgili sorularınız için:{" "}
        <strong>gizlilik@akorpro.com.tr</strong>
      </p>
    </article>
  );
}
