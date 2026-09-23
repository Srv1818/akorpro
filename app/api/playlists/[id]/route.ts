import { NextResponse } from "next/server";
import { payloadErrorResponse, requireUser } from "@/lib/payload/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function handle(err: unknown) {
  const { body, status } = payloadErrorResponse("playlists/:id", err);
  return NextResponse.json(body, { status });
}

/** Liste adını değiştir. Sahiplik kontrolünü koleksiyonun access kuralı yapar. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Liste adı gerekli." }, { status: 400 });
    }

    const { payload, as } = await requireUser();
    await payload.update({ collection: "playlists", id, data: { name }, ...as });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}

/**
 * Listeyi sil. Öğeler şemada CASCADE ile bağlı olduğu için ayrıca
 * temizlemek gerekmiyor.
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { payload, as } = await requireUser();
    await payload.delete({ collection: "playlists", id, ...as });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}
