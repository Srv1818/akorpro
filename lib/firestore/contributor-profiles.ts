import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ContributorProfileDoc } from "@/lib/types/contribution";

const COLLECTION = "contributor_profiles";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

export async function getContributorProfile(
  uid: string,
): Promise<(ContributorProfileDoc & { id: string }) | null> {
  const doc = await db().collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as ContributorProfileDoc) };
}

export async function getContributorSongCount(uid: string): Promise<number> {
  const snap = await db()
    .collection("songs")
    .where("moderationStatus", "==", "approved")
    .where("contributorIds", "array-contains", uid)
    .get();
  return snap.size;
}
