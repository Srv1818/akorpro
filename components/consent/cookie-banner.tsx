"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { type ConsentValue, CONSENT_COOKIE, setConsentCookie } from "@/lib/consent";

function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

/**
 * GA4/Clarity izin durumunu günceller. GTM bu çağrıyı dataLayer'da görüyor.
 */
function applyConsent(value: ConsentValue) {
  const w = window as unknown as Record<string, unknown>;
  const gtag = w.gtag as ((...args: unknown[]) => void) | undefined;
  if (typeof gtag !== "function") return;

  gtag("consent", "update", {
    analytics_storage: value === "all" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/**
 * Çerez bandı. Sunucuda da render ediliyor — bilerek.
 *
 * Eskiden `ssr: false` ile ayrı bir chunk olarak yükleniyor, üstüne de
 * "LCP adayı olmasın" diye `requestIdleCallback(..., {timeout: 3000})` ile
 * geciktiriliyordu. İkisi birlikte mobilde LCP'yi 6,4 saniyeye çıkarmıştı:
 * ölçümde LCP öğesi bu banttaki paragraftı ve sürenin %86'sı (5,5 sn) saf
 * render gecikmesiydi. Boyamayı geciktirmek bandın LCP olmasını engellemiyor,
 * yalnızca LCP'yi geciktiriyor.
 *
 * Şimdi band ilk HTML'in içinde geliyor ve FCP ile boyanıyor; hidrasyonu
 * beklemiyor. Daha önce karar vermiş ziyaretçide ise `<head>`'deki
 * `ConsentBootstrap` onu boyanmadan gizliyor.
 *
 * Buraya tekrar `ssr: false` veya bir gecikme eklemeyin — ölçülen regresyon bu.
 */
export function CookieBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Kayıtlı karar varsa izni GTM'e bildir. Bandın görünürlüğü burada değil,
  // ConsentBootstrap'in eklediği `consent-set` sınıfında belirleniyor.
  useEffect(() => {
    const stored = getCookieValue(CONSENT_COOKIE);
    if (stored) applyConsent(stored as ConsentValue);
  }, []);

  const decide = useCallback((value: "all" | "essential") => {
    setConsentCookie(value);
    applyConsent(value);
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div
      data-consent-banner
      role="dialog"
      aria-label="Çerez bildirimi"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 p-4 backdrop-blur-sm sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          Deneyiminizi iyileştirmek için zorunlu çerezler ve anonim analitik
          çerezleri kullanıyoruz.{" "}
          <Link href="/cerez-politikasi" className="font-medium text-foreground underline underline-offset-2 hover:text-accent">
            Çerez Politikası
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Yalnızca zorunlu
          </button>
          <button
            type="button"
            onClick={() => decide("all")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted"
          >
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
