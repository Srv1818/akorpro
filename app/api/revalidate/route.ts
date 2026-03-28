import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const revalidateRl = rateLimiter({ windowMs: 60_000, max: 30 });

const ALLOWED_TAG_PREFIXES = [
  "song:",
  "artist:",
  "songs:",
  "artists:",
  "discover:",
];

function isValidTag(tag: string): boolean {
  return ALLOWED_TAG_PREFIXES.some((p) => tag.startsWith(p));
}

const ALLOWED_PATH_PATTERNS = [
  /^\/akor\/[\w-]+\/[\w-]+$/,
  /^\/sanatci\/[\w-]+$/,
  /^\/kesfet$/,
  /^\/gitar-akorlari$/,
  /^\/preview\/[\w-]+\/[\w-]+$/,
];

function isValidPath(path: string): boolean {
  return ALLOWED_PATH_PATTERNS.some((re) => re.test(path));
}

/**
 * On-demand revalidation endpoint.
 *
 * POST /api/revalidate
 * Authorization: Bearer <REVALIDATION_SECRET>
 *
 * Body: { tags?: string[], paths?: string[] }
 *
 * Called after moderation/approval, discover list updates, etc.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATION_SECRET yapılandırılmamış." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!revalidateRl.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { tags, paths } = body as { tags?: unknown; paths?: unknown };

  const revalidatedTags: string[] = [];
  const revalidatedPaths: string[] = [];
  const skipped: string[] = [];

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag === "string" && isValidTag(tag)) {
        revalidateTag(tag, "max");
        revalidatedTags.push(tag);
      } else {
        skipped.push(String(tag));
      }
    }
  }

  if (Array.isArray(paths)) {
    for (const p of paths) {
      if (typeof p === "string" && isValidPath(p)) {
        revalidatePath(p);
        revalidatedPaths.push(p);
      } else {
        skipped.push(String(p));
      }
    }
  }

  if (revalidatedTags.length === 0 && revalidatedPaths.length === 0) {
    return NextResponse.json(
      { error: "Geçerli tag veya path bulunamadı.", skipped },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    revalidatedTags,
    revalidatedPaths,
    ...(skipped.length > 0 ? { skipped } : {}),
  });
}
