import "server-only";
import { Role } from "@/lib/rbac/matrix";
import {
  CreateComplaintInput,
  UpdateComplaintStatusInput,
  ListComplaintsQuery,
} from "@/server/validation/complaints";
import {
  ComplaintDocument,
  createComplaint as repoCreateComplaint,
  getComplaintById as repoGetComplaintById,
  listComplaints as repoListComplaints,
  executeComplaintStatusTransition,
  InvalidStateTransitionError,
  UnauthorizedTransitionError,
} from "@/server/data-access/complaints";
import { createNotification } from "@/server/data-access/notifications";
import { createAuditLog } from "@/lib/firebase/admin-firestore";

export { InvalidStateTransitionError, UnauthorizedTransitionError };

export class ComplaintValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComplaintValidationError";
  }
}

export async function submitComplaint(
  input: CreateComplaintInput,
  reporterId: string,
  requestId: string = crypto.randomUUID()
): Promise<ComplaintDocument> {
  const complaint = await repoCreateComplaint(input, reporterId);

  await createAuditLog({
    actorUid: reporterId,
    action: "CREATE_COMPLAINT",
    entityType: "complaint",
    entityId: complaint.ticketId,
    result: "SUCCESS",
    metadata: {
      category: complaint.category,
      priority: complaint.priority,
      spatialId: complaint.spatialId,
    },
    requestId,
  });

  // Notify RT officials about new complaint
  try {
    await createNotification(
      {
        recipientUid: "ALL_PENGURUS",
        title: "Pengaduan Baru Diterima",
        message: `Pengaduan baru kategori [${complaint.category}] telah diajukan oleh warga (Tiket #${complaint.ticketId.slice(0, 8)}).`,
        type: "COMPLAINT",
        link: `/complaints/${complaint.ticketId}`,
        metadata: { ticketId: complaint.ticketId, category: complaint.category },
      },
      reporterId
    );
  } catch (notifErr) {
    console.warn("Failed to dispatch internal notification for new complaint:", notifErr);
  }

  return complaint;
}

export async function transitionComplaintStatus(
  ticketId: string,
  input: UpdateComplaintStatusInput,
  actorUid: string,
  actorRoles: Role[],
  requestId: string = crypto.randomUUID()
): Promise<ComplaintDocument> {
  const updatedComplaint = await executeComplaintStatusTransition(
    ticketId,
    input,
    actorUid,
    actorRoles
  );

  await createAuditLog({
    actorUid,
    action: "TRANSITION_COMPLAINT_STATUS",
    entityType: "complaint",
    entityId: ticketId,
    result: "SUCCESS",
    metadata: {
      newStatus: input.status,
      assignedTo: input.assignedTo,
      rejectionReason: input.rejectionReason,
      notes: input.notes,
    },
    requestId,
  });

  // Notify the reporting resident about the status change
  try {
    if (updatedComplaint.reporterId) {
      await createNotification(
        {
          recipientUid: updatedComplaint.reporterId,
          title: `Pembaruan Status Pengaduan: ${input.status}`,
          message: `Pengaduan Anda (#${ticketId.slice(0, 8)}) kini berstatus [${input.status}]. ${input.notes || ""}`,
          type: "COMPLAINT",
          link: `/complaints/${ticketId}`,
          metadata: { ticketId, status: input.status },
        },
        actorUid
      );
    }
  } catch (notifErr) {
    console.warn("Failed to notify resident of complaint status update:", notifErr);
  }

  return updatedComplaint;
}

export async function fetchComplaints(
  query: ListComplaintsQuery,
  callerRoles: Role[],
  callerUid: string
) {
  const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
  const isAdminRw = callerRoles.includes("ADMIN_RW");
  const isKetuaRt = callerRoles.includes("KETUA_RT");
  const isSekretarisRt = callerRoles.includes("SEKRETARIS_RT");
  const isPengurus = callerRoles.includes("PENGURUS");
  const hasStaffAccess = isSuperAdmin || isAdminRw || isKetuaRt || isSekretarisRt || isPengurus;

  // If caller is purely regular WARGA, restrict results to their own complaints
  const filterReporterId = hasStaffAccess ? undefined : callerUid;

  return await repoListComplaints(query, filterReporterId);
}

export async function fetchComplaintById(
  ticketId: string,
  callerRoles: Role[],
  callerUid: string
): Promise<ComplaintDocument | null> {
  const complaint = await repoGetComplaintById(ticketId);
  if (!complaint) return null;

  const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
  const isAdminRw = callerRoles.includes("ADMIN_RW");
  const isKetuaRt = callerRoles.includes("KETUA_RT");
  const isSekretarisRt = callerRoles.includes("SEKRETARIS_RT");
  const isPengurus = callerRoles.includes("PENGURUS");
  const hasStaffAccess = isSuperAdmin || isAdminRw || isKetuaRt || isSekretarisRt || isPengurus;

  // Regular Warga can only view their own complaint
  if (!hasStaffAccess && complaint.reporterId !== callerUid) {
    throw new UnauthorizedTransitionError("Forbidden: You are not authorized to view this complaint.");
  }

  return complaint;
}
