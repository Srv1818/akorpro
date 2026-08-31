import { NextResponse } from "next/server";
import { directusAsUser, NotAuthenticatedError } from "@/lib/directus/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; itemId: string }> };

function handle(err: unknown) {
  if (err instanceof NotAuthenticatedError) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  console.error("[playlists/:id/items/:itemId]", err);
  return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
}

/**
 * Sıra ve transpoze güncellemesi.
 *
 * Firestore sürümü iki kaydın `order` alanını `writeBatch` ile takas ediyordu.
 * Burada istemci hedef sırayı gönderiyor, sunucu tek tek yazıyor — kayıt sayısı
 * liste başına 200 ile sınırlı olduğu için batch'e gerek yok.
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
    if (body.transposeSemitones === null) updates.transpose_semitones = null;
    else if (typeof body.transposeSemitones === "number") {
      updates.transpose_semitones = body.transposeSemitones;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }

    await directusAsUser(`/items/playlist_items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: updates,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    await directusAsUser(`/items/playlist_items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}
