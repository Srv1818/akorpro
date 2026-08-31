import { NextResponse } from "next/server";
import { directusAsUser, NotAuthenticatedError } from "@/lib/directus/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function handle(err: unknown) {
  if (err instanceof NotAuthenticatedError) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  console.error("[playlists/:id]", err);
  return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
}

/** Liste adını değiştir. Sahiplik kontrolünü Directus izni yapar. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Liste adı gerekli." }, { status: 400 });
    }

    await directusAsUser(`/items/playlists/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}

/**
 * Listeyi sil. `playlist_items` şemada `on_delete: CASCADE` olduğu için
 * kayıtları ayrıca temizlemek gerekmiyor (Firestore'da elle batch siliniyordu).
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await directusAsUser(`/items/playlists/${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}
