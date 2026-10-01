import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/paths";

/**
 * Canlı yayın alan adı. Başka bir adreste çalışıyorsak orası staging'dir.
 *
 * GEÇİŞTE DEĞİŞTİRİLECEK TEK SATIR BU. `akorpro.com` yayına alınırken burası
 * "akorpro.com" olacak; aksi halde yeni site staging sayılır ve `Disallow: /`
 * döner, yani Google'a tamamen kapalı kalır. Aşağıdaki üretim kuralları
 * geçişe hazır durumda bekliyor.
 */
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
        disallow: [
          "/api/*",
          // Payload paneli ve API'si. `.com.tr`'nin canlı robots.txt'sinde
          // /admin vardı, bu dosyada yoktu — geçişte eksik kalmasın.
          "/admin",
          "/admin/*",
          "/payload-api/*",
          "/giris",
          "/calma-listeleri",
          "/katki",
          "/preview/*",
          /**
           * Next'in ürettiği paylaşım görseli rotaları. Google bunları sayfa
           * sanıp tarıyor: `.com.tr` taramasında sekiz tanesi "taranmış ama
           * dizine eklenmemiş" kutusuna düşmüştü ve tarama bütçesi boşa
           * gidiyordu. (2026-09-30 Search Console incelemesi.)
           */
          "/*/opengraph-image*",
          "/opengraph-image*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
