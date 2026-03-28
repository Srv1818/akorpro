/**
 * Örnek kullanıcı ağacı yazar: users/{uid}/playlists + items.
 *
 * Emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (firebase emulators:start)
 * Production: FIREBASE_SERVICE_ACCOUNT_KEY + NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *
 * Çalıştır: node scripts/seed-firestore.mjs
 */
import admin from "firebase-admin";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-akorpro";
const seedUid = process.env.AKORPRO_SEED_UID || "seed-demo-user";
const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const cred = parseServiceAccount();

if (!emulator && !cred) {
  console.error("Ayarlayın: FIRESTORE_EMULATOR_HOST (emulator) veya FIREBASE_SERVICE_ACCOUNT_KEY.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp(
    cred ? { credential: admin.credential.cert(cred), projectId } : { projectId },
  );
}

const db = admin.firestore();
const playlistRef = db.collection("users").doc(seedUid).collection("playlists").doc("seed-playlist-1");

await playlistRef.set({
  name: "Örnek liste (seed)",
  schemaVersion: 1,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const items = playlistRef.collection("items");
const batch = db.batch();
batch.set(items.doc("seed-item-1"), {
  order: 0,
  songId: "s1",
  title: "Kufi",
  artistSlug: "duman",
  songSlug: "kufi",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});
await batch.commit();

console.log(`Seed tamam: users/${seedUid}/playlists/seed-playlist-1 (+ 1 öğe). Emulator=${emulator}`);
