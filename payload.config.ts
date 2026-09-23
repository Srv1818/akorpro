import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { sentryPlugin } from "@payloadcms/plugin-sentry";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";

import { Artists } from "./payload/collections/Artists";
import { ChordLibrary } from "./payload/collections/ChordLibrary";
import { Contributions } from "./payload/collections/Contributions";
import { ContributorProfiles } from "./payload/collections/ContributorProfiles";
import { DiscoverItems, DiscoverSections } from "./payload/collections/Discover";
import { Media } from "./payload/collections/Media";
import { PlaylistItems, Playlists } from "./payload/collections/Playlists";
import { Scales } from "./payload/collections/Scales";
import { SongContributors } from "./payload/collections/SongContributors";
import { Songs } from "./payload/collections/Songs";
import { TakedownRequests } from "./payload/collections/TakedownRequests";
import { Users } from "./payload/collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** R2 yalnız tüm değişkenler varsa bağlanır; yerelde dosya sistemi kullanılır. */
const r2Configured =
  Boolean(process.env.R2_BUCKET) &&
  Boolean(process.env.R2_ACCESS_KEY_ID) &&
  Boolean(process.env.R2_SECRET_ACCESS_KEY) &&
  Boolean(process.env.R2_ENDPOINT);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " — AkorPro",
    },
  },

  collections: [
    Songs,
    Artists,
    Contributions,
    ContributorProfiles,
    SongContributors,
    ChordLibrary,
    Scales,
    DiscoverSections,
    DiscoverItems,
    Playlists,
    PlaylistItems,
    TakedownRequests,
    Media,
    Users,
  ],

  /* Zengin metin editörü bilerek yok: tek bir richText alanı kullanılmıyor.
     Akor gövdesi `code` alanında HTML olarak tutuluyor. Lexical hem gereksiz
     bir bağımlılık hem de top-level await içerdiği için Payload CLI'ını
     kırıyordu (ERR_REQUIRE_ASYNC_MODULE). */

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? "",
    },
    // Üretimde şema değişikliği otomatik uygulanmaz; migration dosyası üretilir.
    push: process.env.NODE_ENV !== "production",
  }),

  secret: process.env.PAYLOAD_SECRET ?? "",

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  /**
   * Payload'ın REST/GraphQL API'si varsayılan olarak `/api` altında yaşar ve
   * projedeki mevcut `app/api/*` route'larıyla (playlists, search, takedown,
   * revalidate) aynı yola düşerdi. Ayrı bir tabana alındı.
   *
   * Ön yüz zaten HTTP değil Local API kullanıyor; bu adresi pratikte yalnız
   * admin panelinin kendisi çağırıyor.
   */
  routes: {
    api: "/payload-api",
    admin: "/admin",
  },

  // Next.js bu adresi zaten biliyor; CORS'u aynı kaynağa kısıtlıyoruz.
  cors: [process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],
  csrf: [process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],

  plugins: [
    // Şarkı ve sanatçı sayfalarında kod üretimi var; bu eklenti editöre
    // kayıt başına override imkânı veriyor.
    seoPlugin({
      collections: ["songs", "artists"],
      uploadsCollection: "media",
      generateTitle: ({ doc }) => {
        const d = doc as { title?: string; name?: string; artistName?: string };
        if (d.title && d.artistName) return `${d.title} Akor — ${d.artistName} | AkorPro`;
        return `${d.title ?? d.name ?? ""} | AkorPro`;
      },
    }),

    // İçerik girişi kalan asıl iş; toplu CSV alma/verme bunun için.
    importExportPlugin({
      collections: [
        { slug: "songs" },
        { slug: "artists" },
        { slug: "chord-library" },
        { slug: "scales" },
      ],
    }),

    ...(process.env.NEXT_PUBLIC_SENTRY_DSN
      ? [sentryPlugin({ options: { captureErrors: [400, 403, 404, 500] }, Sentry: undefined as never })]
      : []),

    ...(r2Configured
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.R2_BUCKET as string,
            config: {
              endpoint: process.env.R2_ENDPOINT,
              region: "auto",
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
              },
            },
          }),
        ]
      : []),
  ],
});
