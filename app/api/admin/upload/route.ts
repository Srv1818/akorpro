import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const storage = getAdminStorage();
    if (!storage || !BUCKET)
      return NextResponse.json({ error: "Storage yapılandırılmamış." }, { status: 500 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });

    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: "Sadece JPEG, PNG, WebP ve GIF desteklenir." }, { status: 400 });

    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: "Dosya 8 MB'ı geçemez." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `metod-uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const bucket = storage.bucket();
    await bucket.file(path).save(buffer, { contentType: file.type });

    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload]", err);
    const msg = err instanceof Error ? err.message : "Bilinmeyen hata.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
