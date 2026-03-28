import Link from "next/link";
import { footerNav, legalNav } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
                AP
              </span>
              AkorPro
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Gitar akorları, gamlar ve müzik teorisi araçları — okunabilir, erişilebilir ve topluluk odaklı bir
              deneyim için tasarlandı.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <nav className="flex max-w-xl flex-wrap gap-x-6 gap-y-2" aria-label="Alt bağlantılar">
              {footerNav.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-muted transition hover:text-accent"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Yasal">
              {legalNav.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs text-muted/70 transition hover:text-accent"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-8 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} AkorPro. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
