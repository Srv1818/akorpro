import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { mainNav } from "@/lib/nav";

export function SiteNavbar() {
  const items = [...mainNav];

  return (
    <header id="ana-menu" className="border-b border-border bg-bg/80 backdrop-blur-md" role="banner">
      {/* Kapsayıcıyı flex-col (alt alta sıralama) yaptık ki iki satır oluşturabilelim */}
      <div className="mx-auto flex flex-col max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* --- 1. SATIR: Logo, Arama Çubuğu, Sağ Menü --- */}
        <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 md:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
              AP
            </span>
            <span className="hidden sm:inline">AkorPro</span>
          </Link>

          {/* Masaüstü arama — orta sütun yalnızca bu blokta flex-1 (taşma yok) */}
          <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex md:px-4">
            <div className="w-full max-w-2xl">
              <SearchDialog />
            </div>
          </div>

          {/* Mobil arama — sağ ikon grubunun dışında flex-1; aksi halde shrink-0 içinde genişlik hesaplanmaz ve üst üste binebilir */}
          <div className="min-w-0 flex-1 md:hidden">
            <SearchDialog placeholder="Ara" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <AuthHeaderActions />
            <MobileNav items={items} />
          </div>
        </div>

        {/* --- 2. SATIR: Menü Linkleri (Görseldeki gibi alt kısma ortalandı) --- */}
        <div className="hidden md:flex w-full justify-center overflow-x-auto pb-3 pt-1">
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Ana menü">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
      </div>
    </header>
  );
}