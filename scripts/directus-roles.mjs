#!/usr/bin/env node
/**
 * Faz 2 — Directus rolleri, politikaları ve izinleri.
 *
 * `firestore.rules` + Firebase custom claims + AKORPRO_PUBLISHER_UIDS'in Directus
 * karşılığı. Idempotent: var olan rol/politika/izin atlanır.
 *
 * Directus 11 modeli: Rol → (access junction) → Politika → İzinler.
 * Anonim ziyaretçi için hazır gelen "public" politikası kullanılır.
 *
 * Kullanım:
 *   DIRECTUS_URL=https://admin.akorpro.com DIRECTUS_TOKEN=<admin-token> \
 *     node scripts/directus-roles.mjs
 */

const BASE = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN ?? "";

if (!BASE || !TOKEN) {
  console.error("DIRECTUS_URL ve DIRECTUS_TOKEN gerekli.");
  process.exit(1);
}

let created = 0;
let skipped = 0;

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
    const err = new Error(json?.errors?.[0]?.message ?? `${res.status} ${res.statusText}`);
    err.code = json?.errors?.[0]?.extensions?.code;
    throw err;
  }
  return json?.data ?? null;
}

/* ------------------------------------------------------------------ */
/*  Okunabilir izin kısayolları                                        */
/* ------------------------------------------------------------------ */

const ME = "$CURRENT_USER";
const APPROVED = { moderation_status: { _eq: "approved" } };
const MINE = (field) => ({ [field]: { _eq: ME } });

/** Herkese açık okuma — anonim ve giriş yapmış kullanıcı aynı listeyi görür. */
const PUBLIC_READS = [
  { collection: "songs", action: "read", permissions: APPROVED },
  { collection: "artists", action: "read" },
  { collection: "chord_library", action: "read" },
  { collection: "scales", action: "read" },
  { collection: "discover_sections", action: "read" },
  { collection: "discover_items", action: "read" },
  { collection: "contributor_profiles", action: "read" },
  { collection: "song_contributors", action: "read" },
];

/** Moderatör/yayıncının tam yetkili olduğu içerik koleksiyonları. */
const CONTENT_COLLECTIONS = [
  "songs",
  "artists",
  "song_contributors",
  "contributions",
  "contributor_profiles",
  "chord_library",
  "scales",
  "discover_sections",
  "discover_items",
];

const crud = (collection, extra = {}) =>
  ["create", "read", "update", "delete"].map((action) => ({ collection, action, ...extra }));

/* ------------------------------------------------------------------ */
/*  Rol tanımları                                                      */
/* ------------------------------------------------------------------ */

const roles = [
  {
    name: "Contributor",
    icon: "person_add",
    description: "Giriş yapmış kullanıcı — kendi katkısı, profili ve çalma listeleri.",
    // Directus admin arayüzüne giremez; siteyi kullanır.
    appAccess: false,
    permissions: [
      ...PUBLIC_READS,

      // Katkı gönderme: contributor ve status sunucuda zorlanır, istemciden gelmez.
      {
        collection: "contributions",
        action: "create",
        presets: { contributor: ME, status: "pending" },
        fields: [
          "song_title", "artist_name", "chord_body", "original_key", "key_mode",
          "genre", "difficulty", "tempo", "time_signature", "tuning", "capo",
          "copyright_source", "contributor_display_name",
        ],
      },
      { collection: "contributions", action: "read", permissions: MINE("contributor") },
      {
        collection: "contributions",
        action: "update",
        // Sadece kendi katkısı ve yalnız moderasyona girmeden önce.
        permissions: { _and: [MINE("contributor"), { status: { _eq: "pending" } }] },
        fields: [
          "song_title", "artist_name", "chord_body", "original_key", "key_mode",
          "genre", "difficulty", "tempo", "time_signature", "tuning", "capo",
          "copyright_source",
        ],
      },

      // Kendi katkıcı profili
      { collection: "contributor_profiles", action: "create", presets: { user: ME } },
      {
        collection: "contributor_profiles",
        action: "update",
        permissions: MINE("user"),
        // verified alanı moderatöre ait — kullanıcı kendine rozet veremez.
        fields: ["display_name", "bio", "avatar_url"],
      },

      // Çalma listeleri
      { collection: "playlists", action: "create", presets: { owner: ME } },
      { collection: "playlists", action: "read", permissions: MINE("owner") },
      { collection: "playlists", action: "update", permissions: MINE("owner"), fields: ["name"] },
      { collection: "playlists", action: "delete", permissions: MINE("owner") },
      ...crud("playlist_items", { permissions: { playlist: { owner: { _eq: ME } } } }),
    ],
  },
  {
    name: "Moderator",
    icon: "shield_person",
    description: "İçerik yönetimi ve moderasyon. Onaylı yayına alma yetkisi yoktur.",
    appAccess: true,
    permissions: [
      ...CONTENT_COLLECTIONS.flatMap((c) => crud(c)),
      // Yayına alma yetkisi Publisher'da: moderatör moderation_status'ü approved yapamaz.
      // crud() ile eklenen songs.update kaydının üzerine bu validation yazılır.
      {
        collection: "songs",
        action: "update",
        validation: { moderation_status: { _neq: "approved" } },
        overwrite: true,
      },
    ],
  },
  {
    name: "Publisher",
    icon: "publish",
    description: "Moderatör yetkileri + onaylı içeriği yayına alma ve yayında düzenleme.",
    appAccess: true,
    permissions: CONTENT_COLLECTIONS.flatMap((c) => crud(c)),
  },
];

/* ------------------------------------------------------------------ */
/*  Uygulama                                                           */
/* ------------------------------------------------------------------ */

async function ensureRole(def) {
  const existing = await api(`/roles?filter[name][_eq]=${encodeURIComponent(def.name)}&fields=id`);
  if (existing?.length) {
    console.log(`. rol         ${def.name} (var)`);
    skipped++;
    return existing[0].id;
  }
  const role = await api("/roles", "POST", {
    name: def.name,
    icon: def.icon,
    description: def.description,
  });
  console.log(`+ rol         ${def.name}`);
  created++;
  return role.id;
}

async function ensurePolicy(def) {
  const existing = await api(`/policies?filter[name][_eq]=${encodeURIComponent(def.name)}&fields=id`);
  if (existing?.length) {
    skipped++;
    return existing[0].id;
  }
  const policy = await api("/policies", "POST", {
    name: def.name,
    icon: def.icon,
    description: def.description,
    admin_access: false,
    app_access: def.appAccess,
  });
  console.log(`+ politika    ${def.name} (app_access: ${def.appAccess})`);
  created++;
  return policy.id;
}

async function ensureAccess(roleId, policyId) {
  const existing = await api(
    `/access?filter[role][_eq]=${roleId}&filter[policy][_eq]=${policyId}&fields=id`,
  );
  if (existing?.length) {
    skipped++;
    return;
  }
  await api("/access", "POST", { role: roleId, policy: policyId, user: null });
  created++;
}

async function ensurePermission(policyId, p) {
  const existing = await api(
    `/permissions?filter[policy][_eq]=${policyId}` +
      `&filter[collection][_eq]=${p.collection}` +
      `&filter[action][_eq]=${p.action}&fields=id`,
  );

  const payload = {
    policy: policyId,
    collection: p.collection,
    action: p.action,
    permissions: p.permissions ?? {},
    validation: p.validation ?? {},
    presets: p.presets ?? null,
    fields: p.fields ?? ["*"],
  };

  if (existing?.length) {
    if (!p.overwrite) {
      skipped++;
      return;
    }
    await api(`/permissions/${existing[0].id}`, "PATCH", payload);
    console.log(`~   izin      ${p.collection}.${p.action} (güncellendi)`);
    created++;
    return;
  }

  await api("/permissions", "POST", payload);
  console.log(`+   izin      ${p.collection}.${p.action}`);
  created++;
}

/** Anonim ziyaretçi politikası Directus ile hazır gelir; id'sini bulup izin yazarız. */
async function publicPolicyId() {
  const all = await api("/policies?limit=-1&fields=id,name,admin_access,app_access");
  const found = all.find((p) => /public/i.test(p.name) && !p.admin_access && !p.app_access);
  if (!found) throw new Error("Public politikası bulunamadı.");
  return found.id;
}

async function main() {
  console.log(`Directus: ${BASE}\n`);

  const pub = await publicPolicyId();
  console.log("Public politikası — anonim okuma izinleri");
  for (const p of PUBLIC_READS) await ensurePermission(pub, p);

  for (const def of roles) {
    console.log(`\n${def.name}`);
    const roleId = await ensureRole(def);
    const policyId = await ensurePolicy(def);
    await ensureAccess(roleId, policyId);
    for (const p of def.permissions) await ensurePermission(policyId, p);
  }

  console.log(`\nBitti — ${created} oluşturuldu/güncellendi, ${skipped} zaten vardı.`);
  console.log(
    "\nNot: Google SSO açıldığında yeni kayıtların Contributor rolüne düşmesi için\n" +
      "AUTH_GOOGLE_DEFAULT_ROLE_ID env'ine Contributor rolünün id'si yazılmalı.",
  );
}

main().catch((err) => {
  console.error(`\nHata: ${err.message}`);
  process.exit(1);
});
