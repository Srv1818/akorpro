#!/usr/bin/env node
/**
 * Kesim (cutover) doğrulaması: envanterdeki her URL yeni yığında gerçekten 200 dönüyor mu?
 *
 * Kullanım:
 *   node scripts/verify-urls.mjs                          # https://akorpro.com.tr (production)
 *   node scripts/verify-urls.mjs --base https://akorpro.com   # kesim öncesi staging
 *   node scripts/verify-urls.mjs --redirect               # marka koruma kuralı:
 *                                                         # akorpro.com/<path> → 301 → akorpro.com.tr/<path>
 *   node scripts/verify-urls.mjs --tier P0                # yalnız P0
 *
 * Çıkış kodu: P0/P1'de tek bir hata bile varsa 1 → CI/kesim durur.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const BASE = (flag("base", "https://akorpro.com.tr")).replace(/\/+$/, "");
const TIER = flag("tier", null);
const REDIRECT_MODE = args.includes("--redirect");
const CONCURRENCY = Number(flag("concurrency", 6));

const inventory = JSON.parse(readFileSync("data/gsc/url-inventory.json", "utf8"));
// Kapsam dışı bırakılanlar (bkz. gsc-url-inventory.mjs → EXCLUDED) kontrol edilmez.
const targets = inventory.pages.filter((p) => !p.excluded && (!TIER || p.tier === TIER));

/**
 * Soft 404 tespiti — KRİTİK.
 *
 * Mevcut sitede eksik içerik HTTP 200 + "bulunamadı" gövdesi döndürüyor
 * (`/akor/yok/yok` → 200, `<meta name="robots" content="noindex">`).
 * Yalnız durum koduna bakmak, Directus'a girilmemiş bir şarkı için SAHTE YEŞİL üretir —
 * yani kesim doğrulamasının tek işe yarar kısmı bu kontrol.
 */
/** Trailing slash farkını eleyen tek kanonik biçim ("" yerine "/"). */
const normalizePath = (p) => p.replace(/\/+$/, "") || "/";

function detectSoftNotFound(body, path) {
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(body)) return "noindex meta";
  if (/<title>[^<]*bulunamad/i.test(body)) return "başlık: bulunamadı";
  const canonical = body.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonical) {
    let canonicalPath;
    try {
      canonicalPath = normalizePath(new URL(canonical[1]).pathname);
    } catch {
      canonicalPath = null;
    }
    // Soft 404 sayfaları anasayfaya canonical veriyor; istenen path ile eşleşmiyorsa şüpheli.
    if (canonicalPath && canonicalPath !== normalizePath(path)) {
      return `canonical uyuşmuyor (${canonicalPath})`;
    }
  }
  return null;
}

async function check(page) {
  const url = REDIRECT_MODE ? page.brandUrl : `${BASE}${page.path}`;
  try {
    const res = await fetch(url, {
      redirect: REDIRECT_MODE ? "manual" : "follow",
      headers: { "user-agent": "akorpro-cutover-check" },
    });
    if (REDIRECT_MODE) {
      const location = res.headers.get("location") ?? "";
      const expected = `https://akorpro.com.tr${page.path}`;
      const ok = res.status === 301 && location.replace(/\/+$/, "") === expected.replace(/\/+$/, "");
      return { ...page, url, status: res.status, location, ok };
    }
    if (res.status !== 200) {
      return { ...page, url, status: res.status, ok: false, reason: `HTTP ${res.status}` };
    }
    const softNotFound = detectSoftNotFound(await res.text(), page.path);
    return {
      ...page,
      url,
      status: res.status,
      finalUrl: res.url,
      ok: !softNotFound,
      reason: softNotFound ? `soft 404 — ${softNotFound}` : null,
    };
  } catch (err) {
    return { ...page, url, status: 0, error: String(err.message ?? err), ok: false, reason: "ağ hatası" };
  }
}

// Basit havuzlu eşzamanlılık — origin'i boğmadan.
const results = [];
const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    let page;
    while ((page = queue.shift())) results.push(await check(page));
  }),
);

results.sort((a, b) => a.tier.localeCompare(b.tier) || b.clicks - a.clicks);

const mode = REDIRECT_MODE ? "301 yönlendirme" : `200 kontrolü (${BASE})`;
console.log(`\n${mode} — ${results.length} URL\n`);
for (const r of results) {
  const mark = r.ok ? "✓" : "✗";
  const detail = REDIRECT_MODE
    ? `${r.status} → ${r.location || "(location yok)"}`
    : `${r.status}${r.reason ? ` — ${r.reason}` : ""}${r.error ? ` ${r.error}` : ""}`;
  console.log(`${mark} [${r.tier}] ${r.path}  ${detail}`);
}

const failed = results.filter((r) => !r.ok);
const blocking = failed.filter((r) => r.tier === "P0" || r.tier === "P1");
console.log(
  `\n${results.length - failed.length}/${results.length} geçti · ${blocking.length} engelleyici (P0/P1) hata`,
);
if (blocking.length) {
  console.error("\nKESİM ENGELLENDİ — önce şunlar düzeltilmeli:");
  for (const r of blocking) console.error(`  [${r.tier}] ${r.path} (${r.clicks} tıklama) — ${r.reason ?? "bilinmeyen"}`);
}
process.exit(blocking.length ? 1 : 0);
