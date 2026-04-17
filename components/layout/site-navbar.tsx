import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { MobileNav } from "@/components/layout/mobile-nav";
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
      {/* Kapsayıcıyı flex-col (alt alta sıralama) yaptık ki iki satır oluşturabilelim */}
      <div className="mx-auto flex flex-col max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* --- 1. SATIR: Logo, Arama Çubuğu, Sağ Menü --- */}
        <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 md:gap-4">
          <Link
            href="/"
            aria-label="AkorPro ana sayfa"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-display"
          >
            <img
              src="/icons/icon.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 select-none"
              decoding="async"
            />
            <span className="hidden sm:inline" aria-hidden>
              AkorPro
            </span>
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

        {/* --- 2. SATIR: Tab Bar --- */}
        <div className="hidden md:flex w-full justify-center overflow-x-auto pb-3 pt-1">
          <NavTabs />
        </div>
        
      </div>
    </header>
  );
}