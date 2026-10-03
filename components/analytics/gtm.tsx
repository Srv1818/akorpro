import Script from "next/script";

import { CONSENT_COOKIE } from "@/lib/consent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Etiket Yöneticisi — sayfadaki TEK ölçüm script'i.
 *
 * GA4 ve Microsoft Clarity doğrudan yüklenmiyor; ikisi de GTM kapsayıcısının
 * içinde etiket olarak tanımlı (bkz. `docs/gtm-kapsayici.json`). Yeni bir ölçüm
 * aracı eklemek deploy gerektirmiyor.
 *
 * ## Neden tek inline script
 *
 * Consent Mode v2'de sıra kritik: izin varsayılanları GTM kapsayıcısı
 * yüklenmeden önce dataLayer'da olmak zorunda, yoksa etiketler izin bilgisi
 * olmadan bir kez ateşlenir. İkisini ayrı `<Script>`'e bölüp sırayı Next'in
 * zamanlayıcısına bırakmıyoruz — burada elle, aynı dosyada sıralanıyorlar.
 *
 * Çerez senkron okunuyor: daha önce "tümünü kabul et" demiş ziyaretçide
 * `analytics_storage` doğrudan `granted` varsayılanıyla başlıyor, hidrasyonu
 * bekleyen bir `wait_for_update` yarışı yok. `CookieBanner` hidrasyondan sonra
 * ayrıca `gtag("consent","update",…)` gönderiyor; tekrar zararsız.
 *
 * ## Neden kapsayıcı `load` sonrasına erteleniyor
 *
 * Ölçüldü (Lighthouse, mobil): gtm.js + gtag.js birlikte 298 KiB, sayfadaki en
 * ağır tek parça ve 163 KiB'ı hiç çalışmıyor. Kritik yolda dururken ana iş
 * parçacığını meşgul edip LCP'yi geciktiriyordu.
 *
 * DİKKAT — bu, çerez bandında yaptığımız hatanın tersi değil: orada BOYANAN bir
 * öğeyi geciktirmek LCP'yi doğrudan geciktiriyordu. GTM boyanan bir öğe değil,
 * ertelenmesi LCP'yi yalnızca iyileştirebilir. Bandı asla böyle ertelemeyin.
 *
 * Bedeli bilinçli: ölçüm birkaç yüz ms geç başlıyor, sayfayı `load`'dan önce
 * terk eden oturumlar GA4'e düşmeyebilir.
 *
 * `<noscript>` iframe'i bilerek yok: JS'siz ziyaretçiden GA4 zaten veri
 * toplayamıyor ve iframe CSP'ye `frame-src` açmayı gerektiriyor.
 */
export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <Script id="gtm-consent-and-loader" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        (function(){
          var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: m && m[1] === 'all' ? 'granted' : 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted'
          });
        })();
        (function(w,d,s,l,i){
          function load(){
            w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          }
          function schedule(){
            if (w.requestIdleCallback) w.requestIdleCallback(load,{timeout:2000});
            else w.setTimeout(load,0);
          }
          if (d.readyState === 'complete') schedule();
          else w.addEventListener('load', schedule, {once:true});
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  );
}
