import { NextResponse } from "next/server";
import { directusAsUser, NotAuthenticatedError } from "@/lib/directus/session";
import { toEpochMs } from "@/lib/directus/serialize";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Listeye eklenebilecek en fazla şarkı — Firestore sürümündeki sınır korundu. */
const MAX_ITEMS_PER_PLAYLIST = 200;

export type PlaylistItemPayload = {
  id: string;
  songId: string;
  title: string;
  artistSlug: string;
  songSlug: string;
  order: number;
  transposeSemitones?: number;
  createdAt: number;
};

type ItemRow = {
  id: string;
  position: number;
  transpose_semitones: number | null;
  created_at: string;
  song: {
    id: string;
    title: string;
    slug: string;
    artist_slug: string;
  } | null;
};

const ITEM_FIELDS = "id,position,transpose_semitones,created_at,song.id,song.title,song.slug,song.artist_slug";

function toPayload(row: ItemRow): PlaylistItemPayload | null {
  if (!row.song) return null;
  return {
    id: row.id,
    songId: row.song.id,
    title: row.song.title,
    artistSlug: row.song.artist_slug,
    songSlug: row.song.slug,
    order: row.position,
    ...(row.transpose_semitones != null
      ? { transposeSemitones: row.transpose_semitones }
      : {}),
    createdAt: toEpochMs(row.created_at),
  };
}

function handle(err: unknown) {
  if (err instanceof NotAuthenticatedError) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  console.error("[playlists/:id/items]", err);
  return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const rows = await directusAsUser<ItemRow[]>("/items/playlist_items", {
      query:
        `filter[playlist][_eq]=${encodeURIComponent(id)}` +
        `&sort=position&limit=-1&fields=${ITEM_FIELDS}`,
    });

    // Silinmiş şarkıya bağlı kayıtlar listeden düşürülür.
    return NextResponse.json({ items: rows.map(toPayload).filter(Boolean) });
  } catch (err) {
    return handle(err);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { songId?: unknown; transposeSemitones?: unknown };
    const songId = typeof body.songId === "string" ? body.songId : "";
    if (!songId) {
      return NextResponse.json({ error: "songId gerekli." }, { status: 400 });
    }

    const existing = await directusAsUser<{ id: string; position: number; song: string }[]>(
      "/items/playlist_items",
      {
        query:
          `filter[playlist][_eq]=${encodeURIComponent(id)}` +
          `&sort=-position&limit=-1&fields=id,position,song`,
      },
    );

    if (existing.length >= MAX_ITEMS_PER_PLAYLIST) {
      return NextResponse.json(
        { error: `Bir listede en fazla ${MAX_ITEMS_PER_PLAYLIST} şarkı olabilir.` },
        { status: 400 },
      );
    }
    if (existing.some((i) => i.song === songId)) {
      return NextResponse.json({ error: "Şarkı bu listede zaten var.", duplicate: true }, { status: 409 });
    }

    const nextPosition = existing.length > 0 ? existing[0].position + 1 : 0;

    await directusAsUser("/items/playlist_items", {
      method: "POST",
      body: {
        playlist: id,
        song: songId,
        position: nextPosition,
        ...(typeof body.transposeSemitones === "number"
          ? { transpose_semitones: body.transposeSemitones }
          : {}),
      },
    });

    // Listeler `updated_at`'e göre sıralanıyor ve Directus alt kayıt eklenince
    // üst satıra dokunmuyor. "Son kullanılan üstte" davranışını korumak için
    // adı kendisiyle yazıp güncellenme zamanını tazeliyoruz.
    await touchPlaylist(id);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handle(err);
  }
}

async function touchPlaylist(id: string): Promise<void> {
  try {
    const row = await directusAsUser<{ name: string }>(
      `/items/playlists/${encodeURIComponent(id)}`,
      { query: "fields=name" },
    );
    await directusAsUser(`/items/playlists/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name: row.name },
    });
  } catch {
    // Sıralama tazelenmese de şarkı eklendi; isteği bu yüzden düşürmeyiz.
  }
}

