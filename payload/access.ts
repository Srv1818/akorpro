import type { Access, FieldAccess } from "payload";

/**
 * Erişim kuralları — Directus'taki rol/politika kurulumunun karşılığı.
 *
 * Directus'ta bunlar `scripts/directus-roles.mjs` ile API üzerinden kuruluyordu.
 * Payload'da düz fonksiyon oldukları için tip denetiminden geçiyorlar ve
 * testleri yazılabiliyor.
 *
 * Rol hiyerarşisi (geniş → dar):
 *   admin       → her şey, Payload admin paneli dahil
 *   publisher   → içeriği yayına alır (moderationStatus = approved)
 *   moderator   → içeriği düzenler, yayına ALAMAZ
 *   contributor → yalnız kendi katkısı ve kendi çalma listesi; panele giremez
 */

export type Role = "admin" | "publisher" | "moderator" | "contributor";

/** Admin paneline girebilen roller. Contributor bilerek dışarıda. */
export const STAFF_ROLES: readonly Role[] = ["admin", "publisher", "moderator"];

/** Payload'ın ürettiği User tipi de, ham `req.user` da buna uyar. */
export type MaybeUser = { role?: string | null } | null | undefined;

export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  if (!user?.role) return false;
  return (roles as readonly string[]).includes(user.role);
}

export const isAdmin: Access = ({ req }) => hasRole(req.user, "admin");

export const isPublisher: Access = ({ req }) =>
  hasRole(req.user, "admin", "publisher");

export const isModerator: Access = ({ req }) =>
  hasRole(req.user, "admin", "publisher", "moderator");

export const isStaff = isModerator;

export const isLoggedIn: Access = ({ req }) => Boolean(req.user);

/** Herkese açık okuma. */
export const anyone: Access = () => true;

/**
 * Yayındaki şarkılar herkese açık; personel taslakları da görür.
 * Anonim istekte `where` döndürmek Payload'da filtre anlamına gelir.
 */
export const readApprovedOrStaff: Access = ({ req }) => {
  if (hasRole(req.user, "admin", "publisher", "moderator")) return true;
  return { moderationStatus: { equals: "approved" } };
};

/** Yalnız kendi kaydı. Girişsizse hiçbir şey. */
export function ownedBy(field: string): Access {
  return ({ req }) => {
    if (!req.user) return false;
    if (hasRole(req.user, "admin")) return true;
    return { [field]: { equals: req.user.id } };
  };
}

/**
 * Alan bazlı erişim. `Access` ile `FieldAccess` imzaları farklı: alan
 * fonksiyonları `Where` döndüremez, yalnız boolean. Bu yüzden ayrı tutuluyor.
 */
export const publisherOnlyField: FieldAccess = ({ req }) =>
  hasRole(req.user, "admin", "publisher");

/** Alan bazlı: yalnız yönetici (örn. `verified` bayrağı). */
export const adminOnlyField: FieldAccess = ({ req }) => hasRole(req.user, "admin");

/** Alan bazlı: personel (moderatör ve üstü). */
export const staffOnlyField: FieldAccess = ({ req }) =>
  hasRole(req.user, "admin", "publisher", "moderator");

/** Panele giriş yetkisi — Directus'taki `admin_access` karşılığı. */
export function canAccessAdminPanel(user: MaybeUser): boolean {
  return hasRole(user, ...STAFF_ROLES);
}
