import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/music/**", "lib/firestore/import-validator.ts", "lib/stores/**"],
    },
  },
});
