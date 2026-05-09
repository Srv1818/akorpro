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
 * Fires GA4 consent mode update then (optionally) loads the gtag script.
 */
function applyConsent(value: ConsentValue) {
  const w = window as unknown as Record<string, unknown>;
  const gtag = w.gtag as ((...args: unknown[]) => void) | undefined;

  if (typeof gtag === "function") {
    if (value === "all") {
      gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    } else {
      gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }
}

export function CookieBanner() {
  const [needsConsent, setNeedsConsent] = useState(false);
  // Separate from needsConsent so the element is in the DOM but not painted
  // until after the first browser frame — prevents banner from becoming the LCP candidate.
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const stored = getCookieValue(CONSENT_COOKIE);
    if (!stored) {
      setNeedsConsent(true);
      // Double rAF: first frame commits layout, second frame is after first paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPainted(true));
      });
    } else {
      applyConsent(stored as ConsentValue);
    }
  }, []);

  const accept = useCallback(() => {
    setConsentCookie("all");
    applyConsent("all");
    setNeedsConsent(false);
  }, []);

  const reject = useCallback(() => {
    setConsentCookie("essential");
    applyConsent("essential");
    setNeedsConsent(false);
  }, []);

  if (!needsConsent) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez bildirimi"
      aria-hidden={!painted}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 p-4 backdrop-blur-sm sm:p-5${painted ? "" : " invisible"}`}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          Deneyiminizi iyileştirmek için zorunlu çerezler ve anonim analitik
          çerezleri kullanıyoruz.{" "}
          <Link href="/cerez-politikasi" className="text-accent underline-offset-2 hover:underline">
            Çerez Politikası
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Yalnızca zorunlu
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted"
          >
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
