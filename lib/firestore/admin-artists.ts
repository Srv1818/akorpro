import { aggregate, createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { directus } from "@/lib/directus/client";
import { toEpochMs } from "@/lib/directus/serialize";
import { approvedSongCounts } from "./artists";
import type { ArtistRow } from "@/lib/directus/schema";
import type { ArtistDoc } from "@/lib/types/firestore";

/**
 * Sanatçı yazma işlemleri — Directus.
 *
 * Denetim izi Directus'un yerleşik Activity Log'una devredildi; `actorUid`
 * parametreleri imza uyumu için duruyor (Faz 5'te admin route'ları ile birlikte silinecek).
 * `songCount` artık yazılabilir bir alan değil — onaylı şarkılardan türetiliyor,
 * bu yüzden `createArtist`/`updateArtist` girdisinde yok sayılır.
 */

type Artist = ArtistDoc & { id: string };
type ArtistInput = Omit<ArtistDoc, "schemaVersion" | "createdAt" | "updatedAt">;

function toRow(input: Partial<ArtistInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl;
  if (input.genre !== undefined) row.genre = input.genre;
  if (input.popularity !== undefined) row.popularity = input.popularity;
  // songCount bilerek atlanır — türetilen değer.
  return row;
}

function mapArtist(row: ArtistRow, songCount: number): Artist {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.genre ? { genre: row.genre } : {}),
    songCount,
    ...(row.popularity != null ? { popularity: row.popularity } : {}),
    createdAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

export async function createArtist(input: ArtistInput, _actorUid: string): Promise<string> {
  const row = await directus().request(createItem("artists", toRow(input) as never));
  return row.id;
}

export async function updateArtist(
  artistId: string,
  updates: Partial<ArtistInput>,
  _actorUid: string,
): Promise<void> {
  await directus().request(updateItem("artists", artistId, toRow(updates) as never));
}

export async function deleteArtist(artistId: string, _actorUid: string): Promise<void> {
  await directus().request(deleteItem("artists", artistId));
}

export async function getAllArtistsAdmin(): Promise<Artist[]> {
  const [rows, counts] = await Promise.all([
    directus().request(readItems("artists", { sort: ["name"], limit: -1 })),
    approvedSongCounts(),
  ]);

  return rows.map((row) => mapArtist(row, counts.get(row.slug) ?? 0));
}

export async function getAllArtistsCount(): Promise<number> {
  const rows = (await directus().request(
    aggregate("artists", { aggregate: { count: "*" } }),
  )) as unknown as { count: string | number }[];

  return Number(rows[0]?.count) || 0;
}
