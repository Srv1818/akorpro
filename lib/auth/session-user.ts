/** /api/auth/me ve getServerSessionUser için ortak şekil. */
export type SessionUser = {
  /** Directus kullanıcı id'si (eski Firebase UID'sinin yerine). */
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** Directus giriş sağlayıcısı — örn. `google`, `default`. */
  signInProvider: string | null;
  /** Yönetim/moderasyon yetkisi: Administrator, Moderator veya Publisher rolü. */
  admin: boolean;
  /** Directus rol adı — yetki kararları bunun üzerinden verilir. */
  role: string | null;
  /** Görünen ad (Directus first/last name veya e-posta). */
  displayName: string | null;
};
