#!/usr/bin/env node
/**
 * GSC → kesim (cutover) URL envanteri.
 *
 * Girdi  (data/gsc/):
 *   pages.csv         GSC Performance → Sayfalar export (url,clicks,impressions)
 *   indexed.csv       GSC Sayfa dizine ekleme → Dizine eklendi export (url,last_crawl)
 *   sitemap-urls.txt  canlı sitemap.xml'den <loc> listesi
 *
 * Çıktı (data/gsc/):
 *   url-inventory.json    makine okunur envanter (verify-urls.mjs bunu tüketir)
 *   CUTOVER-CHECKLIST.md  insan okunur: kesimden önce Directus'a girilmesi zorunlu içerik
 *
 * Kullanım: node scripts/gsc-url-inventory.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DIR = "data/gsc";
const OLD_HOST = "akorpro.com.tr";
const NEW_HOST = "akorpro.com";

/**
 * Kesim kapsamı dışı bırakılan path'ler — gerekçesiyle.
 * Buraya giren URL envanterde `excluded` işaretlenir, zorunlu içerik listesine ve
 * verify-urls.mjs kontrolüne girmez.
 */
const EXCLUDED = {
  "/akor/kenan-dogulu/kursun-adres-sormaz-ki":
    "Karar (2026-08-20): kapsam dışı. 0 tıklama / 4 gösterim, pozisyon 54.5. " +
    "Sitemap'te yok ve canlıda zaten soft 404 — gerçek içerik değil. " +
    "İhtiyaç olursa yeni sitede normal içerik girişi olarak eklenir.",
};

/** www + trailing slash + protokol farklarını tek kanonik path'e indirger. */
function toPath(rawUrl) {
  const u = new URL(rawUrl.trim());
  let p = u.pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

function readCsv(file) {
  const [header, ...rows] = readFileSync(`${DIR}/${file}`, "utf8").trim().split("\n");
  const cols = header.split(",");
  return rows.map((line) => {
    // URL'lerde virgül yok; basit split yeterli.
    const cells = line.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

/** /akor/:artist/:song → şarkı, /sanatci/:slug → sanatçı, gerisi statik. */
function classify(path) {
  const seg = path.split("/").filter(Boolean);
  if (path === "/") return { kind: "static", key: "/" };
  if (seg[0] === "akor" && seg.length === 3) {
    return { kind: "song", artistSlug: seg[1], songSlug: seg[2], key: `${seg[1]}/${seg[2]}` };
  }
  if (seg[0] === "sanatci" && seg.length === 2) {
    return { kind: "artist", artistSlug: seg[1], key: seg[1] };
  }
  return { kind: "static", key: path };
}

// --- 1. Trafik verisini kanonik path'te birleştir (apex + www toplanır) ---
const byPath = new Map();
const wwwLeak = [];
for (const row of readCsv("pages.csv")) {
  const path = toPath(row.url);
  const clicks = Number(row.clicks);
  const impressions = Number(row.impressions);
  if (new URL(row.url).hostname.startsWith("www.")) {
    wwwLeak.push({ path, clicks, impressions });
  }
  const prev = byPath.get(path) ?? { path, clicks: 0, impressions: 0, variants: 0 };
  prev.clicks += clicks;
  prev.impressions += impressions;
  prev.variants += 1;
  byPath.set(path, prev);
}

const indexed = new Set(readCsv("indexed.csv").map((r) => toPath(r.url)));
const sitemap = new Set(
  readFileSync(`${DIR}/sitemap-urls.txt`, "utf8").trim().split("\n").map(toPath),
);

// --- 2. Tıklamaya göre sırala, kümülatif kapsama ile önceliklendir ---
const pages = [...byPath.values()].sort(
  (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
);
const totalClicks = pages.reduce((s, p) => s + p.clicks, 0);
const totalImpressions = pages.reduce((s, p) => s + p.impressions, 0);

let cum = 0;
for (const p of pages) {
  cum += p.clicks;
  const share = totalClicks ? cum / totalClicks : 1;
  // P0: tıklamaların %80'ini taşıyan sayfalar — kesim öncesi %100 dolmalı.
  // P1: kalan tıklama alan sayfalar. P2: yalnız gösterim alanlar (tıklama 0).
  p.tier = p.clicks === 0 ? "P2" : share <= 0.8 ? "P0" : "P1";
  p.cumulativeClickShare = Number(share.toFixed(4));
  Object.assign(p, classify(p.path));
  p.indexed = indexed.has(p.path);
  p.inSitemap = sitemap.has(p.path);
  p.newUrl = `https://${NEW_HOST}${p.path}`;
  p.oldUrl = `https://${OLD_HOST}${p.path}`;
  if (EXCLUDED[p.path]) {
    p.excluded = true;
    p.excludedReason = EXCLUDED[p.path];
  }
}

// --- 3. Kesim öncesi Directus'a girilmesi ZORUNLU içerik ---
const requiredSongs = pages.filter((p) => p.kind === "song" && !p.excluded);
const requiredArtists = new Set([
  ...pages.filter((p) => p.kind === "artist" && !p.excluded).map((p) => p.artistSlug),
  // Şarkı sayfası trafik alıyorsa sanatçısı da girilmek zorunda (FK).
  ...requiredSongs.map((p) => p.artistSlug),
]);

// --- 4. Kör noktalar ---
const sitemapNotIndexed = [...sitemap].filter((p) => !indexed.has(p)).sort();
const indexedNoTraffic = [...indexed].filter((p) => !byPath.has(p)).sort();
const trafficNotInSitemap = pages.filter((p) => !p.inSitemap).map((p) => p.path);

const inventory = {
  generatedFrom: { oldHost: OLD_HOST, newHost: NEW_HOST },
  totals: {
    uniquePaths: pages.length,
    totalClicks,
    totalImpressions,
    sitemapUrls: sitemap.size,
    indexedUrls: indexed.size,
    requiredSongs: requiredSongs.length,
    requiredArtists: requiredArtists.size,
  },
  tiers: {
    P0: pages.filter((p) => p.tier === "P0").length,
    P1: pages.filter((p) => p.tier === "P1").length,
    P2: pages.filter((p) => p.tier === "P2").length,
  },
  wwwDuplication: {
    urls: wwwLeak.length,
    clicks: wwwLeak.reduce((s, r) => s + r.clicks, 0),
    impressions: wwwLeak.reduce((s, r) => s + r.impressions, 0),
    paths: [...new Set(wwwLeak.map((r) => r.path))].sort(),
  },
  requiredContent: {
    artists: [...requiredArtists].sort(),
    songs: requiredSongs.map((p) => ({
      artistSlug: p.artistSlug,
      songSlug: p.songSlug,
      tier: p.tier,
      clicks: p.clicks,
      impressions: p.impressions,
    })),
  },
  blindSpots: { sitemapNotIndexed, indexedNoTraffic, trafficNotInSitemap },
  pages,
};

writeFileSync(`${DIR}/url-inventory.json`, JSON.stringify(inventory, null, 2));

// --- 5. Markdown checklist ---
const row = (p) =>
  `| ${p.tier} | \`${p.path}\` | ${p.clicks} | ${p.impressions} | ${p.indexed ? "✅" : "—"} | ☐ |`;
const md = `# Kesim (cutover) URL Checklist — \`${OLD_HOST}\` → \`${NEW_HOST}\`

> Otomatik üretildi: \`node scripts/gsc-url-inventory.mjs\`. Elle düzenleme.
> Kaynak: GSC Performance (son 3 ay) + GSC dizine ekleme + canlı sitemap.xml.

## Özet

| | |
|---|---|
| Trafik alan benzersiz path | **${pages.length}** |
| Toplam tıklama / gösterim | ${totalClicks} / ${totalImpressions} |
| Sitemap'teki URL | ${sitemap.size} |
| Google'ın dizine aldığı URL | **${indexed.size}** (sitemap'in %${Math.round((indexed.size / sitemap.size) * 100)}'i) |
| Girilmesi zorunlu şarkı | **${requiredSongs.length}** |
| Girilmesi zorunlu sanatçı | **${requiredArtists.size}** |

Öncelik: **P0** = tıklamaların ilk %80'i (kesim öncesi %100 dolmalı) · **P1** = kalan tıklama alanlar · **P2** = yalnız gösterim.

## Zorunlu içerik — Directus'a kesimden ÖNCE girilecek

| Öncelik | Path | Tıklama | Gösterim | Dizinde | Girildi |
|---|---|--:|--:|:-:|:-:|
${pages.filter((p) => p.kind !== "static" && !p.excluded).map(row).join("\n")}

## Statik sayfalar (içerik gerektirmez, sadece 200 dönmeli)

| Öncelik | Path | Tıklama | Gösterim | Dizinde | Doğrulandı |
|---|---|--:|--:|:-:|:-:|
${pages.filter((p) => p.kind === "static").map(row).join("\n")}

## Zorunlu sanatçı slug'ları (${requiredArtists.size})

${[...requiredArtists].sort().map((a) => `- [ ] \`${a}\``).join("\n")}

## www yinelenmesi (kesimde düzeltilecek)

\`www.${OLD_HOST}\` ayrı dizine alınmış: **${inventory.wwwDuplication.urls} URL**, \
**${inventory.wwwDuplication.clicks} tıklama**, **${inventory.wwwDuplication.impressions} gösterim** ayrı sayılıyor.
Yeni yığında \`www.${NEW_HOST}\` → \`${NEW_HOST}\` 301 zorunlu.

${inventory.wwwDuplication.paths.map((p) => `- \`${p}\``).join("\n")}

## Kapsam dışı bırakılanlar

${pages.filter((p) => p.excluded).map((p) => `- \`${p.path}\` (${p.clicks} tıklama / ${p.impressions} gösterim)\n  - ${p.excludedReason}`).join("\n") || "- (yok)"}

## Kör noktalar

- **Sitemap'te olup dizine alınmayan: ${sitemapNotIndexed.length} URL.** Bunlar zaten trafik almıyor; \
kesimde kaybedilecek bir şey yok, ama yeni yığında sitemap'in aynı URL'leri üretmesi beklenir.
- **Dizinde olup trafik almayan: ${indexedNoTraffic.length} URL.** Yine de 200 dönmeli.
${indexedNoTraffic.map((p) => `  - \`${p}\``).join("\n") || "  - (yok)"}
- **Trafik alıp sitemap'te olmayan: ${trafficNotInSitemap.length} URL.**
${trafficNotInSitemap.map((p) => `  - \`${p}\``).join("\n") || "  - (yok)"}
`;

writeFileSync(`${DIR}/CUTOVER-CHECKLIST.md`, md);

console.log(`✓ ${DIR}/url-inventory.json`);
console.log(`✓ ${DIR}/CUTOVER-CHECKLIST.md`);
console.log(
  `  ${pages.length} path · ${totalClicks} tıklama · P0=${inventory.tiers.P0} P1=${inventory.tiers.P1} P2=${inventory.tiers.P2}`,
);
console.log(
  `  zorunlu: ${requiredSongs.length} şarkı, ${requiredArtists.size} sanatçı · www sızıntısı: ${inventory.wwwDuplication.clicks} tıklama`,
);
