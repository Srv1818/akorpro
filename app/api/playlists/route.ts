import { NextResponse } from "next/server";
import { payloadErrorResponse, requireUser } from "@/lib/payload/session";
import { toEpochMs } from "@/lib/payload/serialize";
import type { Playlist } from "@/payload-types";

export const runtime = "nodejs";

/**
 * Çalma listeleri — kullanıcının kendi kayıtları.
 *
 * Tarayıcı veritabanına hiç bağlanmıyor; istek kendi origin'imizden geçiyor.
 * Sahiplik kontrolünü route kodu değil koleksiyonun access kuralı yapıyor
 * (payload/collections/Playlists.ts — `ownedBy("owner")`).
 */

export type PlaylistPayload = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

function toPayload(row: Playlist): PlaylistPayload {
  return {
    id: String(row.id),
    name: row.name,
    createdAt: toEpochMs(row.createdAt),
    updatedAt: toEpochMs(row.updatedAt),
  };
}

function handle(err: unknown) {
  const { body, status } = payloadErrorResponse("playlists", err);
  return NextResponse.json(body, { status });
}

export async function GET() {
  try {
    const { payload, as } = await requireUser();
    const { docs } = await payload.find({
      collection: "playlists",
      sort: "-updatedAt",
      limit: 0,
      depth: 0,
      ...as,
    });
    return NextResponse.json({ playlists: docs.map(toPayload) });
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

    const { payload, user, as } = await requireUser();
    // owner oturumdan gelir; istemcinin gönderdiği bir değer kullanılmaz.
    const doc = await payload.create({
      collection: "playlists",
      data: { name, owner: user.id } as never,
      ...as,
    });
    return NextResponse.json({ playlist: toPayload(doc) }, { status: 201 });
  } catch (err) {
    return handle(err);
  }
}
