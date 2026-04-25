import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";
import { activateAppCheck } from "@/lib/security/app-check";

let emulatorsConnected = false;
let appCheckActivated = false;

function connectEmulatorsIfNeeded(app: FirebaseApp) {
  if (emulatorsConnected) return;
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "1") return;

  emulatorsConnected = true;
  const authHost =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ?? "http://127.0.0.1:9099";
  const fsHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1";
  const fsPort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? "8080");

  const auth = getAuth(app);
  connectAuthEmulator(auth, authHost, { disableWarnings: true });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, fsHost, fsPort);
}

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase istemcisi yalnızca tarayıcıda başlatılabilir.");
  }
  const config = getFirebasePublicConfig();
  if (!config) {
    throw new Error("NEXT_PUBLIC_FIREBASE_* ortam değişkenleri eksik.");
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  connectEmulatorsIfNeeded(app);

  if (!appCheckActivated) {
    appCheckActivated = true;
    activateAppCheck();
  }

  return app;
}

export function getClientFirestore(): Firestore {
  const app = getFirebaseApp();
  return getFirestore(app);
}

export function getClientAuth(): Auth {
  const app = getFirebaseApp();
  return getAuth(app);
}

export function getClientStorage(): FirebaseStorage {
  const app = getFirebaseApp();
  return getStorage(app);
}
