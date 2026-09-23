/**
 * Payload yerel doğrulama: şema, hook'lar ve erişim kuralları gerçekten
 * çalışıyor mu? Local API üzerinden yazar, sonra okuyup doğrular.
 *
 * Çalıştırma:
 *   node --env-file=.env.local scripts/payload-smoke.mjs
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";

const payload = await getPayload({ config });

let failed = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : "  HATA"} ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (beklenen ${JSON.stringify(expected)})`}`);
}

// Temiz başlangıç
for (const c of ["playlist-items", "playlists", "songs", "artists", "users"]) {
  await payload.delete({ collection: c, where: { id: { exists: true } } });
}

console.log("\n[1] Kullanıcı oluşturma ve rol");
const admin = await payload.create({
  collection: "users",
  data: { email: "admin@akorpro.com", password: "Gecici-Parola-1234", role: "admin", displayName: "Yönetici" },
});
check("rol", admin.role, "admin");

console.log("\n[2] Sanatçı slug hook'u (Türkçe)");
const artist = await payload.create({
  collection: "artists",
  // Slug alanına bilerek tam URL yazıyoruz: ilk içerik denemesinde yaşanan hata.
  data: { name: "Eypio", slug: "https://akorpro.com/sanatci/eypio", genre: "Rap" },
});
check("slug URL'den değil addan üretildi", artist.slug, "eypio");

const tr = await payload.create({ collection: "artists", data: { name: "Müzeyyen Şenar" } });
check("Türkçe slug", tr.slug, "muzeyyen-senar");

console.log("\n[3] Şarkı slug + denormalize alanlar");
const song = await payload.create({
  collection: "songs",
  data: {
    title: "Ömrüm", artist: artist.id, chordBody: "<p>Am F C G</p>",
    originalKey: "Am", difficulty: "orta", genre: "Rap",
    keyMode: "natural", moderationStatus: "approved",
  },
});
check("şarkı slug", song.slug, "omrum");
check("artistSlug otomatik doldu", song.artistSlug, "eypio");
check("artistName otomatik doldu", song.artistName, "Eypio");

console.log("\n[4] Sanatçı adı değişince şarkıya yayılım");
await payload.update({ collection: "artists", id: artist.id, data: { name: "EypiO" } });
const after = await payload.findByID({ collection: "songs", id: song.id, depth: 0 });
check("artistName güncellendi", after.artistName, "EypiO");
check("artistSlug güncellendi", after.artistSlug, "eypio");

console.log("\n[5] Anonim okuma yalnız onaylı şarkıyı görür");
await payload.create({
  collection: "songs",
  data: {
    title: "Taslak Şarkı", artist: artist.id, chordBody: "<p>C</p>",
    originalKey: "C", difficulty: "kolay", genre: "Pop", moderationStatus: "draft",
  },
});
const anon = await payload.find({ collection: "songs", overrideAccess: false, user: null, depth: 0 });
check("anonim gördüğü şarkı sayısı", anon.docs.length, 1);
check("gördüğü şarkı", anon.docs[0]?.title, "Ömrüm");

const asAdmin = await payload.find({ collection: "songs", overrideAccess: false, user: admin, depth: 0 });
check("yönetici gördüğü şarkı sayısı", asAdmin.totalDocs, 2);

console.log("\n[6] Katkıcı panele giremez");
const contributor = await payload.create({
  collection: "users",
  data: { email: "katkici@akorpro.com", password: "Gecici-Parola-1234", role: "contributor" },
});
const { canAccessAdminPanel } = await import("../payload/access.ts");
check("katkıcı panel erişimi", canAccessAdminPanel(contributor), false);
check("yönetici panel erişimi", canAccessAdminPanel(admin), true);

console.log("\n[7] Çalma listesi sahipliği — başkasınınkine erişilemez");
for (const c of ["playlist-items", "playlists"]) {
  await payload.delete({ collection: c, where: { id: { exists: true } } });
}
const userA = await payload.create({
  collection: "users",
  data: { email: "a@akorpro.com", password: "Gecici-Parola-1234", role: "contributor" },
});
const userB = await payload.create({
  collection: "users",
  data: { email: "b@akorpro.com", password: "Gecici-Parola-1234", role: "contributor" },
});

const listA = await payload.create({
  collection: "playlists",
  data: { name: "A'nın listesi", owner: userA.id },
  user: userA,
  overrideAccess: false,
});

const seenByB = await payload.find({
  collection: "playlists", user: userB, overrideAccess: false, depth: 0,
});
check("B, A'nın listesini göremez", seenByB.totalDocs, 0);

const itemA = await payload.create({
  collection: "playlist-items",
  data: { playlist: listA.id, song: song.id, position: 0 },
  user: userA,
  overrideAccess: false,
});

// Asıl kontrol: öğe erişimi "giriş yapmış olmak"a bağlı olsaydı bu geçerdi.
let bCouldDelete = true;
try {
  await payload.delete({
    collection: "playlist-items", id: itemA.id, user: userB, overrideAccess: false,
  });
} catch {
  bCouldDelete = false;
}
check("B, A'nın liste öğesini silemez", bCouldDelete, false);

const stillThere = await payload.find({
  collection: "playlist-items", user: userA, overrideAccess: false, depth: 0,
});
check("A'nın öğesi duruyor", stillThere.totalDocs, 1);

console.log(failed === 0 ? "\n>>> HEPSI GECTI\n" : `\n>>> ${failed} KONTROL BASARISIZ\n`);
process.exit(failed === 0 ? 0 : 1);
