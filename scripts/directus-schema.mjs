#!/usr/bin/env node
/**
 * Faz 1 — Directus şema bootstrap'i.
 *
 * MIGRATION-PLAN.md "Faz 1 — Veri Modeli" bölümündeki koleksiyonları Directus'ta
 * oluşturur. Idempotent: var olan koleksiyon/alan/ilişki atlanır, tekrar çalıştırmak
 * güvenlidir. Şema değişikliği gerektiğinde bu dosya güncellenir ve yeniden koşulur —
 * kurulum admin UI'da elle tıklanarak değil, burada versiyonlanır.
 *
 * Kullanım:
 *   DIRECTUS_URL=https://admin.akorpro.com DIRECTUS_TOKEN=<admin-static-token> \
 *     node scripts/directus-schema.mjs
 *
 * Token: Directus admin → Kullanıcılar → (admin kullanıcı) → Token. Repoya yazılmaz.
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
    err.status = res.status;
    err.code = json?.errors?.[0]?.extensions?.code;
    throw err;
  }
  return json?.data ?? null;
}

/**
 * Zaten var olan kayıtları hata saymadan geçer.
 * Directus üç ayrı biçimde bildiriyor: koleksiyon/alan için "already exists",
 * ilişki için "already has an associated relationship" (RECORD_NOT_UNIQUE değil).
 */
function isAlreadyExists(err) {
  return err.code === "RECORD_NOT_UNIQUE" || /already/i.test(err.message ?? "");
}

/* ------------------------------------------------------------------ */
/*  Alan yardımcıları                                                  */
/* ------------------------------------------------------------------ */

const pk = () => ({
  field: "id",
  type: "uuid",
  meta: { hidden: true, readonly: true, interface: "input", special: ["uuid"] },
  schema: { is_primary_key: true, length: 36, has_auto_increment: false },
});

const str = (field, opts = {}) => ({
  field,
  type: "string",
  meta: {
    interface: "input",
    required: opts.required ?? false,
    note: opts.note ?? null,
    options: opts.slug ? { slug: true, trim: true } : { trim: true },
  },
  schema: {
    is_nullable: !(opts.required ?? false),
    is_unique: opts.unique ?? false,
    max_length: opts.length ?? 255,
  },
});

const longtext = (field, opts = {}) => ({
  field,
  type: "text",
  meta: {
    interface: opts.html ? "input-rich-text-html" : "input-multiline",
    required: opts.required ?? false,
    note: opts.note ?? null,
  },
  schema: { is_nullable: !(opts.required ?? false) },
});

const int = (field, opts = {}) => ({
  field,
  type: "integer",
  meta: { interface: "input", required: opts.required ?? false, note: opts.note ?? null },
  schema: { is_nullable: !(opts.required ?? false), default_value: opts.default ?? null },
});

const bool = (field, opts = {}) => ({
  field,
  type: "boolean",
  meta: { interface: "boolean", note: opts.note ?? null },
  schema: { is_nullable: false, default_value: opts.default ?? false },
});

const enumf = (field, choices, opts = {}) => ({
  field,
  type: "string",
  meta: {
    interface: "select-dropdown",
    required: opts.required ?? false,
    note: opts.note ?? null,
    options: { choices: choices.map((c) => ({ text: c, value: c })) },
  },
  schema: {
    is_nullable: !(opts.required ?? false),
    default_value: opts.default ?? null,
    max_length: 32,
  },
});

const json = (field, opts = {}) => ({
  field,
  type: "json",
  meta: { interface: "input-code", note: opts.note ?? null, options: { language: "json" } },
  schema: { is_nullable: true },
});

/** M2O ilişki alanı — ilişkinin kendisi ensureRelation ile kurulur. */
const m2o = (field, opts = {}) => ({
  field,
  type: "uuid",
  meta: {
    interface: "select-dropdown-m2o",
    required: opts.required ?? false,
    note: opts.note ?? null,
    options: { template: opts.template ?? "{{id}}" },
  },
  schema: { is_nullable: !(opts.required ?? false) },
});

const createdAt = () => ({
  field: "created_at",
  type: "timestamp",
  meta: { interface: "datetime", readonly: true, hidden: true, special: ["date-created"] },
  schema: {},
});

const updatedAt = () => ({
  field: "updated_at",
  type: "timestamp",
  meta: { interface: "datetime", readonly: true, hidden: true, special: ["date-updated"] },
  schema: {},
});

/* ------------------------------------------------------------------ */
/*  Şema tanımı                                                        */
/* ------------------------------------------------------------------ */

const DIFFICULTIES = ["kolay", "orta", "zor"];
const KEY_MODES = ["major", "natural", "harmonic", "melodic"];
const MODERATION = ["draft", "pending", "approved", "rejected"];
const CONTRIBUTION_STATUS = ["pending", "approved", "rejected"];
const CHORD_QUALITIES = [
  "maj", "min", "7", "m7", "maj7", "dim", "aug", "sus2", "sus4", "add9", "9", "m9",
];

const collections = [
  {
    collection: "artists",
    meta: { icon: "person", note: "Sanatçılar", sort_field: "name", display_template: "{{name}}" },
    fields: [
      pk(),
      str("name", { required: true }),
      str("slug", { required: true, unique: true, slug: true }),
      str("image_url", { length: 512 }),
      str("genre", { length: 64 }),
      int("popularity", { note: "Keşfet sıralaması için skor" }),
      createdAt(),
      updatedAt(),
    ],
    // song_count planda atıldı: approved şarkı sayısından türetilir.
  },
  {
    collection: "songs",
    meta: { icon: "music_note", note: "Şarkılar", display_template: "{{title}} — {{artist_name}}" },
    fields: [
      pk(),
      str("title", { required: true }),
      str("slug", { required: true, slug: true }),
      m2o("artist", { required: true, template: "{{name}}" }),
      str("artist_slug", { required: true, note: "Denormalize — public sorgular birebir kullanıyor" }),
      str("artist_name", { required: true, note: "Denormalize — mevcut kodla uyum" }),
      longtext("chord_body", { required: true, html: true, note: "Sanitize edilmiş sunucu HTML" }),
      str("original_key", { required: true, length: 16 }),
      enumf("difficulty", DIFFICULTIES, { required: true }),
      enumf("key_mode", KEY_MODES, { note: "Minör varyantları / majör" }),
      str("gamlar_scale_id", { length: 64, note: "Gamlar kataloğu ölçek kimliği; key_mode ile uyumlu" }),
      str("genre", { required: true, length: 64 }),
      str("tempo", { length: 32, note: "BPM veya metin (Andante vb.)" }),
      str("time_signature", { length: 16 }),
      str("tuning", { length: 32 }),
      int("capo", { note: "0 = kapo yok" }),
      enumf("moderation_status", MODERATION, { required: true, default: "draft" }),
      str("copyright_source", { length: 512, note: "Telif/kaynak notu" }),
      int("popularity"),
      bool("show_harmony_details", { default: true }),
      longtext("harmony_details_notes"),
      createdAt(),
      updatedAt(),
    ],
    // cover_image_url planda atıldı: per-şarkı foto yok, OG görseli dinamik üretiliyor.
  },
  {
    collection: "song_contributors",
    meta: { icon: "link", note: "Şarkı ↔ katkıcı junction (Firestore contributorIds[] yerine)", hidden: false },
    fields: [
      pk(),
      m2o("song", { required: true, template: "{{title}}" }),
      m2o("user", { required: true, template: "{{email}}" }),
      createdAt(),
    ],
  },
  {
    collection: "contributions",
    meta: { icon: "inbox", note: "Kullanıcı katkıları — moderasyon kuyruğu", display_template: "{{song_title}} — {{artist_name}}" },
    fields: [
      pk(),
      str("song_title", { required: true }),
      str("artist_name", { required: true }),
      longtext("chord_body", { required: true, html: true }),
      str("original_key", { required: true, length: 16 }),
      enumf("key_mode", KEY_MODES),
      str("genre", { required: true, length: 64 }),
      enumf("difficulty", DIFFICULTIES, { required: true }),
      str("tempo", { length: 32 }),
      str("time_signature", { length: 16 }),
      str("tuning", { length: 32 }),
      int("capo"),
      str("copyright_source", { length: 512 }),
      m2o("contributor", { required: true, template: "{{email}}" }),
      str("contributor_display_name", { required: true }),
      enumf("status", CONTRIBUTION_STATUS, { required: true, default: "pending" }),
      m2o("moderator", { template: "{{email}}" }),
      longtext("moderator_note"),
      m2o("approved_song", { template: "{{title}}" }),
      createdAt(),
      updatedAt(),
    ],
  },
  {
    collection: "contributor_profiles",
    meta: { icon: "badge", note: "Katkıcı profilleri", display_template: "{{display_name}}" },
    fields: [
      pk(),
      m2o("user", { required: true, template: "{{email}}" }),
      str("display_name", { required: true }),
      longtext("bio"),
      str("avatar_url", { length: 512 }),
      bool("verified", { note: "Moderatör onaylı rozet" }),
      createdAt(),
      updatedAt(),
    ],
    // approved_count planda atıldı: approved katkı sayısından türetilir.
  },
  {
    collection: "chord_library",
    meta: { icon: "queue_music", note: "Akor kütüphanesi", display_template: "{{name}}" },
    fields: [
      pk(),
      str("name", { required: true, length: 32 }),
      str("root", { required: true, length: 8 }),
      enumf("quality", CHORD_QUALITIES, { required: true }),
      str("fingering", { required: true, length: 32, note: "Örn. x32010" }),
      str("fingers", { length: 32, note: "Tel başına parmak numarası (6→1), 0 = gösterilmez" }),
      int("barre_fret", { note: "Barre perdesi — diyagramın doğru çizilmesi için" }),
      int("sort_order", { note: "Aynı root+quality grubunda görüntüleme sırası" }),
      createdAt(),
      updatedAt(),
    ],
    // frets / barre_start / barre_end planda atıldı: diyagram fingering'den türetiyor.
  },
  {
    collection: "scales",
    meta: { icon: "straighten", note: "Gamlar kataloğu", display_template: "{{name}}" },
    fields: [
      pk(),
      str("key", { required: true, unique: true, length: 64, note: "Kod tarafındaki ScaleDoc.id" }),
      str("name", { required: true }),
      json("notes_c", { note: "Ton C varsayılanında nota isimleri — string[]" }),
      str("category", { length: 64, note: "Diyatonik / Pentatonik / Modus" }),
      longtext("description"),
      int("sort_order"),
    ],
  },
  {
    collection: "discover_sections",
    meta: { icon: "explore", note: "Keşfet blokları", display_template: "{{key}}" },
    fields: [
      pk(),
      str("key", { required: true, unique: true, length: 32, note: "popular | new | featured" }),
      str("title", { length: 128 }),
      int("sort_order"),
      updatedAt(),
    ],
  },
  {
    collection: "discover_items",
    meta: { icon: "list", note: "Keşfet bloğu içindeki sıralı şarkılar" },
    fields: [
      pk(),
      m2o("section", { required: true, template: "{{key}}" }),
      m2o("song", { required: true, template: "{{title}}" }),
      int("position", { required: true }),
    ],
  },
  {
    collection: "playlists",
    meta: { icon: "playlist_play", note: "Kullanıcı çalma listeleri", display_template: "{{name}}" },
    fields: [
      pk(),
      m2o("owner", { required: true, template: "{{email}}" }),
      str("name", { required: true }),
      createdAt(),
      updatedAt(),
    ],
  },
  {
    collection: "playlist_items",
    meta: { icon: "queue", note: "Çalma listesi kayıtları" },
    fields: [
      pk(),
      m2o("playlist", { required: true, template: "{{name}}" }),
      m2o("song", { required: true, template: "{{title}}" }),
      int("position", { required: true }),
      int("transpose_semitones", { note: "İsteğe bağlı anlık transpoze (snapshot)" }),
      createdAt(),
    ],
  },
];

/** M2O ilişkileri — alanlar oluşturulduktan sonra bağlanır. */
const relations = [
  { collection: "songs", field: "artist", related: "artists", onDelete: "RESTRICT" },
  { collection: "song_contributors", field: "song", related: "songs", onDelete: "CASCADE" },
  { collection: "song_contributors", field: "user", related: "directus_users", onDelete: "CASCADE" },
  { collection: "contributions", field: "contributor", related: "directus_users", onDelete: "SET NULL" },
  { collection: "contributions", field: "moderator", related: "directus_users", onDelete: "SET NULL" },
  { collection: "contributions", field: "approved_song", related: "songs", onDelete: "SET NULL" },
  { collection: "contributor_profiles", field: "user", related: "directus_users", onDelete: "CASCADE" },
  { collection: "discover_items", field: "section", related: "discover_sections", onDelete: "CASCADE" },
  { collection: "discover_items", field: "song", related: "songs", onDelete: "CASCADE" },
  { collection: "playlists", field: "owner", related: "directus_users", onDelete: "CASCADE" },
  { collection: "playlist_items", field: "playlist", related: "playlists", onDelete: "CASCADE" },
  { collection: "playlist_items", field: "song", related: "songs", onDelete: "CASCADE" },
];

/* ------------------------------------------------------------------ */
/*  Uygulama                                                           */
/* ------------------------------------------------------------------ */

async function ensureCollection(def) {
  try {
    // Koleksiyonu yalnız PK ile oluştur; kalan alanlar ensureField ile eklenir
    // (böylece var olan koleksiyona sonradan alan eklemek de aynı yoldan çalışır).
    await api("/collections", "POST", {
      collection: def.collection,
      meta: def.meta,
      schema: {},
      fields: [pk()],
    });
    console.log(`+ koleksiyon  ${def.collection}`);
    created++;
  } catch (err) {
    if (!isAlreadyExists(err)) throw err;
    console.log(`. koleksiyon  ${def.collection} (var)`);
    skipped++;
  }

  for (const field of def.fields) {
    if (field.field === "id") continue;
    await ensureField(def.collection, field);
  }
}

async function ensureField(collection, field) {
  try {
    await api(`/fields/${collection}`, "POST", field);
    console.log(`+   alan      ${collection}.${field.field}`);
    created++;
  } catch (err) {
    if (!isAlreadyExists(err)) throw err;
    skipped++;
  }
}

async function ensureRelation(rel) {
  try {
    await api("/relations", "POST", {
      collection: rel.collection,
      field: rel.field,
      related_collection: rel.related,
      meta: { sort_field: null },
      schema: { on_delete: rel.onDelete },
    });
    console.log(`+ ilişki      ${rel.collection}.${rel.field} → ${rel.related}`);
    created++;
  } catch (err) {
    if (!isAlreadyExists(err)) throw err;
    skipped++;
  }
}

async function main() {
  const me = await api("/users/me?fields=email,role.name");
  console.log(`Directus: ${BASE} (${me.email})\n`);

  for (const def of collections) await ensureCollection(def);
  console.log("");
  for (const rel of relations) await ensureRelation(rel);

  console.log(`\nBitti — ${created} oluşturuldu, ${skipped} zaten vardı.`);
}

main().catch((err) => {
  console.error(`\nHata: ${err.message}`);
  process.exit(1);
});
