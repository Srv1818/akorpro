import Link from "next/link";

/**
 * Bu grupta BİLEREK `loading.tsx` yok — geri eklemeyin.
 *
 * Bir `loading.tsx` segmentin tamamını örtük bir Suspense sınırına alıyor.
 * Next yedek arayüzü çizer çizmez yanıtı akıtmaya başlıyor ve 200 durum kodu
 * gönderilmiş oluyor; sonrasında `notFound()` çalışsa bile durum 404'e
 * çevrilemiyor. Sonuç: içeriği "bulunamadı" olan ama HTTP 200 dönen yumuşak
 * 404 sayfaları. Google bunları düşük kaliteli kopya sayfa sayıyor.
 * (Next dokümanı: loading#status-codes.)
 *
 * Kaldırıldıktan sonra ölçüldü: olmayan şarkı ve sanatçı 404, var olan
 * şarkı 200. Sayfalar hızlı (sanatçı sayfası ~30 ms), yükleme animasyonuna
 * ihtiyaç yok. Bir sayfanın gerçekten yavaş bir bölümü olursa, var oluş
 * kontrolünden SONRA gelen bir `<Suspense>` ile çözün — şarkı sayfasında
 * böyle yapılıyor.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Sayfa bulunamadı</h1>
      <p className="mt-3 text-sm text-muted">
        Aradığınız adres taşınmış, silinmiş veya hiç var olmamış olabilir. Kanonik şarkı yolları{" "}
        <code className="rounded bg-surface px-1 font-mono text-xs">/akor/…/…</code> biçimindedir.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
        >
          Ana sayfa
        </Link>
        <Link href="/gitar-akorlari" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
          Tüm şarkılar
        </Link>
        <Link href="/" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
          Keşfet
        </Link>
      </div>
    </div>
  );
}
