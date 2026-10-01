import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { sentryPlugin } from "@payloadcms/plugin-sentry";
import { s3Storage } from "@payloadcms/storage-s3";
import { OAuth2Plugin } from "payload-oauth2";
import { buildConfig } from "payload";

import { migrations } from "./migrations";

import { Artists } from "./payload/collections/Artists";
import { ChordLibrary } from "./payload/collections/ChordLibrary";
import { Contributions } from "./payload/collections/Contributions";
import { ContributorProfiles } from "./payload/collections/ContributorProfiles";
import { EditorPicks } from "./payload/collections/EditorPicks";
import { Media } from "./payload/collections/Media";
import { PlaylistItems, Playlists } from "./payload/collections/Playlists";
import { Scales } from "./payload/collections/Scales";
import { SongContributors } from "./payload/collections/SongContributors";
import { SongViews } from "./payload/collections/SongViews";
import { Songs } from "./payload/collections/Songs";
import { TakedownRequests } from "./payload/collections/TakedownRequests";
import { Users } from "./payload/collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Google'a hem authorize hem jeton takası adımında gönderilen adres.
 * İkisi birebir aynı olmak zorunda, bu yüzden tek yerden türetiliyor.
 */
const OAUTH_CALLBACK_URI = `${SITE_URL}/payload-api/users/oauth/callback`;

/**
 * `next build` sırasında Next bu değeri kendisi koyar; çalışma zamanında boş.
 *
 * Değişken DİNAMİK anahtarla okunuyor. `process.env.NEXT_PHASE` yazılsaydı
 * bundler değeri derleme anında sabitlerdi ve çalışma zamanında da "build"
 * görünürdü — migration hiç çalışmazdı (yaşandı: taze veritabanında 0 tablo,
 * imajın içinde "phase-production-build" dizesi gömülü çıktı).
 */
const isBuildPhase = (): boolean => {
  const key = "NEXT_PHASE";
  return process.env[key] === "phase-production-build";
};

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
    EditorPicks,
    Playlists,
    PlaylistItems,
    SongViews,
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
    // Geliştirmede şema doğrudan senkronlanır; üretimde asla (sütun düşürebilir).
    push: process.env.NODE_ENV !== "production",
    /**
     * Üretimde şema migration ile kurulur ve sunucu ayağa kalkarken uygulanır.
     *
     * Neden CLI değil: imaj `output: "standalone"` ile derleniyor ve standalone
     * çıktısı Payload CLI'ını taşımıyor. Konteynerde `npx payload migrate`
     * denendiğinde npm paketi indirmeye çalışıp tsconfig bulamadan çöküyor
     * (doğrulandı). Migration'ları buraya import etmek onları derleme grafiğine
     * sokuyor, yani standalone çıktısının içinde yer alıyorlar.
     *
     * Build sırasında BİLEREK devre dışı. İki sebep:
     * - Build veritabanını değiştirmemeli; prerender salt okuma olmalı.
     * - Geliştirmede push edilmiş bir veritabanına bağlanıldığında Payload
     *   "veri kaybı olacak, devam edeyim mi" diye soruyor ve build interaktif
     *   soruda süresiz donuyor (yaşandı). CI'da da aynısı olurdu.
     */
    prodMigrations: isBuildPhase() ? undefined : migrations,
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
  cors: [SITE_URL],
  csrf: [SITE_URL],

  plugins: [
    /**
     * Google ile giriş. Directus'taki SSO'nun karşılığı; aynı Google OAuth
     * istemcisi yeniden kullanılıyor, yalnız izinli redirect URI listesine
     * aşağıdaki callback adresinin eklenmesi gerekiyor.
     *
     * Yapılandırma eksikse eklenti hiç yüklenmiyor: yerelde ve CI'da parola
     * girişi yeterli, eksik env yüzünden uygulama açılmasın istemiyoruz.
     */
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          OAuth2Plugin({
            enabled: true,
            strategyName: "google",
            authCollection: "users",
            // Mevcut `googleId` alanı kullanılıyor; eklentinin varsayılanı `sub`.
            subFieldName: "googleId",
            useEmailAsIdentity: true,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            serverURL: SITE_URL,
            // Eklenti varsayılanı `/api/...` kuruyor; API tabanımız `/payload-api`.
            authorizeRedirectUri: OAUTH_CALLBACK_URI,
            tokenEndpoint: "https://oauth2.googleapis.com/token",
            /**
             * Jeton takasını eklentiye bırakmıyoruz.
             *
             * Eklentinin callback ucu redirect_uri'yi
             * `${serverURL}/api/${collection}${callbackPath}` diye SABİT kuruyor
             * ve Payload'ın `routes.api` ayarını yok sayıyor
             * (payload-oauth2/dist/callback-endpoint.js). Bizde API tabanı
             * `/payload-api`, çünkü `/api` uygulamanın kendi route'larında.
             *
             * Sonuç: authorize adımı `/payload-api/...` gönderiyor, takas adımı
             * `/api/...` gönderiyordu. OAuth her iki adımda aynı redirect_uri'yi
             * şart koşuyor; Google kodu reddediyor, eklenti erişim jetonu
             * alamayıp hata fırlatıyor ve kullanıcı "Giriş tamamlanamadı"
             * sayfasına düşüyordu. Google ekranı açıldığı için sorun orada
             * değil, dönüşte görünmüyordu. (2026-10-01)
             *
             * Burada `defaultGetToken` ile aynı işi yapıyoruz, tek farkı doğru
             * redirect_uri. PKCE kullanılmıyor, o yüzden code_verifier yok.
             */
            getToken: async (code: string): Promise<string> => {
              const res = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  Accept: "application/json",
                },
                body: new URLSearchParams({
                  code,
                  client_id: process.env.GOOGLE_CLIENT_ID as string,
                  client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                  redirect_uri: OAUTH_CALLBACK_URI,
                  grant_type: "authorization_code",
                }).toString(),
              });
              const data = (await res.json()) as { access_token?: string; error?: string };
              if (typeof data.access_token !== "string") {
                // Hata mesajı loga düşsün; eklenti yalnız yönlendirme yapıyor.
                throw new Error(`Google jeton takası başarısız: ${data.error ?? JSON.stringify(data)}`);
              }
              return data.access_token;
            },
            providerAuthorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            scopes: [
              "openid",
              "https://www.googleapis.com/auth/userinfo.email",
              "https://www.googleapis.com/auth/userinfo.profile",
            ],
            getUserInfo: async (accessToken: string) => {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (!res.ok) throw new Error(`Google userinfo ${res.status}`);
              const me = (await res.json()) as {
                sub: string;
                email?: string;
                name?: string;
                picture?: string;
              };
              return {
                email: me.email,
                googleId: me.sub,
                displayName: me.name,
                avatarUrl: me.picture,
                /**
                 * `role` BİLEREK gönderilmiyor — eklemeyin.
                 *
                 * Eklenti bu nesneyi hem kullanıcı oluştururken hem de HER
                 * girişte güncellerken aynen kullanıyor
                 * (payload-oauth2/dist/callback-endpoint.js). Burada
                 * `role: "contributor"` yazılıydı; niyet "ilk girişte katkıcı
                 * olsun" idi ama pratikte her girişte rolü eziyordu. Google
                 * girişi bugüne kadar hiç tamamlanmadığı için fark edilmemişti;
                 * 1 Ekim'de giriş düzelir düzelmez yönetici hesabı katkıcıya
                 * düştü ve panel kapandı.
                 *
                 * İlk giriş zaten katkıcı oluyor: Users koleksiyonunda `role`
                 * alanının `defaultValue` değeri "contributor". Yani niyet
                 * korunuyor, mevcut roller eziliyor değil.
                 */
              };
            },
            successRedirect: (req) => {
              const raw = req.searchParams?.get("returnTo") ?? "/";
              // Açık yönlendirme koruması: yalnız site içi yollar kabul edilir.
              return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
            },
            /**
             * Eklenti callback'teki her hatayı yutuyor ve yalnız buraya
             * veriyor (payload-oauth2/dist/callback-endpoint.js:193). Eskiden
             * hatayı atıyorduk; sonuç olarak giriş sessizce bozulabiliyordu ve
             * sunucu logunda tek satır bile çıkmıyordu. Artık yazılıyor.
             */
            failureRedirect: (_req, error) => {
              console.error("[oauth] Google girişi tamamlanamadı:", error);
              return "/giris?hata=google";
            },
          }),
        ]
      : []),

    /**
     * SEO eklentisi BİLEREK kullanılmıyor (2026-09-29'da kaldırıldı).
     *
     * Sayfalar metadata'yı `generateMetadata` içinde veriden üretiyor ve
     * ürettiği başlık eklentinin istediğinden daha iyi:
     *   üretilen : "Ömrüm Akor — Eypio | AkorPro"
     *   eklenti  : "Ömrüm | AkorPro"
     * Açıklama da ton, gam ve transpoze bilgisiyle otomatik doluyor.
     *
     * Eklenti panelde "0/3 kontrol geçiyor" diye kırmızı uyarı gösteriyor ama
     * o alanları hiçbir sayfa okumuyordu. Doldurulsaydı daha iyi olan
     * otomatik başlığı ezme riski vardı.
     */

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
