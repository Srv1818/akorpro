import { NextResponse } from "next/server";
import { directusAsUser, NotAuthenticatedError } from "@/lib/directus/session";
import { toEpochMs } from "@/lib/directus/serialize";
import type { PlaylistRow } from "@/lib/directus/schema";

export const runtime = "nodejs";

/**
 * Çalma listeleri — kullanıcının kendi kayıtları.
 *
 * Firestore'da bu veri istemciden doğrudan `users/{uid}/playlists` altına
 * yazılıyordu; sahiplik `firestore.rules` ile korunuyordu. Artık istek kendi
 * origin'imizden geçiyor ve sahiplik kontrolünü Directus izinleri yapıyor
 * (`owner = $CURRENT_USER`) — tarayıcı Directus'a hiç bağlanmıyor.
 */

export type PlaylistPayload = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

function toPayload(row: PlaylistRow): PlaylistPayload {
  return {
    id: row.id,
    name: row.name,
    createdAt: toEpochMs(row.created_at),
    updatedAt: toEpochMs(row.updated_at),
  };
}

function handle(err: unknown) {
  if (err instanceof NotAuthenticatedError) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  console.error("[playlists]", err);
  return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
}

export async function GET() {
  try {
    const rows = await directusAsUser<PlaylistRow[]>("/items/playlists", {
      query: "sort=-updated_at&limit=-1",
    });
    return NextResponse.json({ playlists: rows.map(toPayload) });
  } catch (err) {
    return handle(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Liste adı gerekli." }, { status: 400 });
    }

    // owner Directus tarafında preset ile $CURRENT_USER'a sabitlenir — istemci belirleyemez.
    const row = await directusAsUser<PlaylistRow>("/items/playlists", {
      method: "POST",
      body: { name },
    });
    return NextResponse.json({ playlist: toPayload(row) }, { status: 201 });
  } catch (err) {
    return handle(err);
  }
}
