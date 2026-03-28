import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ArtistDoc } from "@/lib/types/firestore";

const COLLECTION = "artists";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik.");
  return fs;
}

/** Tek sanatçı — slug ile */
export async function getArtistBySlug(slug: string): Promise<(ArtistDoc & { id: string }) | null> {
  const snap = await db()
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as ArtistDoc) };
}

/** Tüm sanatçılar — generateStaticParams veya filtre listeleri */
export async function getAllArtists(): Promise<(ArtistDoc & { id: string })[]> {
  const snap = await db()
    .collection(COLLECTION)
    .orderBy("name")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ArtistDoc) }));
}
