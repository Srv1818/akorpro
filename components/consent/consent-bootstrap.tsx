import { CONSENT_COOKIE } from "@/lib/consent";

/**
 * Çerez bandını boyamadan ÖNCE gizlemek için `<head>`'e giren iki satır.
 *
 * Band artık sunucuda render ediliyor (bkz. `cookie-banner.tsx`), yani ilk
 * HTML'in içinde geliyor ve FCP ile birlikte boyanıyor. Daha önce karar vermiş
 * ziyaretçiye onu hiç göstermemek gerek — ama bunu React'e bırakırsak band bir
 * an görünüp kaybolur. O yüzden karar `<head>`'de, gövde ayrıştırılmadan önce
 * veriliyor: çerez varsa `<html>`'e bir sınıf ekleniyor ve band hiç boyanmıyor.
 *
 * Neden `cookies()` ile sunucuda okumuyoruz: root layout o anda dinamik hale
 * gelir ve tamamen statik prerender edilemez (aynı gerekçe `proxy.ts`'te CSP
 * için de yazılı). Çerez istemcide senkron okunabildiği için buna gerek yok.
 *
 * Boyanmayan öğe LCP adayı da olmuyor — zaten bütün mesele buydu.
 */
const BOOTSTRAP = `try{if(/(^|;\\s*)${CONSENT_COOKIE}=/.test(document.cookie)){document.documentElement.classList.add('consent-set')}}catch(e){}`;

export function ConsentBootstrap() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: ".consent-set [data-consent-banner]{display:none}",
        }}
      />
      <script
        dangerouslySetInnerHTML={{ __html: BOOTSTRAP }}
      />
    </>
  );
}
