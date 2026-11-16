import "server-only";
import { Role } from "@/lib/rbac/matrix";
import {
  CreateResidentInput,
  UpdateResidentInput,
  ListResidentsQuery,
} from "@/server/validation/residents";
import {
  ResidentDocument,
  checkHouseholdExists,
  createResident as repoCreateResident,
  getResidentById as repoGetResidentById,
  getResidentByUid as repoGetResidentByUid,
  listResidents as repoListResidents,
  updateResident as repoUpdateResident,
} from "@/server/data-access/residents";
import { createAuditLog } from "@/lib/firebase/admin-firestore";

export class ResidentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResidentValidationError";
  }
}

export class ResidentForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResidentForbiddenError";
  }
}

/**
 * Masks Personally Identifiable Information (PII) based on role privileges.
 * - Full PII: SUPER_ADMIN, ADMIN_RW, KETUA_RT, SEKRETARIS_RT, or own profile
 * - Partial Masked PII: BENDAHARA_RT, PENGURUS
 * - Non-authorized / WARGA (other): PII completely stripped
 */
export function filterResidentPII(
  resident: ResidentDocument,
  callerRoles: Role[],
  callerUid: string,
  callerResidentId?: string
): Partial<ResidentDocument> {
  const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
  const isAdminRw = callerRoles.includes("ADMIN_RW");
  const isKetuaRt = callerRoles.includes("KETUA_RT");
  const isSekretarisRt = callerRoles.includes("SEKRETARIS_RT");
  const isFullAccess = isSuperAdmin || isAdminRw || isKetuaRt || isSekretarisRt;

  const isOwnProfile =
    (resident.residentId && resident.residentId === callerResidentId) ||
    ((resident as any).uid && (resident as any).uid === callerUid) ||
    (resident.createdBy && resident.createdBy === callerUid);

  if (isFullAccess || isOwnProfile) {
    return resident;
  }

  const isFinancialOrStaff = callerRoles.includes("BENDAHARA_RT") || callerRoles.includes("PENGURUS");

  if (isFinancialOrStaff) {
    const rawNik = resident.nik || "";
    const maskedNik = rawNik.length === 16 ? `${rawNik.slice(0, 6)}******${rawNik.slice(12)}` : "****************";
    const rawPhone = resident.contact?.phone || "";
    const maskedPhone = rawPhone.length > 6 ? `${rawPhone.slice(0, 4)}****${rawPhone.slice(-2)}` : "****";

    return {
      residentId: resident.residentId,
      fullName: resident.fullName,
      houseId: resident.houseId,
      familyRole: resident.familyRole,
      isHeadOfFamily: resident.isHeadOfFamily,
      verificationStatus: resident.verificationStatus,
      nik: maskedNik,
      contact: {
        phone: maskedPhone,
        email: resident.contact?.email ? "******@masked.ggr" : "",
        waNumber: maskedPhone,
      },
      createdAt: resident.createdAt,
    };
  }

  // Fallback for regular WARGA querying other residents: public directory view only
  return {
    residentId: resident.residentId,
    fullName: resident.fullName,
    houseId: resident.houseId,
    familyRole: resident.familyRole,
    verificationStatus: resident.verificationStatus,
  };
}

export async function registerNewResident(
  input: CreateResidentInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<ResidentDocument> {
  // Validate that the household exists in RT 06 RW 01
  const householdExists = await checkHouseholdExists(input.houseId);
  if (!householdExists) {
    throw new ResidentValidationError(
      `Household with ID [${input.houseId}] does not exist in Green Garden Residence RT 06 RW 01.`
    );
  }

  const resident = await repoCreateResident(input, actorUid);

  await createAuditLog({
    actorUid,
    action: "CREATE_RESIDENT",
    entityType: "resident",
    entityId: resident.residentId,
    result: "SUCCESS",
    metadata: {
      fullName: resident.fullName,
      houseId: resident.houseId,
      familyRole: resident.familyRole,
    },
    requestId,
  });

  return resident;
}

export async function fetchResidents(
  query: ListResidentsQuery,
  callerRoles: Role[],
  callerUid: string,
  callerResidentId?: string
): Promise<{ items: Partial<ResidentDocument>[]; count: number }> {
  const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
  const isAdminRw = callerRoles.includes("ADMIN_RW");
  const isKetuaRt = callerRoles.includes("KETUA_RT");
  const isSekretarisRt = callerRoles.includes("SEKRETARIS_RT");
  const isBendahara = callerRoles.includes("BENDAHARA_RT");
  const isPengurus = callerRoles.includes("PENGURUS");
  const hasStaffAccess = isSuperAdmin || isAdminRw || isKetuaRt || isSekretarisRt || isBendahara || isPengurus;

  // Regular WARGA: restricted to own profile or family members only
  if (!hasStaffAccess) {
    if (callerResidentId) {
      const ownRecord = await repoGetResidentById(callerResidentId);
      if (ownRecord) {
        return { items: [filterResidentPII(ownRecord, callerRoles, callerUid, callerResidentId)], count: 1 };
      }
    }

    const ownByUid = await repoGetResidentByUid(callerUid);
    if (ownByUid) {
      return { items: [filterResidentPII(ownByUid, callerRoles, callerUid, callerResidentId)], count: 1 };
    }

    return { items: [], count: 0 };
  }

  const result = await repoListResidents(query);
  const filtered = result.items.map((res) => filterResidentPII(res, callerRoles, callerUid, callerResidentId));

  return {
    items: filtered,
    count: filtered.length,
  };
}

export async function fetchResidentById(
  residentId: string,
  callerRoles: Role[],
  callerUid: string,
  callerResidentId?: string
): Promise<Partial<ResidentDocument> | null> {
  const resident = await repoGetResidentById(residentId);
  if (!resident) return null;

  const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
  const isAdminRw = callerRoles.includes("ADMIN_RW");
  const isKetuaRt = callerRoles.includes("KETUA_RT");
  const isSekretarisRt = callerRoles.includes("SEKRETARIS_RT");
  const isBendahara = callerRoles.includes("BENDAHARA_RT");
  const isPengurus = callerRoles.includes("PENGURUS");
  const hasStaffAccess = isSuperAdmin || isAdminRw || isKetuaRt || isSekretarisRt || isBendahara || isPengurus;

  const isOwnProfile =
    residentId === callerResidentId ||
    (resident as any).uid === callerUid ||
    resident.createdBy === callerUid;

  if (!hasStaffAccess && !isOwnProfile) {
    throw new ResidentForbiddenError("Forbidden: You are not authorized to view this resident's profile.");
  }

  return filterResidentPII(resident, callerRoles, callerUid, callerResidentId);
}

export async function modifyResident(
  residentId: string,
  input: UpdateResidentInput,
  actorUid: string,
  actorRoles: Role[],
  requestId: string = crypto.randomUUID()
): Promise<Partial<ResidentDocument>> {
  if (input.houseId) {
    const householdExists = await checkHouseholdExists(input.houseId);
    if (!householdExists) {
      throw new ResidentValidationError(
        `Household with ID [${input.houseId}] does not exist in RT 06 RW 01.`
      );
    }
  }

  const updated = await repoUpdateResident(residentId, input, actorUid);
  if (!updated) {
    throw new ResidentValidationError(`Resident with ID [${residentId}] not found.`);
  }

  await createAuditLog({
    actorUid,
    action: "UPDATE_RESIDENT",
    entityType: "resident",
    entityId: residentId,
    result: "SUCCESS",
    metadata: { updatedFields: Object.keys(input) },
    requestId,
  });

  return filterResidentPII(updated, actorRoles, actorUid);
}
