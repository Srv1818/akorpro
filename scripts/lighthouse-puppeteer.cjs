/**
 * Lighthouse Puppeteer script — tema cookie'si ayarlayarak dark/light testlerini yönetir.
 *
 * URL'de `__lh_theme=dark` query parametresi varsa, sayfa yüklenmeden önce
 * `akorpro-theme=dark` cookie'si set edilir; aksi halde `light` kullanılır.
 */

const COOKIE_NAME = "akorpro-theme";

/**
 * @param {import('puppeteer').Browser} browser
 * @param {{ url: string }} context
 */
async function setup(browser, context) {
  const page = await browser.newPage();

  const url = new URL(context.url);
  const requestedTheme = url.searchParams.get("__lh_theme") || "light";

  url.searchParams.delete("__lh_theme");
  context.url = url.toString();

  await page.setCookie({
    name: COOKIE_NAME,
    value: requestedTheme,
    domain: url.hostname,
    path: "/",
  });

  await page.close();
}

module.exports = setup;
