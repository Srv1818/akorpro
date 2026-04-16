import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizePlainField } from "@/lib/security/sanitize";
import { searchGeniusSongs } from "@/lib/genius/genius";

export const runtime = "nodejs";

/**
 * POST /api/admin/genius/search
 * Body: { query: string, limit?: number }
 */
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
  const query = sanitizePlainField(b.query);
  const limitRaw = b.limit;
  const limit =
    typeof limitRaw === "number" ? limitRaw : typeof limitRaw === "string" ? Number(limitRaw) : undefined;

  if (!query) return NextResponse.json({ hits: [] });

  try {
    const hits = await searchGeniusSongs(query, Number.isFinite(limit as number) ? (limit as number) : 8);
    return NextResponse.json(
      { hits },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Genius araması başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

