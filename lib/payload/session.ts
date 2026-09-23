import "server-only";

import { headers as nextHeaders } from "next/headers";
import type { TypedUser } from "payload";
import { getPayloadClient } from "@/lib/payload/client";

/**
 * Kullanıcı bağlamlı Payload erişimi.
 *
 * `lib/directus/session.ts`'in yerini alır. Oradaki fikir korunuyor: sahiplik
 * kararını route kodu değil veri katmanı veriyor. Directus'ta bu, kullanıcının
 * kendi token'ıyla istek atmak demekti; burada `overrideAccess: false` ve
 * `user` geçmek demek — koleksiyonlardaki access kuralları uygulanıyor.
 *
 * Fark: HTTP yok, aynı süreç içinde çalışıyor.
 */

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Oturum gerekli.");
    this.name = "NotAuthenticatedError";
  }
}

export type UserContext = {
  payload: Awaited<ReturnType<typeof getPayloadClient>>;
  user: TypedUser;
  /** Local API çağrılarına yayılacak ortak argümanlar. */
  as: { user: TypedUser; overrideAccess: false };
};

/** Oturum yoksa `NotAuthenticatedError` fırlatır. */
export async function requireUser(): Promise<UserContext> {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) throw new NotAuthenticatedError();

  return { payload, user, as: { user, overrideAccess: false } };
}

/**
 * Payload hatalarını doğru HTTP koduna çevirir.
 *
 * Payload'ın `APIError` sınıfları `status` taşıyor; genel bir catch bunu
 * kaybedip her şeyi 500 yapardı. Başkasının çalma listesini silmeye çalışmak
 * 500 değil 403 dönmeli — istemci tarafında "sunucu hatası" ile "yetkin yok"
 * ayrımı kayboluyordu (yaşandı).
 */
export function payloadErrorResponse(
  label: string,
  err: unknown,
): { body: { error: string }; status: number } {
  if (err instanceof NotAuthenticatedError) {
    return { body: { error: "Oturum gerekli." }, status: 401 };
  }

  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    const message =
      status === 403
        ? "Bu işlem için yetkin yok."
        : status === 404
          ? "Kayıt bulunamadı."
          : "İstek geçersiz.";
    return { body: { error: message }, status };
  }

  console.error(`[${label}]`, err);
  return { body: { error: "İşlem başarısız." }, status: 500 };
}
