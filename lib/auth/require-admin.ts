import { NextResponse } from "next/server";
import { getServerSessionUser } from "./server-session";

/**
 * Verify the caller is an authenticated admin.
 * Returns the SessionUser on success, or a NextResponse error.
 */
export async function requireAdmin() {
  const user = await getServerSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Oturum gerekli." }, { status: 401 }) };
  }
  if (!user.admin) {
    return { error: NextResponse.json({ error: "Yetki yok — admin gerekli." }, { status: 403 }) };
  }
  return { user };
}
