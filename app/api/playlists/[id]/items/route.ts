import { NextResponse } from "next/server";
import { payloadErrorResponse, requireUser } from "@/lib/payload/session";
import { relId, toEpochMs } from "@/lib/payload/serialize";

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

type ExpandedSong = { id: string | number; title: string; slug?: string | null; artistSlug?: string | null };

type ItemDoc = {
  id: string | number;
  position: number;
  transposeSemitones?: number | null;
  createdAt: string;
  song: ExpandedSong | string | number | null;
};

function toPayload(row: ItemDoc): PlaylistItemPayload | null {
  const song = row.song;
  // Silinmiş şarkıya bağlı kayıtlar listeden düşürülür.
  if (!song || typeof song !== "object") return null;

  return {
    id: String(row.id),
    songId: String(song.id),
    title: song.title,
    artistSlug: song.artistSlug ?? "",
    songSlug: song.slug ?? "",
    order: row.position,
    ...(row.transposeSemitones != null
      ? { transposeSemitones: row.transposeSemitones }
      : {}),
    createdAt: toEpochMs(row.createdAt),
  };
}

function handle(err: unknown) {
  const { body, status } = payloadErrorResponse("playlists/:id/items", err);
  return NextResponse.json(body, { status });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { payload, as } = await requireUser();

    const { docs } = await payload.find({
      collection: "playlist-items",
      where: { playlist: { equals: id } },
      sort: "position",
      limit: 0,
      // Şarkı alanları kart için gerekli; tek sorguda genişletiliyor.
      depth: 1,
      ...as,
    });

    return NextResponse.json({
      items: (docs as unknown as ItemDoc[]).map(toPayload).filter(Boolean),
    });
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

    const { payload, as } = await requireUser();

    const { docs: existing } = await payload.find({
      collection: "playlist-items",
      where: { playlist: { equals: id } },
      sort: "-position",
      limit: 0,
      depth: 0,
      ...as,
    });

    if (existing.length >= MAX_ITEMS_PER_PLAYLIST) {
      return NextResponse.json(
        { error: `Bir listede en fazla ${MAX_ITEMS_PER_PLAYLIST} şarkı olabilir.` },
        { status: 400 },
      );
    }
    if (existing.some((i) => relId(i.song) === songId)) {
      return NextResponse.json(
        { error: "Şarkı bu listede zaten var.", duplicate: true },
        { status: 409 },
      );
    }

    const nextPosition = existing.length > 0 ? existing[0].position + 1 : 0;

    await payload.create({
      collection: "playlist-items",
      data: {
        playlist: id,
        song: songId,
        position: nextPosition,
        ...(typeof body.transposeSemitones === "number"
          ? { transposeSemitones: body.transposeSemitones }
          : {}),
      } as never,
      ...as,
    });

    // Listeler `updatedAt`'e göre sıralanıyor ve alt kayıt eklenince üst satıra
    // dokunulmuyor. "Son kullanılan üstte" davranışını korumak için tazeliyoruz.
    await touchPlaylist(id);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handle(err);
  }
}

async function touchPlaylist(id: string): Promise<void> {
  try {
    const { payload, as } = await requireUser();
    const row = await payload.findByID({ collection: "playlists", id, depth: 0, ...as });
    await payload.update({
      collection: "playlists",
      id,
      data: { name: row.name },
      ...as,
    });
  } catch {
    // Sıralama tazelenmese de şarkı eklendi; isteği bu yüzden düşürmeyiz.
  }
}
