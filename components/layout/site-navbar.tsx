import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { mainNav } from "@/lib/nav";

export function SiteNavbar() {
  const items = [...mainNav];

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

        <div className="hidden flex-1 justify-center overflow-x-auto md:flex">
          <nav className="flex shrink-0 items-center gap-0.5 lg:gap-1" aria-label="Ana menü">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground lg:px-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <Link
            href="/arama"
            className="hidden rounded-lg px-2 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground sm:inline lg:hidden"
          >
            Ara
          </Link>
          <ThemeToggle />
          <AuthHeaderActions />
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
