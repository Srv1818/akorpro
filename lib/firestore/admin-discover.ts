import { createItem, deleteItems, readItems } from "@directus/sdk";
import { directus } from "@/lib/directus/client";

/**
 * Keşfet "featured" bloğu yönetimi — Directus.
 *
 * Firestore'daki tek dokümanlık `songIds[]` dizisi yerine `discover_sections`
 * (key = "featured") + sıralı `discover_items` var. Dışa aktarılan imzalar
 * (string[] alıp string[] döndürme) korundu; sıra `position` alanına yazılıyor.
 */

const FEATURED_KEY = "featured";

export const DISCOVER_MAX_SONG_IDS = 24;

function normalizeSongIds(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    const t = id.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= DISCOVER_MAX_SONG_IDS) break;
  }
  return out;
}

/** "featured" bölümünü döndürür; yoksa oluşturur. */
async function featuredSectionId(): Promise<string> {
  const existing = await directus().request(
    readItems("discover_sections", {
      filter: { key: { _eq: FEATURED_KEY } },
      fields: ["id"] as const,
      limit: 1,
    }),
  );
  if (existing[0]) return existing[0].id;

  const created = await directus().request(
    createItem("discover_sections", { key: FEATURED_KEY, title: "Öne çıkanlar" } as never),
  );
  return created.id;
}

export async function getFeaturedSongIdsAdmin(): Promise<string[]> {
  const items = await directus().request(
    readItems("discover_items", {
      filter: { section: { key: { _eq: FEATURED_KEY } } },
      sort: ["position"],
      limit: DISCOVER_MAX_SONG_IDS,
      fields: ["song"] as const,
    }),
  );

  return items
    .map((i) => (typeof i.song === "string" ? i.song : i.song?.id))
    .filter((id): id is string => typeof id === "string" && id.trim() !== "");
}

export async function setFeaturedSongIds(
  songIds: string[],
  _actorUid: string,
): Promise<string[]> {
  const normalized = normalizeSongIds(songIds);
  const sectionId = await featuredSectionId();

  // Sıra tamamen yeniden yazılır: mevcut kayıtlar silinip verilen sırayla eklenir.
  const existing = await directus().request(
    readItems("discover_items", {
      filter: { section: { _eq: sectionId } },
      fields: ["id"] as const,
      limit: -1,
    }),
  );
  if (existing.length > 0) {
    await directus().request(
      deleteItems("discover_items", existing.map((i) => i.id)),
    );
  }

  for (const [position, song] of normalized.entries()) {
    await directus().request(
      createItem("discover_items", { section: sectionId, song, position } as never),
    );
  }

  return normalized;
}
