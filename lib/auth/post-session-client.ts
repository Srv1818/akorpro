/**
 * İstemci: Firebase ID token ile HTTP-only session çerezi oluşturur.
 */
export async function postSessionCookie(idToken: string): Promise<string | null> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const text = await res.text();
    let apiError: string | undefined;
    try {
      const data = JSON.parse(text) as { error?: unknown };
      if (typeof data?.error === "string") apiError = data.error;
    } catch {
      /* yanıt JSON değil (ör. proxy HTML) */
    }
    return apiError ?? `Oturum çerezi oluşturulamadı (HTTP ${res.status}).`;
  }
  return null;
}
