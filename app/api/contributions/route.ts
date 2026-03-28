import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { createContribution, getContributionsByUser } from "@/lib/firestore/contributions";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const contribRl = rateLimiter({ windowMs: 300_000, max: 5 });

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!contribRl.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla katkı gönderimi. 5 dakika bekleyin." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const songTitle = sanitizePlainField(b.songTitle);
  const artistName = sanitizePlainField(b.artistName);
  const chordBody = typeof b.chordBody === "string" ? sanitizeTextContent(b.chordBody) : "";
  const originalKey = sanitizePlainField(b.originalKey);
  const genre = sanitizePlainField(b.genre);
  const difficulty = sanitizePlainField(b.difficulty);

  if (!songTitle || !artistName || !chordBody || !originalKey || !genre || !difficulty) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  if (!["kolay", "orta", "zor"].includes(difficulty)) {
    return NextResponse.json({ error: "Geçersiz zorluk." }, { status: 400 });
  }

  const id = await createContribution({
    songTitle,
    artistName,
    chordBody,
    originalKey,
    genre,
    difficulty: difficulty as "kolay" | "orta" | "zor",
    tempo: typeof b.tempo === "number" || typeof b.tempo === "string" ? b.tempo : undefined,
    timeSignature: typeof b.timeSignature === "string" ? b.timeSignature : undefined,
    tuning: typeof b.tuning === "string" ? b.tuning : undefined,
    capo: typeof b.capo === "number" ? b.capo : undefined,
    copyrightSource: typeof b.copyrightSource === "string" ? b.copyrightSource : undefined,
    contributorUid: user.uid,
    contributorDisplayName: user.email ?? "Anonim",
  });

  return NextResponse.json({ ok: true, id });
}

export async function GET(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (uid && uid !== user.uid && !user.admin) {
    return NextResponse.json({ error: "Başka kullanıcının katkılarını görme yetkiniz yok." }, { status: 403 });
  }

  const contributions = await getContributionsByUser(uid ?? user.uid);
  return NextResponse.json({ contributions });
}
