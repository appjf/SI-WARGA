import "server-only";
import { adminDb } from "./admin";
import { FieldValue } from "firebase-admin/firestore";

export interface AuditLogEntry {
  actorUid: string;
  action: string;
  entityType: string;
  entityId: string;
  result: "SUCCESS" | "FAILURE" | "UNAUTHORIZED";
  metadata?: Record<string, any>;
  requestId?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      return;
    }
    const logRef = adminDb.collection("auditLogs").doc();
    await logRef.set({
      eventId: logRef.id,
      actorUid: entry.actorUid || "system",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      result: entry.result,
      metadata: entry.metadata || {},
      requestId: entry.requestId || "",
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Failed to create audit log:", error);
    }
  }
}

export async function getUserProfile(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  return doc.exists ? doc.data() : null;
}

export async function upsertUserProfile(uid: string, data: Record<string, any>) {
  const ref = adminDb.collection("users").doc(uid);
  await ref.set(
    {
      uid,
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
