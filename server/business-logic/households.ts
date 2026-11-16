import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createAuditLog } from "@/lib/firebase/admin-firestore";
import { CreateHouseholdInput, UpdateHouseholdInput } from "@/server/validation/households";
import type { HouseholdRecord } from "@/types";
import type { Role } from "@/lib/rbac/matrix";

export class HouseholdError extends Error {
  public code: string;
  constructor(message: string, code: string = "HOUSEHOLD_ERROR") {
    super(message);
    this.name = "HouseholdError";
    this.code = code;
  }
}

export async function listHouseholds(
  callerRoles: Role[],
  callerHouseId?: string | null,
  search?: string
): Promise<{ items: HouseholdRecord[]; count: number }> {
  const isStaff = callerRoles.some((r) =>
    ["SUPER_ADMIN", "ADMIN_RW", "KETUA_RT", "SEKRETARIS_RT", "BENDAHARA_RT", "PENGURUS"].includes(r)
  );

  if (!isStaff) {
    if (!callerHouseId) {
      return { items: [], count: 0 };
    }
    const ownDoc = await adminDb.collection("households").doc(callerHouseId).get();
    if (!ownDoc.exists) {
      return { items: [], count: 0 };
    }
    const item = { houseId: ownDoc.id, ...ownDoc.data() } as HouseholdRecord;
    return { items: [item], count: 1 };
  }

  const snapshot = await adminDb
    .collection("households")
    .orderBy("houseCode", "asc")
    .limit(100)
    .get();

  let items = snapshot.docs.map((doc) => ({
    houseId: doc.id,
    ...doc.data(),
  })) as HouseholdRecord[];

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (h) =>
        h.houseCode?.toLowerCase().includes(q) ||
        h.blockName?.toLowerCase().includes(q) ||
        h.addressLabel?.toLowerCase().includes(q) ||
        h.headResidentName?.toLowerCase().includes(q)
    );
  }

  return { items, count: items.length };
}

export async function getHouseholdById(houseId: string): Promise<HouseholdRecord | null> {
  const doc = await adminDb.collection("households").doc(houseId).get();
  if (!doc.exists) return null;
  return { houseId: doc.id, ...doc.data() } as HouseholdRecord;
}

export async function createHousehold(
  input: CreateHouseholdInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<HouseholdRecord> {
  const docId =
    input.houseId ||
    `house-${input.houseCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const docRef = adminDb.collection("households").doc(docId);

  const existing = await docRef.get();
  if (existing.exists) {
    throw new HouseholdError(
      `Rumah tangga dengan ID [${docId}] sudah terdaftar.`,
      "HOUSEHOLD_ALREADY_EXISTS"
    );
  }

  const record: HouseholdRecord = {
    houseId: docId,
    houseCode: input.houseCode,
    blockName: input.blockName,
    addressLabel: input.addressLabel,
    occupancyStatus: input.occupancyStatus,
    headResidentName: input.headResidentName || "",
    memberCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(record);

  await createAuditLog({
    actorUid,
    action: "CREATE_HOUSEHOLD",
    entityType: "household",
    entityId: docId,
    result: "SUCCESS",
    metadata: { houseCode: input.houseCode, blockName: input.blockName },
    requestId,
  });

  return record;
}

export async function updateHousehold(
  houseId: string,
  input: UpdateHouseholdInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<HouseholdRecord | null> {
  const docRef = adminDb.collection("households").doc(houseId);
  const existing = await docRef.get();
  if (!existing.exists) return null;

  await docRef.update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorUid,
  });

  await createAuditLog({
    actorUid,
    action: "UPDATE_HOUSEHOLD",
    entityType: "household",
    entityId: houseId,
    result: "SUCCESS",
    metadata: { updatedFields: Object.keys(input) },
    requestId,
  });

  const updated = await docRef.get();
  return { houseId: updated.id, ...updated.data() } as HouseholdRecord;
}
