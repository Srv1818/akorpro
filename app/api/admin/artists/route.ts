import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createArtist,
  updateArtist,
  deleteArtist,
  getAllArtistsAdmin,
} from "@/lib/firestore/admin-artists";
import { sanitizePlainField } from "@/lib/security/sanitize";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const artists = await getAllArtistsAdmin();
  return NextResponse.json({ artists });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = sanitizePlainField(b.name);
  const slug = sanitizePlainField(b.slug);

  if (!name || !slug) {
    return NextResponse.json({ error: "İsim ve slug zorunlu." }, { status: 400 });
  }

  const id = await createArtist(
    {
      name,
      slug,
      imageUrl: typeof b.imageUrl === "string" ? b.imageUrl : undefined,
      genre: typeof b.genre === "string" ? b.genre : undefined,
      songCount: typeof b.songCount === "number" ? b.songCount : 0,
      popularity: typeof b.popularity === "number" ? b.popularity : undefined,
    },
    auth.user.uid,
  );

  return NextResponse.json({ ok: true, id });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id : "";
  if (!id) return NextResponse.json({ error: "id zorunlu." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof b.name === "string") updates.name = sanitizePlainField(b.name);
  if (typeof b.slug === "string") updates.slug = sanitizePlainField(b.slug);
  if (typeof b.imageUrl === "string") updates.imageUrl = b.imageUrl;
  if (typeof b.genre === "string") updates.genre = b.genre;
  if (typeof b.songCount === "number") updates.songCount = b.songCount;
  if (typeof b.popularity === "number") updates.popularity = b.popularity;

  await updateArtist(id, updates, auth.user.uid);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id zorunlu." }, { status: 400 });

  await deleteArtist(id, auth.user.uid);
  return NextResponse.json({ ok: true });
}
