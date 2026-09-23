import { NextResponse } from "next/server";
import { payloadErrorResponse, requireUser } from "@/lib/payload/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; itemId: string }> };

function handle(err: unknown) {
  const { body, status } = payloadErrorResponse("playlists/:id/items/:itemId", err);
  return NextResponse.json(body, { status });
}

/**
 * Sıra ve transpoze güncellemesi.
 *
 * İstemci hedef sırayı gönderiyor, sunucu tek tek yazıyor — kayıt sayısı
 * liste başına 200 ile sınırlı olduğu için toplu yazmaya gerek yok.
 *
 * Başkasının listesindeki öğeye dokunma girişimi koleksiyonun access
 * kuralında durur (öğe erişimi listenin sahipliğinden türetiliyor).
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const body = (await request.json()) as {
      position?: unknown;
      transposeSemitones?: unknown;
    };

    const updates: Record<string, unknown> = {};
    if (typeof body.position === "number") updates.position = body.position;
    if (body.transposeSemitones === null) updates.transposeSemitones = null;
    else if (typeof body.transposeSemitones === "number") {
      updates.transposeSemitones = body.transposeSemitones;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }

    const { payload, as } = await requireUser();
    await payload.update({
      collection: "playlist-items",
      id: itemId,
      data: updates as never,
      ...as,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const { payload, as } = await requireUser();
    await payload.delete({ collection: "playlist-items", id: itemId, ...as });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}
