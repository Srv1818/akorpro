import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Payload'ın ürettiği dosyalar — elle düzenlenmiyor, lint'lenmesi anlamsız.
    "payload-types.ts",
    "migrations/**",
    "app/(payload)/admin/importMap.js",
  ]),

  {
    // Flat config: kuralı ezmek için eklentinin aynı nesnede tanımlı olması şart.
    plugins: { "react-hooks": reactHooks },
    rules: {
      /**
       * Kapalı: Türkçe metin kesme işaretiyle dolu — "5'li Çember",
       * "Payload'ın", "şarkının". Kuralın istediği `&apos;` yazımı kaynağı
       * okunmaz hale getiriyor ve JSX bu karakterleri zaten güvenle basıyor.
       * Tamamen biçimsel bir kural, doğrulukla ilgisi yok.
       */
      "react/no-unescaped-entities": "off",

      /**
       * Uyarıya düşürüldü, kapatılmadı.
       *
       * Yakaladığı yedi yer de bilinçli istemci desenleri: yol değişince
       * menüyü kapatma, çerez bannerının çerezi okuması, hidrasyon öncesi
       * `mounted` bayrağı. Bunlar sunucuda yapılamaz. Kural yeni ve bu
       * desenleri de eliyor; hata sayılırsa CI sürekli kırmızı kalır.
       * Uyarı olarak duruyor ki gözden kaçmasın — zamanla teker teker
       * `useSyncExternalStore` gibi karşılıklarına taşınabilir.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
