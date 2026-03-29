import { JsonLd } from "./json-ld";
import { SITE_URL } from "@/lib/paths";

export function SiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "AkorPro",
        url: SITE_URL,
        inLanguage: "tr",
        description:
          "Şarkı akorları, akorlar, gamlar ve 5'li çember ile çalışmayı kolaylaştıran modern bir platform.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/arama?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}
