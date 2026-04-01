/**
 * Firestore Security Rules integration tests.
 * Requires: firebase emulators running (firestore on :8080, auth on :9099)
 *
 * Run: npm run emulators  (in another terminal)
 * Then: npm run test:integration
 */
import { describe, it, beforeAll, afterAll, afterEach } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const PROJECT_ID = "demo-akorpro";
const RULES_PATH = resolve(__dirname, "../../firestore.rules");

let testEnv: RulesTestEnvironment | null = null;

beforeAll(async () => {
  const rules = readFileSync(RULES_PATH, "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules,
    },
  });
});

afterEach(async () => {
  if (!testEnv) return;
  await testEnv.clearFirestore();
});

afterAll(async () => {
  if (!testEnv) return;
  await testEnv.cleanup();
});

function authed(uid: string, claims?: Record<string, unknown>) {
  if (!testEnv) throw new Error("Test environment not initialized. Is Firestore emulator running?");
  return testEnv.authenticatedContext(uid, claims).firestore();
}

function unauthed() {
  if (!testEnv) throw new Error("Test environment not initialized. Is Firestore emulator running?");
  return testEnv.unauthenticatedContext().firestore();
}

function admin(uid = "admin-user") {
  return authed(uid, { admin: true });
}

describe("songs", () => {
  it("anyone can read songs", async () => {
    const db = unauthed();
    await assertSucceeds(getDoc(doc(db, "songs", "s1")));
  });

  it("non-admin cannot write songs", async () => {
    const db = authed("user1");
    await assertFails(setDoc(doc(db, "songs", "s1"), { title: "hack" }));
  });

  it("admin can write songs", async () => {
    const db = admin();
    await assertSucceeds(setDoc(doc(db, "songs", "s1"), { title: "Admin Song" }));
  });
});

describe("artists", () => {
  it("anyone can read artists", async () => {
    const db = unauthed();
    await assertSucceeds(getDoc(doc(db, "artists", "a1")));
  });

  it("non-admin cannot write artists", async () => {
    const db = authed("user1");
    await assertFails(setDoc(doc(db, "artists", "a1"), { name: "hack" }));
  });
});

describe("user playlists", () => {
  it("owner can create a playlist", async () => {
    const db = authed("user1");
    await assertSucceeds(
      setDoc(doc(db, "users", "user1", "playlists", "p1"), {
        name: "My Playlist",
        schemaVersion: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("other user cannot read another's playlist", async () => {
    const db = authed("user2");
    await assertFails(getDoc(doc(db, "users", "user1", "playlists", "p1")));
  });

  it("owner can delete own playlist", async () => {
    const ownerDb = authed("user1");
    await setDoc(doc(ownerDb, "users", "user1", "playlists", "p1"), {
      name: "List",
      schemaVersion: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(deleteDoc(doc(ownerDb, "users", "user1", "playlists", "p1")));
  });

  it("non-owner cannot delete", async () => {
    const ownerDb = authed("user1");
    await setDoc(doc(ownerDb, "users", "user1", "playlists", "p1"), {
      name: "List",
      schemaVersion: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const otherDb = authed("user2");
    await assertFails(deleteDoc(doc(otherDb, "users", "user1", "playlists", "p1")));
  });
});

describe("playlist items", () => {
  it("owner can add item to own playlist", async () => {
    const db = authed("user1");
    await setDoc(doc(db, "users", "user1", "playlists", "p1"), {
      name: "List",
      schemaVersion: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(
      addDoc(collection(db, "users", "user1", "playlists", "p1", "items"), {
        order: 0,
        songId: "s1",
        title: "Song",
        artistSlug: "artist",
        songSlug: "song",
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("other user cannot add item", async () => {
    const otherDb = authed("user2");
    await assertFails(
      addDoc(collection(otherDb, "users", "user1", "playlists", "p1", "items"), {
        order: 0,
        songId: "s1",
        title: "Song",
        artistSlug: "artist",
        songSlug: "song",
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe("songOverrides", () => {
  it("owner can create songOverride", async () => {
    const db = authed("user1");
    await assertSucceeds(
      setDoc(doc(db, "users", "user1", "songOverrides", "s1"), {
        songId: "s1",
        transposeSemitones: 3,
        schemaVersion: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("other user cannot read songOverride", async () => {
    const db = authed("user2");
    await assertFails(getDoc(doc(db, "users", "user1", "songOverrides", "s1")));
  });

  it("admin can read any songOverride", async () => {
    const ownerDb = authed("user1");
    await setDoc(doc(ownerDb, "users", "user1", "songOverrides", "s1"), {
      songId: "s1",
      transposeSemitones: 3,
      schemaVersion: 1,
      updatedAt: serverTimestamp(),
    });
    const adminDb = admin();
    await assertSucceeds(getDoc(doc(adminDb, "users", "user1", "songOverrides", "s1")));
  });
});

describe("contributions", () => {
  it("signed-in user can create with own uid and pending status", async () => {
    const db = authed("user1");
    await assertSucceeds(
      addDoc(collection(db, "contributions"), {
        contributorUid: "user1",
        status: "pending",
        songTitle: "My Song",
      }),
    );
  });

  it("cannot create contribution with different uid", async () => {
    const db = authed("user1");
    await assertFails(
      addDoc(collection(db, "contributions"), {
        contributorUid: "someone-else",
        status: "pending",
        songTitle: "My Song",
      }),
    );
  });

  it("cannot create contribution with non-pending status", async () => {
    const db = authed("user1");
    await assertFails(
      addDoc(collection(db, "contributions"), {
        contributorUid: "user1",
        status: "approved",
        songTitle: "My Song",
      }),
    );
  });

  it("unsigned user cannot read contributions", async () => {
    const db = unauthed();
    await assertFails(getDoc(doc(db, "contributions", "c1")));
  });
});

describe("catch-all deny", () => {
  it("denies access to unknown collections", async () => {
    const db = authed("user1");
    await assertFails(getDoc(doc(db, "secret_collection", "doc1")));
    await assertFails(setDoc(doc(db, "secret_collection", "doc1"), { data: "hack" }));
  });

  it("admin_audit is read-only for admin, no writes", async () => {
    const adminDb = admin();
    await assertSucceeds(getDoc(doc(adminDb, "admin_audit", "log1")));
    await assertFails(setDoc(doc(adminDb, "admin_audit", "log1"), { data: "x" }));
  });
});
