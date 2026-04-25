import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createMetod, deleteMetod, getAllMetodlar } from "@/lib/firestore/admin-metodlar";
import { TAGS } from "@/lib/cache/tags";
import { sanitizePlainField } from "@/lib/security/sanitize";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const metodlar = await getAllMetodlar();
  return NextResponse.json({ metodlar });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = sanitizePlainField(b.title);
  const slug = sanitizePlainField(b.slug);
  const description = sanitizePlainField(b.description ?? "");

  if (!title || !slug)
    return NextResponse.json({ error: "Başlık ve slug zorunlu." }, { status: 400 });

  const id = await createMetod({ title, slug, description, bolumler: [] }, auth.user.uid);
  revalidateTag(TAGS.METODLAR_ALL, "max");
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id zorunlu." }, { status: 400 });

  await deleteMetod(id, auth.user.uid);
  revalidateTag(TAGS.METODLAR_ALL, "max");
  return NextResponse.json({ ok: true });
}
