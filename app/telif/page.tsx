import type { Metadata } from "next";
import { TakedownForm } from "./takedown-form";

export const metadata: Metadata = {
  title: "Telif ve İçerik Kaldırma",
  description:
    "AkorPro telif hakları politikası — içerik kaldırma talebi süreci ve iletişim bilgileri.",
  alternates: { canonical: "/telif" },
};

export default function TelifPage() {
  return (
    <article className="prose-custom mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1>Telif Hakları ve İçerik Kaldırma</h1>
      <p className="lead">Son güncelleme: Mart 2026</p>

      <h2>1. Genel İlke</h2>
      <p>
        AkorPro, müzik eğitimi ve kişisel kullanım amacıyla şarkı akor
        dizilimlerini sunar. Telif hakkı sahiplerinin haklarına saygı gösteririz.
        Platformdaki her şarkı kaydında, varsa telif/kaynak bilgisi{" "}
        <code>copyrightSource</code> alanında belirtilir.
      </p>

      <h2>2. Telif Hakkı Sahibiyseniz</h2>
      <p>
        Eserinizin izinsiz yayımlandığını düşünüyorsanız aşağıdaki kaldırma
        talebini (takedown) iletebilirsiniz. Talepler en geç <strong>72 saat</strong>{" "}
        içinde değerlendirilir.
      </p>

      <h2>3. Kaldırma Talebi İçin Gerekli Bilgiler</h2>
      <ol>
        <li>Telif hakkı sahibinin veya yetkili temsilcinin tam adı ve iletişim bilgileri.</li>
        <li>Kaldırılmasını talep ettiğiniz içeriğin tam URL&apos;si (şarkı sayfası adresi).</li>
        <li>Orijinal eserin tanımı (şarkı adı, sanatçı, albüm vb.).</li>
        <li>Telif hakkı sahipliğini veya temsil yetkisini gösteren açıklama ya da belge.</li>
        <li>Talebin iyi niyetle yapıldığına dair beyan.</li>
      </ol>

      <h2>4. Süreç</h2>
      <ol>
        <li>
          <strong>Talep alındı</strong> — E-posta veya aşağıdaki form ile.
        </li>
        <li>
          <strong>İnceleme</strong> — İçerik geçici olarak yayından
          kaldırılabilir (<code>moderationStatus → rejected</code>).
        </li>
        <li>
          <strong>Bildirim</strong> — İçeriği yükleyen katkıcıya bilgi verilir.
        </li>
        <li>
          <strong>Karşı itiraz</strong> — Katkıcı 10 iş günü içinde itiraz
          edebilir.
        </li>
        <li>
          <strong>Kesinleşme</strong> — İtiraz olmaz veya reddedilirse içerik
          kalıcı olarak kaldırılır; <code>copyrightSource</code> alanı güncellenir.
        </li>
      </ol>

      <h2>5. İletişim</h2>
      <p>
        E-posta: <strong>telif@akorpro.com.tr</strong>
      </p>
      <p>
        Veya aşağıdaki formu kullanarak doğrudan talep gönderebilirsiniz:
      </p>

      <TakedownForm />

      <h2>6. Tekrarlayan İhlaller</h2>
      <p>
        Telif haklarını tekrarlayan şekilde ihlal eden kullanıcıların hesapları
        askıya alınabilir veya kalıcı olarak kapatılabilir.
      </p>
    </article>
  );
}
