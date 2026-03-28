import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

const COLLECTION = "takedown_requests";

export async function POST(request: Request) {
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

  const db = getAdminFirestore();
  if (!db) {
    console.error("[takedown] Firestore Admin not initialised");
    return NextResponse.json({ error: "Sunucu yapılandırma hatası" }, { status: 500 });
  }

  await db.collection(COLLECTION).add({
    name: name.trim().slice(0, 200),
    email: email.trim().slice(0, 200),
    songUrl: songUrl.trim().slice(0, 500),
    originalWork: originalWork.trim().slice(0, 500),
    proof: proof.trim().slice(0, 2000),
    status: "pending",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
