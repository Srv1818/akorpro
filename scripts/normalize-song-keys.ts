/**
 * Tek seferlik: orijinal ton / ton modu / gam kimliği alanlarını yeni
 * sözleşmeye taşır. Kural lib/music/plan-song-key-fix.ts içinde.
 *
 * Varsayılan kuru çalıştırma: hiçbir şey yazmaz, değişecekleri listeler ve
 * scripts/out/normalize-song-keys.json dosyasına döker.
 *
 *   npx tsx --env-file=.env.local scripts/normalize-song-keys.ts
 *   npx tsx --env-file=.env.local scripts/normalize-song-keys.ts --apply
 *
 * Yazma Payload Local API ile yapılıyor: kancalar (slug, önbellek) ve alan
 * doğrulaması normal kayıttaki gibi çalışıyor.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { getPayload } from "payload";
import config from "../payload.config";
import { planSongKeyFix } from "../lib/music/plan-song-key-fix";
import type { KeyMode } from "../lib/types/content";

const apply = process.argv.includes("--apply");
const payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "songs",
  limit: 0,
  pagination: false,
  depth: 0,
  overrideAccess: true,
  sort: "artistSlug",
});

type Row = {
  id: string | number;
  path: string;
  before: { originalKey: string; keyMode: string | null; gamlarScaleId: string | null };
  changes: ReturnType<typeof planSongKeyFix>["changes"];
  warnings: string[];
};

const rows: Row[] = [];
for (const s of docs) {
  const before = {
    originalKey: String(s.originalKey ?? ""),
    keyMode: (s.keyMode as KeyMode | null | undefined) ?? null,
    gamlarScaleId: (s.gamlarScaleId as string | null | undefined) || null,
  };
  const { changes, warnings } = planSongKeyFix(before);
  if (Object.keys(changes).length || warnings.length) {
    rows.push({ id: s.id, path: `/akor/${s.artistSlug}/${s.slug}`, before, changes, warnings });
  }
}

const fmt = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
for (const r of rows) {
  const parts = (["originalKey", "keyMode", "gamlarScaleId"] as const)
    .filter((k) => k in r.changes)
    .map((k) => `${k}: ${fmt(r.before[k])} → ${fmt(r.changes[k])}`);
  console.log(`${r.path}\n    ${parts.join(" | ") || "(değişiklik yok)"}`);
  for (const w of r.warnings) console.log(`    ⚠ ${w}`);
}

const changed = rows.filter((r) => Object.keys(r.changes).length);
console.log(
  `\nToplam ${docs.length} şarkı · değişecek ${changed.length} · uyarı ${rows.filter((r) => r.warnings.length).length}`,
);

mkdirSync("scripts/out", { recursive: true });
writeFileSync("scripts/out/normalize-song-keys.json", JSON.stringify(rows, null, 2));
console.log("Rapor: scripts/out/normalize-song-keys.json");

if (!apply) {
  console.log("\nKuru çalıştırma. Yazmak için --apply ekle.");
  process.exit(0);
}

let failed = 0;
for (const r of changed) {
  try {
    await payload.update({ collection: "songs", id: r.id, data: r.changes, overrideAccess: true, depth: 0 });
  } catch (e) {
    failed++;
    console.error(`HATA ${r.path}:`, e instanceof Error ? e.message : e);
  }
}
console.log(`\nYazıldı: ${changed.length - failed} · hata: ${failed}`);
process.exit(failed ? 1 : 0);
