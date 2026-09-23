import "server-only";

import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Payload Local API istemcisi (yalnız sunucu tarafı).
 *
 * `lib/directus/client.ts`'in yerini alır. Önemli fark: HTTP yok. Sorgular
 * aynı süreç içinde doğrudan Postgres'e gider, yani Directus kurulumundaki
 * uygulama → HTTP → Directus → Postgres zincirinden iki katman siliniyor.
 *
 * Statik token da gerekmiyor: `overrideAccess` varsayılan olarak açık,
 * kullanıcı bağlamlı çağrılarda `user` geçilip `overrideAccess: false` denir.
 */
export const getPayloadClient = () => getPayload({ config });
