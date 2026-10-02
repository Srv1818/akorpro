import Script from "next/script";

import { CONSENT_COOKIE } from "@/lib/consent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Etiket Yöneticisi — sayfadaki TEK ölçüm script'i.
 *
 * GA4 ve Microsoft Clarity artık doğrudan buradan yüklenmiyor; ikisi de GTM
 * kapsayıcısının içinde etiket olarak tanımlı (bkz. `docs/gtm-kapsayici.json`).
 * Yeni bir ölçüm aracı eklemek artık deploy gerektirmiyor.
 *
 * Consent Mode v2: varsayılanlar GTM yüklenmeden ÖNCE dataLayer'a yazılmak
 * zorunda, yoksa etiketler izin bilgisi olmadan bir kez ateşlenir. Bu yüzden
 * izin varsayılanı ile GTM yükleyicisi tek bir inline script içinde ve bu
 * sırada duruyor — ikisini ayrı <Script>'e bölmek sırayı garanti etmiyor.
 *
 * Çerez burada senkron okunuyor: daha önce "tümünü kabul et" demiş bir
 * ziyaretçide analytics_storage doğrudan 'granted' varsayılanıyla başlıyor.
 * `wait_for_update` ile hidrasyonu beklemek de çalışırdı ama ilk sayfa
 * görüntülemesini yarış koşuluna bırakırdı. CookieBanner yine de hidrasyondan
 * sonra `gtag("consent","update",…)` gönderiyor; bu tekrar zararsız.
 *
 * `<noscript>` iframe'i bilerek yok: JavaScript'siz ziyaretçiden GA4 zaten
 * veri toplayamıyor ve iframe CSP'ye `frame-src` açmayı gerektiriyor.
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
          var analytics = m && m[1] === 'all' ? 'granted' : 'denied';
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: analytics,
            functionality_storage: 'granted',
            security_storage: 'granted'
          });
        })();
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  );
}
