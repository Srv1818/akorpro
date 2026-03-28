/** /api/auth/me ve getServerSessionUser için ortak şekil. */
export type SessionUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** Firebase: örn. `password`, `google.com` */
  signInProvider: string | null;
  /** Custom claim: admin */
  admin: boolean;
};
