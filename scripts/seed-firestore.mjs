/**
 * Firestore seed — şarkı, sanatçı, keşfet + kullanıcı örneği yazar.
 *
 * Emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (firebase emulators:start)
 * Production: FIREBASE_SERVICE_ACCOUNT_KEY + NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *
 * Çalıştır: node scripts/seed-firestore.mjs
 */
import admin from "firebase-admin";

/* ---------- Config ---------- */

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
const ts = admin.firestore.FieldValue.serverTimestamp();

/* ---------- Sanatçılar ---------- */

const artists = [
  { id: "a1", name: "Duman", slug: "duman", genre: "Rock", songCount: 2 },
  { id: "a2", name: "Sezen Aksu", slug: "sezen-aksu", genre: "Pop", songCount: 2 },
  { id: "a3", name: "Mor ve Ötesi", slug: "mor-ve-otesi", genre: "Rock", songCount: 1 },
  { id: "a4", name: "Yüzyüzeyken Konuşuruz", slug: "yuzyuzeyken-konusuruz", genre: "Alternatif", songCount: 1 },
];

/* ---------- Şarkılar ---------- */

const songs = [
  {
    id: "s1",
    title: "Kufi",
    slug: "kufi",
    artistId: "a1",
    artistSlug: "duman",
    artistName: "Duman",
    originalKey: "Am",
    difficulty: "orta",
    genre: "Rock",
    tempo: 120,
    timeSignature: "4/4",
    tuning: "Standard",
    capo: 0,
    moderationStatus: "approved",
    popularity: 95,
    copyrightSource: "Topluluk katkısı",
    chordBody: `[Verse]\nAm          F\nKaranlıkta kaldım\nC           G\nYine sessizlik\n\n[Chorus]\nAm    F    C    G\nKufi gibi sarıldım geceye`,
  },
  {
    id: "s2",
    title: "Hayatı Yaşa",
    slug: "hayati-yasa",
    artistId: "a1",
    artistSlug: "duman",
    artistName: "Duman",
    originalKey: "Em",
    difficulty: "kolay",
    genre: "Rock",
    tempo: 110,
    timeSignature: "4/4",
    tuning: "Standard",
    capo: 0,
    moderationStatus: "approved",
    popularity: 88,
    copyrightSource: "Topluluk katkısı",
    chordBody: `[Intro]\nEm  C  G  D\n\n[Verse]\nEm              C\nHayatı yaşa derler\nG              D\nBen yine yoldayım`,
  },
  {
    id: "s3",
    title: "Gidiyorum",
    slug: "gidiyorum",
    artistId: "a2",
    artistSlug: "sezen-aksu",
    artistName: "Sezen Aksu",
    originalKey: "Dm",
    difficulty: "orta",
    genre: "Pop",
    tempo: 96,
    timeSignature: "4/4",
    tuning: "Standard",
    capo: 0,
    moderationStatus: "approved",
    popularity: 82,
    copyrightSource: "Topluluk katkısı",
    chordBody: `[Verse]\nDm        Bb\nGidiyorum bugün\nC         A7\nUzaklara doğru`,
  },
  {
    id: "s4",
    title: "Bir Derdim Var",
    slug: "bir-derdim-var",
    artistId: "a3",
    artistSlug: "mor-ve-otesi",
    artistName: "Mor ve Ötesi",
    originalKey: "Cm",
    difficulty: "zor",
    genre: "Rock",
    tempo: 138,
    timeSignature: "4/4",
    tuning: "Standard",
    capo: 0,
    moderationStatus: "approved",
    popularity: 91,
    copyrightSource: "Topluluk katkısı",
    chordBody: `[Verse]\nCm        Ab\nBir derdim var\nEb        Bb\nSöyleyemem`,
  },
  {
    id: "s5",
    title: "Dönersen Islık Çal",
    slug: "donersen-islik-cal",
    artistId: "a4",
    artistSlug: "yuzyuzeyken-konusuruz",
    artistName: "Yüzyüzeyken Konuşuruz",
    originalKey: "G",
    difficulty: "kolay",
    genre: "Alternatif",
    tempo: 126,
    timeSignature: "4/4",
    tuning: "Standard",
    capo: 2,
    moderationStatus: "approved",
    popularity: 86,
    copyrightSource: "Topluluk katkısı",
    chordBody: `[Verse]\nG           Em\nDönersen ıslık çal\nC           D\nBeni bulurum`,
  },
  {
    id: "s6",
    title: "Ölürüm Sana",
    slug: "olurum-sana",
    artistId: "a2",
    artistSlug: "sezen-aksu",
    artistName: "Sezen Aksu",
    originalKey: "F",
    difficulty: "orta",
    genre: "Pop",
    tempo: 104,
    timeSignature: "4/4",
    tuning: "Standard",
    capo: 0,
    moderationStatus: "approved",
    popularity: 79,
    copyrightSource: "Topluluk katkısı",
    chordBody: `[Chorus]\nF           C\nÖlürüm sana\nBb          Am\nYine de severim`,
  },
];

/* ---------- Keşfet ---------- */

const discover = {
  popular: { songIds: ["s1", "s4", "s2"] },
  new: { songIds: ["s5", "s6", "s3"] },
  featured: { songIds: ["s3", "s1", "s5"] },
};

/* ---------- Yazım ---------- */

const batch = db.batch();

for (const a of artists) {
  const ref = db.collection("artists").doc(a.id);
  batch.set(ref, {
    name: a.name,
    slug: a.slug,
    genre: a.genre,
    songCount: a.songCount,
    popularity: 0,
    schemaVersion: 1,
    createdAt: ts,
    updatedAt: ts,
  });
}

for (const s of songs) {
  const { id, ...data } = s;
  const ref = db.collection("songs").doc(id);
  batch.set(ref, {
    ...data,
    contributorIds: [],
    schemaVersion: 1,
    createdAt: ts,
    updatedAt: ts,
  });
}

for (const [section, data] of Object.entries(discover)) {
  const ref = db.collection("discover").doc(section);
  batch.set(ref, {
    songIds: data.songIds,
    updatedAt: ts,
  });
}

// Kullanıcı örneği: playlist
const playlistRef = db.collection("users").doc(seedUid).collection("playlists").doc("seed-playlist-1");
batch.set(playlistRef, {
  name: "Örnek liste (seed)",
  schemaVersion: 1,
  createdAt: ts,
  updatedAt: ts,
});

batch.set(playlistRef.collection("items").doc("seed-item-1"), {
  order: 0,
  songId: "s1",
  title: "Kufi",
  artistSlug: "duman",
  songSlug: "kufi",
  createdAt: ts,
});

await batch.commit();

console.log(`Seed tamam:
  - ${artists.length} sanatçı (artists)
  - ${songs.length} şarkı (songs)
  - ${Object.keys(discover).length} keşfet bölümü (discover)
  - users/${seedUid}/playlists/seed-playlist-1 (+ 1 öğe)
  Emulator=${emulator}`);
