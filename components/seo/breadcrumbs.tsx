import Link from "next/link";
import { JsonLd } from "./json-ld";
import { SITE_URL } from "@/lib/paths";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** Son öğe şarkı başlığıysa yumuşak `display`; sanatçı adıysa `foreground` (mevcut parlaklık korunur). */
  currentCrumbTone?: "display" | "foreground";
  /** Görsel navigasyonu gizler, JSON-LD yapısal veriyi korur. */
  visuallyHidden?: boolean;
};

export function Breadcrumbs({ items, currentCrumbTone = "foreground", visuallyHidden = false }: BreadcrumbsProps) {
  const currentClass =
    currentCrumbTone === "display"
      ? "whitespace-nowrap font-semibold text-display [font-synthesis:none]"
      : "whitespace-nowrap font-semibold text-foreground [font-synthesis:none]";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label="Breadcrumb" className={`mx-auto min-w-0 max-w-6xl px-4 pt-3 sm:px-6 lg:px-8${visuallyHidden ? " hidden" : ""}`}>
        <ol className="flex w-full min-w-0 max-w-full flex-nowrap items-baseline gap-x-2 overflow-x-auto overscroll-x-contain pb-1 text-sm leading-tight text-muted [-webkit-overflow-scrolling:touch]">
          {items.map((item, i) => (
            <li
              key={`${item.href}-${i}`}
              className="flex shrink-0 items-baseline gap-x-2"
            >
              {i > 0 ? (
                <span className="shrink-0 select-none text-muted/50" aria-hidden>
                  /
                </span>
              ) : null}
              {i === items.length - 1 ? (
                <span className={currentClass} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="whitespace-nowrap font-normal hover:text-accent hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
