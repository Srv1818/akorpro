/**
 * Admin audit log — Firestore-backed skeleton.
 *
 * Writes to `admin_audit/{auto-id}` on critical admin actions:
 * - Song/artist CRUD
 * - Bulk import
 * - User role changes
 *
 * Collection is admin-write-only (Firestore Rules).
 * Reads are limited to admin dashboard (future Faz 6).
 */

import admin from "firebase-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface AuditEntry {
  actorUid: string;
  action: string;
  targetCollection: string;
  targetDocId: string;
  details?: Record<string, unknown>;
  createdAt: FirebaseFirestore.FieldValue;
}

function stripUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = stripUndefinedDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return value === undefined ? undefined : value;
}

export async function writeAuditLog(
  actorUid: string,
  action: string,
  targetCollection: string,
  targetDocId: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;

  const entry: AuditEntry = {
    actorUid,
    action,
    targetCollection,
    targetDocId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const cleanedDetails = stripUndefinedDeep(details);
  if (cleanedDetails && typeof cleanedDetails === "object") {
    entry.details = cleanedDetails as Record<string, unknown>;
  }

  try {
    await db.collection("admin_audit").add(entry);
  } catch (err) {
    console.error("[audit-log] write failed:", err);
  }
}
