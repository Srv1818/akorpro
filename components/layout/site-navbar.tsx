import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";

const nav = [
  { href: "/kesfet", label: "Keşfet" },
  { href: "/akor-kutuphanesi", label: "Kütüphane" },
  { href: "/gamlar", label: "Gamlar" },
  { href: "/besli-cember", label: "5'li Çember" },
] as const;

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
            AP
          </span>
          <span className="hidden sm:inline">AkorPro</span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <nav className="flex items-center gap-1" aria-label="Ana menü">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <ThemeToggle />
          <Link
            href="/giris"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted sm:px-4"
          >
            Giriş
          </Link>
          <MobileNav items={nav} />
        </div>
      </div>
    </header>
  );
}
