import { chordPath, previewPath } from "@/lib/paths";

/** Önizleme demo: ilk mock şarkı — navbar tek URL için */
const previewDemo = previewPath("duman", "kufi");

export const mainNav = [
  { href: "/kesfet", label: "Keşfet" },
  { href: "/gitar-akorlari", label: "Şarkılar" },
  { href: "/akor-kutuphanesi", label: "Kütüphane" },
  { href: "/gamlar", label: "Gamlar" },
  { href: "/besli-cember", label: "5'li Çember" },
  { href: "/calma-listeleri", label: "Listeler" },
  { href: previewDemo, label: "Önizleme" },
] as const;

export const footerNav = [
  { href: "/kesfet", label: "Keşfet" },
  { href: "/gitar-akorlari", label: "Tüm şarkılar" },
  { href: "/arama", label: "Arama" },
  { href: "/akor-kutuphanesi", label: "Akor kütüphanesi" },
  { href: "/gamlar", label: "Gamlar" },
  { href: "/besli-cember", label: "5'li çember" },
  { href: "/calma-listeleri", label: "Çalma listeleri" },
  { href: previewDemo, label: "Önizleme" },
  { href: chordPath("duman", "kufi"), label: "Örnek akor sayfası" },
] as const;
