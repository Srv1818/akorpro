import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "AkorPro kullanım koşulları — platformun kullanım kuralları, sorumluluklar ve kısıtlamalar.",
  alternates: { canonical: "/kullanim-kosullari" },
};

export default function KullanimKosullariPage() {
  return (
    <article className="prose-custom mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1>Kullanım Koşulları</h1>
      <p className="lead">Son güncelleme: Mart 2026</p>

      <h2>1. Kabul</h2>
      <p>
        AkorPro platformunu kullanarak bu koşulları kabul etmiş sayılırsınız.
        Kabul etmiyorsanız platformu kullanmayınız.
      </p>

      <h2>2. Hizmet Tanımı</h2>
      <p>
        AkorPro, gitar akorları, şarkı sözleri, gamlar ve müzik teorisi araçları
        sunan bir web platformudur. İçerikler eğitim ve kişisel kullanım amaçlıdır.
      </p>

      <h2>3. Hesap ve Oturum</h2>
      <ul>
        <li>Hesap oluşturmak için geçerli bir Google hesabı gereklidir.</li>
        <li>Hesabınızın güvenliğinden siz sorumlusunuz.</li>
        <li>Hesap silme talebinizi iletebilirsiniz (<Link href="/gizlilik">Gizlilik Politikası</Link> §7).</li>
      </ul>

      <h2>4. Kullanıcı İçerikleri</h2>
      <p>
        Katkı (akor/söz gönderimi) yaparak içeriğin telif haklarına saygılı
        olduğunuzu beyan edersiniz. Platform, gönderilen içerikleri moderasyon
        sürecinden geçirir ve uygunsuz bulduğu içerikleri kaldırma hakkını
        saklı tutar.
      </p>

      <h2>5. Telif Hakları</h2>
      <p>
        Platformdaki şarkı akorları ve sözleri eğitim amaçlı sağlanmaktadır.
        Telif hakkı sahipleri içerik kaldırma talebinde bulunabilir.
        Detaylı süreç için <Link href="/telif">Telif ve İçerik Kaldırma</Link>{" "}
        sayfamızı inceleyin.
      </p>

      <h2>6. Yasaklanan Davranışlar</h2>
      <ul>
        <li>Platformu otomatik araçlarla (scraper, bot) kötüye kullanmak.</li>
        <li>Diğer kullanıcıların verilerine yetkisiz erişmeye çalışmak.</li>
        <li>Sahte kimlik ile hesap oluşturmak.</li>
        <li>Spam, zararlı yazılım veya yanıltıcı içerik paylaşmak.</li>
      </ul>

      <h2>7. Sorumluluk Sınırları</h2>
      <p>
        Platform &quot;olduğu gibi&quot; sunulur. Akor doğruluğu, eksiksizlik veya
        kesintisiz hizmet garanti edilmez. Platform, kullanıcıların eylemlerinden
        kaynaklanan zararlardan sorumlu tutulamaz.
      </p>

      <h2>8. Değişiklikler</h2>
      <p>
        Bu koşullar önceden bildirimle güncellenebilir. Güncelleme sonrası
        platformu kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz
        anlamına gelir.
      </p>

      <h2>9. Uygulanacak Hukuk</h2>
      <p>
        Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklarda
        İstanbul mahkemeleri ve icra daireleri yetkilidir.
      </p>

      <h2>10. İletişim</h2>
      <p>
        Sorularınız için: <strong>iletisim@akorpro.com.tr</strong>
      </p>
    </article>
  );
}
