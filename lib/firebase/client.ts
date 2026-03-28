import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase istemcisi yalnızca tarayıcıda başlatılabilir.");
  }
  const config = getFirebasePublicConfig();
  if (!config) {
    throw new Error("NEXT_PUBLIC_FIREBASE_* ortam değişkenleri eksik.");
  }
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(config);
}
