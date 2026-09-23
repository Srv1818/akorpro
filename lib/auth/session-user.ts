/** /api/auth/me ve getServerSessionUser için ortak şekil. */
export type SessionUser = {
  /** Payload kullanıcı id'si. */
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** Giriş sağlayıcısı — `google` veya `password`. */
  signInProvider: string | null;
  /** Yönetim/moderasyon yetkisi: admin, publisher veya moderator rolü. */
  admin: boolean;
  /** Payload rol adı — yetki kararları bunun üzerinden verilir. */
  role: string | null;
  /** Görünen ad. */
  displayName: string | null;
};
