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
          // Paylaşım görseli rotaları BİLEREK engellenmiyor — eklemeyin.
          //
          // 1 Ekim'de opengraph-image adreslerini engelleyen iki kalıp
          // eklenmişti. Gerekçe, Search Console'da sekiz opengraph adresinin
          // "taranmış ama dizine eklenmemiş" kutusuna düşmesiydi. Yanlış bir
          // karardı: o adresler sayfa değil, sosyal medya önizleme görselleri.
          // Engellenince X ve benzeri platformlar görseli çekemedi, paylaşım
          // kartları kırık kutu olarak göründü. (2026-10-02'de X'te gözlendi.)
          //
          // Taranıp dizine eklenmemeleri zaten doğru davranış; görsel
          // oldukları için sayfa olarak dizine girmeleri beklenmiyor.
          // Tarama bütçesi kaygısı kırık paylaşım kartına değmez.
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
