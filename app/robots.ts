import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/paths";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/arama",
          "/admin",
          "/admin/*",
          "/api/*",
          "/giris",
          "/calma-listeleri",
          "/preview/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
