import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobilePageTitle } from "@/components/layout/mobile-page-title";
import { NavTabs } from "@/components/layout/nav-tabs";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { mainNav } from "@/lib/nav";

export function SiteNavbar() {
  const items = [...mainNav];

  return (
    <header
      id="ana-menu"
      className="relative z-50 border-b border-border bg-bg/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── MOBİL SATIR (< md) ─────────────────────────────────────── */}
        <div className="flex h-14 items-center gap-2 md:hidden">
          {/* Sol: logo */}
          <Link
            href="/"
            aria-label="AkorPro ana sayfa"
            className="flex shrink-0 items-center"
          >
            <img
              src="/icons/icon.svg"
              alt="AkorPro"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 select-none"
              decoding="async"
            />
          </Link>

          {/* Orta: sayfa başlığı */}
          <div className="flex min-w-0 flex-1 justify-center">
            <MobilePageTitle />
          </div>

          {/* Sağ: arama ikonu + hamburger */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/arama"
              aria-label="Arama"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:border-accent/40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <MobileNav items={items} />
          </div>
        </div>

        {/* ── MASAÜSTÜ SATIR (≥ md) ──────────────────────────────────── */}
        <div className="hidden h-16 items-center gap-3 md:flex md:gap-4">
          <Link
            href="/"
            aria-label="AkorPro ana sayfa"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-display"
          >
            <img
              src="/assets/logo/akorpro_ap_logo.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 select-none"
              decoding="async"
            />
            <span aria-hidden>AkorPro</span>
          </Link>

          <div className="min-w-0 flex-1 px-4">
            <div className="mx-auto max-w-2xl">
              <SearchDialog />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <AuthHeaderActions />
          </div>
        </div>

        {/* ── TAB BAR (≥ md) ─────────────────────────────────────────── */}
        <div className="hidden md:flex w-full justify-center overflow-x-auto pb-3 pt-1">
          <NavTabs />
        </div>

      </div>
    </header>
  );
}
