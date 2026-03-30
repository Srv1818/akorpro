import Link from "next/link";
import { JsonLd } from "./json-ld";
import { SITE_URL } from "@/lib/paths";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
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
      <nav aria-label="Breadcrumb" className="mx-auto min-w-0 max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
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
                <span
                  className="whitespace-nowrap font-semibold text-foreground [font-synthesis:none]"
                  aria-current="page"
                >
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
