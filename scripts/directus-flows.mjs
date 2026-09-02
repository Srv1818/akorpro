#!/usr/bin/env node
/**
 * Directus Flow'ları — otomatik slug üretimi ve denormalize alan doldurma.
 *
 * Neden gerekli: `slug`, `artist_slug` ve `artist_name` elle yazılıyordu.
 * İlk içerik denemesinde slug alanına tam URL yapıştırıldı ve sayfa
 * `/sanatci/https-akorpro-com-tr-sanatci-eypio` adresinde oluştu. Bu alanlar
 * türetilebilir olduğu için elle girilmemeli.
 *
 * Kurulan iki flow (ikisi de `filter` tetikleyici — kayıt yazılmadan önce çalışır):
 *   artists  → `name`den `slug`
 *   songs    → `title`dan `slug`, seçilen sanatçıdan `artist_slug` + `artist_name`
 *
 * Idempotent: aynı adla flow varsa atlanır. Değiştirmek için Directus'tan silip
 * yeniden çalıştır.
 *
 * Kullanım:
 *   DIRECTUS_URL=https://admin.akorpro.com DIRECTUS_TOKEN=<admin-token> \
 *     node scripts/directus-flows.mjs
 *
 * Not: admin token gerekir — flow yönetimi Publisher rolüne kapalı.
 */

const BASE = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN ?? "";

if (!BASE || !TOKEN) {
  console.error("DIRECTUS_URL ve DIRECTUS_TOKEN gerekli.");
  process.exit(1);
}

async function api(path, method = "GET", body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message ?? `${res.status} ${res.statusText}`);
  }
  return json?.data ?? null;
}

/* ------------------------------------------------------------------ */
/*  Flow içinde çalışacak kod                                          */
/* ------------------------------------------------------------------ */

/**
 * Türkçe karakterler önce elle eşlenir: JS'in `toLowerCase()`'i "İ" için
 * birleşik noktalı bir karakter üretiyor ve "ı" ASCII'ye düşmüyor.
 */
const SLUGIFY = `
function slugify(value) {
  if (value == null) return "";
  var map = { "ı":"i","İ":"i","ş":"s","Ş":"s","ğ":"g","Ğ":"g","ü":"u","Ü":"u","ö":"o","Ö":"o","ç":"c","Ç":"c" };
  return String(value)
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, function (m) { return map[m]; })
    .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
`;

const ARTIST_CODE = `${SLUGIFY}
module.exports = async function (data) {
  var payload = data.$trigger.payload || {};
  var isCreate = data.$trigger.event === "artists.items.create";

  // Oluştururken slug her zaman isimden türetilir — alana ne yazılmış olursa olsun.
  // (İlk denemede slug alanına tam URL yapıştırılmıştı; bu kural onu imkânsız kılıyor.)
  // Güncellemede yalnız slug boşsa türetilir, böylece elle verilmiş özel slug korunur.
  if (isCreate) {
    if (payload.name) payload.slug = slugify(payload.name);
  } else if (!payload.slug || !String(payload.slug).trim()) {
    if (payload.name) payload.slug = slugify(payload.name);
  } else {
    payload.slug = slugify(payload.slug);
  }

  return payload;
};`;

const SONG_CODE = `${SLUGIFY}
module.exports = async function (data) {
  var payload = data.$trigger.payload || {};

  var isCreate = data.$trigger.event === "songs.items.create";

  // Kural artists ile aynı: oluştururken başlıktan türet, güncellemede
  // elle verilmiş slug'a dokunma.
  if (isCreate) {
    if (payload.title) payload.slug = slugify(payload.title);
  } else if (!payload.slug || !String(payload.slug).trim()) {
    if (payload.title) payload.slug = slugify(payload.title);
  } else {
    payload.slug = slugify(payload.slug);
  }

  // Sanatçı okunabildiyse denormalize alanları oradan doldur — elle yazılmasın.
  var artist = data.read_artist;
  if (Array.isArray(artist)) artist = artist[0];
  if (artist && artist.slug) {
    payload.artist_slug = artist.slug;
    payload.artist_name = artist.name;
  }

  return payload;
};`;

/* ------------------------------------------------------------------ */
/*  Kurulum                                                            */
/* ------------------------------------------------------------------ */

async function flowExists(name) {
  const rows = await api(`/flows?filter[name][_eq]=${encodeURIComponent(name)}&fields=id`);
  return rows?.[0]?.id ?? null;
}

async function createFlow({ name, icon, collection, operations }) {
  const existing = await flowExists(name);
  if (existing) {
    console.log(`. flow  ${name} (var)`);
    return;
  }

  const flow = await api("/flows", "POST", {
    name,
    icon,
    status: "active",
    // `all`: alan yazma izni kullanıcıya değil flow'a ait olsun; Contributor
    // rolündeki biri katkı gönderdiğinde de slug üretilebilmeli.
    accountability: "all",
    trigger: "event",
    options: {
      type: "filter",
      scope: ["items.create", "items.update"],
      collections: [collection],
    },
  });

  // Operasyonlar sırayla oluşturulur; her biri bir öncekinin resolve/reject hedefi olur.
  const created = [];
  for (const op of operations) {
    const row = await api("/operations", "POST", { ...op, flow: flow.id });
    created.push(row);
  }

  for (let i = 0; i < created.length - 1; i++) {
    // reject de aynı yere bağlanıyor: sanatçı okunamazsa (ör. sadece başlık
    // güncellenen bir kayıt) akış durmamalı, slug yine de üretilmeli.
    await api(`/operations/${created[i].id}`, "PATCH", {
      resolve: created[i + 1].id,
      reject: created[i + 1].id,
    });
  }

  await api(`/flows/${flow.id}`, "PATCH", { operation: created[0].id });
  console.log(`+ flow  ${name}  (${created.length} operasyon)`);
}

async function main() {
  console.log(`Directus: ${BASE}\n`);

  await createFlow({
    name: "artists: otomatik slug",
    icon: "link",
    collection: "artists",
    operations: [
      {
        name: "Slug üret",
        key: "slugify_artist",
        type: "exec",
        position_x: 19,
        position_y: 1,
        options: { code: ARTIST_CODE },
      },
    ],
  });

  await createFlow({
    name: "songs: otomatik slug + sanatçı alanları",
    icon: "link",
    collection: "songs",
    operations: [
      {
        name: "Sanatçıyı oku",
        key: "read_artist",
        type: "item-read",
        position_x: 19,
        position_y: 1,
        options: {
          collection: "artists",
          key: ["{{$trigger.payload.artist}}"],
          permissions: "$full",
        },
      },
      {
        name: "Slug üret ve alanları doldur",
        key: "slugify_song",
        type: "exec",
        position_x: 37,
        position_y: 1,
        options: { code: SONG_CODE },
      },
    ],
  });

  // Otomatik dolan alanlar formda zorunlu görünmemeli — kullanıcı yalnız
  // Title/Name girip sanatçıyı seçebilsin. Veritabanı NOT NULL kısıtı duruyor;
  // değeri flow yazdığı için ihlal olmuyor.
  console.log("");
  for (const [collection, field] of [
    ["artists", "slug"],
    ["songs", "slug"],
    ["songs", "artist_slug"],
    ["songs", "artist_name"],
  ]) {
    await api(`/fields/${collection}/${field}`, "PATCH", {
      meta: { required: false, note: "Otomatik üretiliyor — elle doldurmaya gerek yok." },
    });
    console.log(`~ alan  ${collection}.${field} zorunlu değil`);
  }

  console.log("\nBitti. Directus'ta Settings → Flows altından görülebilir.");
}

main().catch((err) => {
  console.error(`\nHata: ${err.message}`);
  process.exit(1);
});
