import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
]);

export default eslintConfig;
