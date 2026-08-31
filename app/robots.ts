import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/paths";

/** Canlı yayın alan adı. Başka bir adreste çalışıyorsak orası staging'dir. */
const PRODUCTION_HOST = "akorpro.com.tr";

function isProduction(): boolean {
  try {
    return new URL(SITE_URL).hostname.endsWith(PRODUCTION_HOST);
  } catch {
    return false;
  }
}

export default function robots(): MetadataRoute.Robots {
  // Staging (`akorpro.com`) canlı sitenin birebir kopyası. İndekslenirse
  // `akorpro.com.tr` ile duplicate content çakışması doğar ve korumaya
  // çalıştığımız sıralamalara zarar verir — bu yüzden tamamen kapalı.
  if (!isProduction()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*", "/giris", "/calma-listeleri", "/preview/*"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
