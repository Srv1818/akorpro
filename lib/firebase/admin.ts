import admin from "firebase-admin";

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
  const cred = parseServiceAccount();
  if (!cred) {
    return null;
  }
  return admin.initializeApp({
    credential: admin.credential.cert(cred),
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
