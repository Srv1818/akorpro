import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllChordShapes,
  createChordShape,
  updateChordShape,
  deleteChordShape,
} from "@/lib/firestore/chord-library";
import { sanitizePlainField } from "@/lib/security/sanitize";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const shapes = await getAllChordShapes();
  return NextResponse.json({ shapes });
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
  const root = sanitizePlainField(b.root);
  const quality = sanitizePlainField(b.quality);
  const fingering = sanitizePlainField(b.fingering);

  if (!name || !root || !quality || !fingering) {
    return NextResponse.json({ error: "name, root, quality, fingering zorunlu." }, { status: 400 });
  }

  const id = await createChordShape(
    {
      name,
      root,
      quality: quality as "maj",
      fingering,
      frets: Array.isArray(b.frets) ? (b.frets as number[]) : undefined,
      barreStart: typeof b.barreStart === "number" ? b.barreStart : undefined,
      barreEnd: typeof b.barreEnd === "number" ? b.barreEnd : undefined,
      barreFret: typeof b.barreFret === "number" ? b.barreFret : undefined,
      sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : undefined,
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
  if (typeof b.root === "string") updates.root = sanitizePlainField(b.root);
  if (typeof b.quality === "string") updates.quality = b.quality;
  if (typeof b.fingering === "string") updates.fingering = b.fingering;
  if (Array.isArray(b.frets)) updates.frets = b.frets;
  if (typeof b.sortOrder === "number") updates.sortOrder = b.sortOrder;

  await updateChordShape(id, updates, auth.user.uid);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id zorunlu." }, { status: 400 });

  await deleteChordShape(id, auth.user.uid);
  return NextResponse.json({ ok: true });
}
