import { chordPath } from "@/lib/paths";

export const mainNav = [
  { href: "/", label: "🧭 Keşfet" },
  { href: "/gitar-akorlari", label: "🎵 Şarkılar" },
  { href: "/akor-kutuphanesi", label: "🎸 Akorlar" },
  { href: "/gamlar", label: "🎼 Gamlar" },
  { href: "/besli-cember", label: "⭕ 5'li Çember" },
  { href: "/calma-listeleri", label: "📋 Listeler" },
] as const;

export const footerNav = [
  { href: "/", label: "Keşfet" },
  { href: "/gitar-akorlari", label: "Tüm şarkılar" },
  { href: "/arama", label: "Arama" },
  { href: "/akor-kutuphanesi", label: "Akorlar" },
  { href: "/gamlar", label: "Gamlar" },
  { href: "/besli-cember", label: "5'li çember" },
  { href: "/calma-listeleri", label: "Çalma listeleri" },
  { href: chordPath("duman", "kufi"), label: "Örnek akor sayfası" },
] as const;

export const legalNav = [
  { href: "/gizlilik", label: "Gizlilik" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
  { href: "/telif", label: "Telif" },
] as const;
