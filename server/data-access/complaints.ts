import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  CreateComplaintInput,
  UpdateComplaintStatusInput,
  ListComplaintsQuery,
  ComplaintStatus,
} from "@/server/validation/complaints";
import { Role } from "@/lib/rbac/matrix";

export interface StatusHistoryEntry {
  fromStatus: ComplaintStatus;
  toStatus: ComplaintStatus;
  changedBy: string;
  timestamp: string;
  notes?: string;
  assignedTo?: string;
  officerName?: string;
  rejectionReason?: string;
}

export interface ComplaintDocument {
  ticketId: string;
  reporterId: string;
  category: string;
  title?: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: ComplaintStatus;
  spatialId?: string | null;
  locationDescription?: string;
  assignedTo?: string;
  officerName?: string;
  rejectionReason?: string;
  resolvedAt?: any;
  closedAt?: any;
  statusHistory: StatusHistoryEntry[];
  createdAt: any;
  updatedAt: any;
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateTransitionError";
  }
}

export class UnauthorizedTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedTransitionError";
  }
}

// State machine definition: defines allowable forward and rejection transitions
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ["VERIFIED", "REJECTED"],
  VERIFIED: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"], // Warga can close, or return to IN_PROGRESS if issue persists
  CLOSED: [], // Terminal state
  REJECTED: [], // Terminal state
};

export async function getComplaintById(ticketId: string): Promise<ComplaintDocument | null> {
  const doc = await adminDb.collection("complaints").doc(ticketId).get();
  if (!doc.exists) return null;
  return { ticketId: doc.id, ...doc.data() } as ComplaintDocument;
}

export async function listComplaints(
  params: ListComplaintsQuery,
  filterReporterId?: string
): Promise<{ items: ComplaintDocument[]; count: number }> {
  let query = adminDb.collection("complaints").orderBy("createdAt", "desc");

  if (filterReporterId) {
    query = query.where("reporterId", "==", filterReporterId);
  }

  if (params.status) {
    query = query.where("status", "==", params.status);
  }

  if (params.category) {
    query = query.where("category", "==", params.category);
  }

  query = query.limit(params.limit || 20);

  if (params.cursor) {
    const cursorDoc = await adminDb.collection("complaints").doc(params.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const items = snapshot.docs.map((doc) => ({
    ticketId: doc.id,
    ...doc.data(),
  })) as ComplaintDocument[];

  return {
    items,
    count: items.length,
  };
}

export async function createComplaint(
  input: CreateComplaintInput,
  reporterId: string
): Promise<ComplaintDocument> {
  const docRef = adminDb.collection("complaints").doc();
  const now = new Date().toISOString();

  const initialHistory: StatusHistoryEntry = {
    fromStatus: "SUBMITTED",
    toStatus: "SUBMITTED",
    changedBy: reporterId,
    timestamp: now,
    notes: "Complaint submitted by resident",
  };

  const complaint: ComplaintDocument = {
    ticketId: docRef.id,
    reporterId,
    category: input.category,
    title: input.title || `Pengaduan #${docRef.id.slice(0, 8)}`,
    description: input.description,
    priority: input.priority,
    status: "SUBMITTED",
    spatialId: input.spatialId || null,
    locationDescription: input.locationDescription || "",
    statusHistory: [initialHistory],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(complaint);
  return complaint;
}

/**
 * Executes complaint status transition using Firestore transaction.
 * Enforces state machine rules and actor authorization.
 */
export async function executeComplaintStatusTransition(
  ticketId: string,
  input: UpdateComplaintStatusInput,
  actorUid: string,
  actorRoles: Role[]
): Promise<ComplaintDocument> {
  const docRef = adminDb.collection("complaints").doc(ticketId);

  return await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw new Error(`Complaint with ticket ID [${ticketId}] not found.`);
    }

    const current = doc.data() as ComplaintDocument;
    const fromStatus = current.status;
    const toStatus = input.status;

    // Validate state machine allowable transitions
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new InvalidStateTransitionError(
        `Illegal state transition from [${fromStatus}] to [${toStatus}]. Allowed next states: ${
          allowed.length ? allowed.join(", ") : "None (terminal state)"
        }`
      );
    }

    // Role-based Transition Permission Enforcement:
    const isSuperAdmin = actorRoles.includes("SUPER_ADMIN");
    const isAdminRw = actorRoles.includes("ADMIN_RW");
    const isKetuaRt = actorRoles.includes("KETUA_RT");
    const isSekretarisRt = actorRoles.includes("SEKRETARIS_RT");
    const isPengurus = actorRoles.includes("PENGURUS");
    const isOfficer = isSuperAdmin || isAdminRw || isKetuaRt || isSekretarisRt || isPengurus;
    const isReporter = current.reporterId === actorUid;

    // Check transition-specific authorization
    if (toStatus === "CLOSED") {
      // Warga who reported the issue can close it once resolved, or Ketua/Admin
      if (!isReporter && !isKetuaRt && !isSuperAdmin && !isAdminRw) {
        throw new UnauthorizedTransitionError(
          "Only the reporting resident, Ketua RT, or Admin can close a resolved complaint."
        );
      }
    } else if (toStatus === "VERIFIED" || toStatus === "ASSIGNED" || toStatus === "IN_PROGRESS" || toStatus === "RESOLVED") {
      if (!isOfficer) {
        throw new UnauthorizedTransitionError(
          `Only designated community officials can transition complaints to [${toStatus}].`
        );
      }
    } else if (toStatus === "REJECTED") {
      if (!isOfficer) {
        throw new UnauthorizedTransitionError("Only community officials can reject complaints.");
      }
    }

    const now = new Date().toISOString();
    const historyEntry: StatusHistoryEntry = {
      fromStatus,
      toStatus,
      changedBy: actorUid,
      timestamp: now,
      notes: input.notes || "",
      assignedTo: input.assignedTo,
      officerName: input.officerName,
      rejectionReason: input.rejectionReason,
    };

    const updates: Partial<ComplaintDocument> = {
      status: toStatus,
      updatedAt: FieldValue.serverTimestamp(),
      statusHistory: [...(current.statusHistory || []), historyEntry],
    };

    if (toStatus === "ASSIGNED") {
      updates.assignedTo = input.assignedTo;
      if (input.officerName) updates.officerName = input.officerName;
    } else if (toStatus === "REJECTED") {
      updates.rejectionReason = input.rejectionReason;
    } else if (toStatus === "RESOLVED") {
      updates.resolvedAt = FieldValue.serverTimestamp();
    } else if (toStatus === "CLOSED") {
      updates.closedAt = FieldValue.serverTimestamp();
    }

    transaction.update(docRef, updates);

    return {
      ...current,
      ...updates,
      status: toStatus,
    };
  });
}
