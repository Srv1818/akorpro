import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload/client";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const takedownRl = rateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!takedownRl.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const { name, email, songUrl, originalWork, proof } = body;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.includes("@") ||
    typeof songUrl !== "string" || !songUrl.trim() ||
    typeof originalWork !== "string" || !originalWork.trim() ||
    typeof proof !== "string" || !proof.trim()
  ) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }

  // Erişim denetimi atlanarak yazılır: telif bildirimi formu girişsiz
  // kullanılabilmeli. Okuma yine de personele kapalı (kişisel veri içeriyor).
  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: "takedown-requests",
      overrideAccess: true,
      data: {
        name: name.trim().slice(0, 200),
        email: email.trim().slice(0, 200),
        songUrl: songUrl.trim().slice(0, 500),
        originalWork: originalWork.trim().slice(0, 500),
        proof: proof.trim().slice(0, 2000),
        status: "pending",
      },
    });
  } catch (e) {
    console.error("[takedown]", e);
    return NextResponse.json({ error: "Talep kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
