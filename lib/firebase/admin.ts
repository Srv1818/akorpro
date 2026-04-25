import admin from "firebase-admin";

/**
 * `FIRESTORE_EMULATOR_HOST` ortamda tanımlıysa Firebase Admin SDK Firestore’u emülatöre yönlendirir.
 * `.env.local`’da kalan eski değer + kapalı emülatör = yerelde şarkı listesi/detay boş, canlıda veri varmış gibi görünür.
 * Kaçış: AKORPRO_ADMIN_USE_CLOUD_FIRESTORE=1 → bu süreçte emülatör host’u yok say, canlı projeyi kullan.
 */
function applyCloudFirestorePreference(): void {
  if (process.env.AKORPRO_ADMIN_USE_CLOUD_FIRESTORE !== "1") return;
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    delete process.env.FIRESTORE_EMULATOR_HOST;
  }
}

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    return null;
  }
}

export function getFirebaseAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  applyCloudFirestorePreference();
  const cred = parseServiceAccount();
  if (!cred) {
    return null;
  }
  return admin.initializeApp({
    credential: admin.credential.cert(cred),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth(): admin.auth.Auth | null {
  const app = getFirebaseAdminApp();
  return app ? app.auth() : null;
}

export function getAdminFirestore(): admin.firestore.Firestore | null {
  const app = getFirebaseAdminApp();
  return app ? app.firestore() : null;
}

export function getAdminStorage(): admin.storage.Storage | null {
  const app = getFirebaseAdminApp();
  return app ? admin.storage(app) : null;
}
