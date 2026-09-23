/**
 * Lighthouse CI — dark/light tema ve sahne modu dahil.
 *
 * Tema kontrolü: `akorpro-theme` cookie'si ile Lighthouse Puppeteer
 * scriptleri üzerinden her URL iki kez test edilir (light + dark).
 *
 * Sahne modu: `/akor/duman/kufi?scene=1` ek URL olarak eklenir.
 */

const BASE = "http://localhost:3000";

const URLS_LIGHT = [
  `${BASE}/`,
  `${BASE}/gitar-akorlari`,
  `${BASE}/akor/duman/kufi`,
  `${BASE}/akor/duman/kufi?scene=1`,
];

const URLS_DARK = URLS_LIGHT.map((u) => {
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}__lh_theme=dark`;
});

module.exports = {
  ci: {
    collect: {
      url: [...URLS_LIGHT, ...URLS_DARK],
      numberOfRuns: 2,
      startServerCommand: "",
      settings: {
        preset: "desktop",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      },
      puppeteerScript: "./scripts/lighthouse-puppeteer.cjs",
      puppeteerLaunchOptions: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "interactive": ["warn", { maxNumericValue: 5000 }],
        "color-contrast": ["error", { minScore: 1 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
