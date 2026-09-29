import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getPayloadClient } from "@/lib/payload/client";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/**
 * Şarkı görüntülenme işareti.
 *
 * Tarayıcıdan çağrılıyor, sunucu render'ından değil: sunucuda saysaydık
 * arama motoru botları ve ön-üretim de sayılırdı.
 *
 * Yazma tek bir `INSERT ... ON CONFLICT DO UPDATE` ile yapılıyor. Payload'ın
 * Local API'si "varsa artır" işlemini atomik yapamıyor; oku-artır-yaz üç adımı
 * eşzamanlı isteklerde sayım kaybederdi.
 */
const viewRl = rateLimiter({ windowMs: 60_000, max: 30 });

export async function POST(request: Request, ctx: { params: Promise<{ songId: string }> }) {
  const { songId } = await ctx.params;
  const id = Number(songId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!viewRl.check(clientIp)) {
    // Sessizce yut: sayaç kritik değil, istemciye hata göstermenin anlamı yok.
    return new NextResponse(null, { status: 204 });
  }

  const day = new Date().toISOString().slice(0, 10);

  try {
    const payload = await getPayloadClient();
    const db = payload.db.drizzle as NodePgDatabase<Record<string, never>>;
    await db.execute(sql`
      INSERT INTO song_views (song_id, day, count, updated_at, created_at)
      VALUES (${id}, ${day}, 1, now(), now())
      ON CONFLICT (song_id, day)
      DO UPDATE SET count = song_views.count + 1, updated_at = now()
    `);
  } catch (e) {
    // Olmayan şarkı kimliği yabancı anahtarda patlar; sayaç için 500 dönmeye değmez.
    console.error("[view]", e);
  }

  return new NextResponse(null, { status: 204 });
}
