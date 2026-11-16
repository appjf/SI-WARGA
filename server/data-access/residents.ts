import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { CreateResidentInput, UpdateResidentInput, ListResidentsQuery } from "@/server/validation/residents";

export interface ResidentDocument extends CreateResidentInput {
  residentId: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  verificationStatus: "verified" | "pending" | "unverified";
}

export async function checkHouseholdExists(houseId: string): Promise<boolean> {
  if (!houseId) return false;
  try {
    const doc = await adminDb.collection("households").doc(houseId).get();
    return doc.exists;
  } catch (error) {
    console.warn(`Error checking household ${houseId}:`, error);
    return false;
  }
}

export async function getResidentById(residentId: string): Promise<ResidentDocument | null> {
  const doc = await adminDb.collection("residents").doc(residentId).get();
  if (!doc.exists) return null;
  return { residentId: doc.id, ...doc.data() } as ResidentDocument;
}

export async function getResidentByUid(uid: string): Promise<ResidentDocument | null> {
  const snapshot = await adminDb.collection("residents").where("uid", "==", uid).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { residentId: doc.id, ...doc.data() } as ResidentDocument;
}

export async function listResidents(params: ListResidentsQuery): Promise<{ items: ResidentDocument[]; count: number }> {
  let query = adminDb.collection("residents").orderBy("createdAt", "desc");

  if (params.houseId) {
    query = query.where("houseId", "==", params.houseId);
  }

  query = query.limit(params.limit || 20);

  if (params.cursor) {
    const cursorDoc = await adminDb.collection("residents").doc(params.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const items = snapshot.docs.map((doc) => ({
    residentId: doc.id,
    ...doc.data(),
  })) as ResidentDocument[];

  // Filter in-memory search if specified
  const filtered = params.search
    ? items.filter((item) =>
        item.fullName?.toLowerCase().includes(params.search!.toLowerCase())
      )
    : items;

  return {
    items: filtered,
    count: filtered.length,
  };
}

export async function createResident(
  input: CreateResidentInput,
  actorUid: string
): Promise<ResidentDocument> {
  const docRef = adminDb.collection("residents").doc();
  const newResident: ResidentDocument = {
    ...input,
    residentId: docRef.id,
    verificationStatus: "verified",
    createdBy: actorUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(newResident);
  return newResident;
}

export async function updateResident(
  residentId: string,
  input: UpdateResidentInput,
  actorUid: string
): Promise<ResidentDocument | null> {
  const docRef = adminDb.collection("residents").doc(residentId);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  const updateData = {
    ...input,
    updatedBy: actorUid,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.update(updateData);
  const updatedDoc = await docRef.get();
  return { residentId: updatedDoc.id, ...updatedDoc.data() } as ResidentDocument;
}
