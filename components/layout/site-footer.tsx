import Link from "next/link";
import { legalNav } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-transparent py-6" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          
          {/* Sol: Telif Hakkı ve Marka Adı */}
          <div className="flex items-center gap-2">
            <img
              src="/icons/icon.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px] shrink-0 opacity-80"
              decoding="async"
            />
            <span className="text-[10px] font-semibold text-display/40 uppercase tracking-wider">
              AkorPro
            </span>
            <span className="text-border/50">|</span>
            <p className="text-[10px] text-muted/50" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} Tüm hakları saklıdır.
            </p>
          </div>

          {/* Sağ: Sadece Yasal Linkler */}
          <nav className="flex gap-x-5" aria-label="Yasal">
            {legalNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[10px] text-muted/40 transition hover:text-accent hover:text-muted/80"
              >
                {l.label}
              </Link>
            ))}
          </nav>

        </div>
      </div>
    </footer>
  );
}