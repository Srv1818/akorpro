import { sql } from 'drizzle-orm'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Google girişinin ezdiği yönetici rolünü geri yükler.
 *
 * Ne oldu: OAuth eklentisi `getUserInfo`'nun döndürdüğü nesneyi hem kullanıcı
 * oluştururken hem de HER girişte güncellerken aynen kullanıyor. O nesnede
 * `role: "contributor"` yazılıydı; niyet "ilk girişte katkıcı olsun" idi ama
 * pratikte her girişte rolü eziyordu.
 *
 * Google girişi 1 Ekim'e kadar hiç tamamlanmıyordu (redirect_uri uyumsuzluğu),
 * bu yüzden hata gizli kaldı. Giriş düzeltilir düzeltilmez ilk başarılı giriş
 * yönetici hesabını katkıcıya düşürdü ve panel kapandı.
 *
 * Sebep `payload.config.ts` içinde kapatıldı: `role` artık hiç gönderilmiyor,
 * ilk kayıt zaten alanın `defaultValue` değeriyle katkıcı oluyor. Bu migration
 * yalnız ezilmiş kaydı onarıyor.
 *
 * Kapsam bilerek dar: tek bir e-posta, ve yalnız rolü "contributor" ise.
 * Rol elle düzeltilmişse dokunmaz, tekrar çalışırsa bir şey değiştirmez.
 */
const ONARILACAK_EPOSTA = 'buyukatakan@gmail.com'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE users
    SET role = 'admin'::enum_users_role
    WHERE lower(email) = ${ONARILACAK_EPOSTA}
      AND role = 'contributor'::enum_users_role
  `)
}

/**
 * Geri alınmıyor: bu bir onarım, geri almak hesabı tekrar kilitlemek olurdu.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1`)
}
