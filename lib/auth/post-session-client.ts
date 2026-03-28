/**
 * İstemci: Firebase ID token ile HTTP-only session çerezi oluşturur.
 */
export async function postSessionCookie(idToken: string): Promise<string | null> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? "Oturum çerezi oluşturulamadı.";
  }
  return null;
}
