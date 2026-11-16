import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createAuditLog } from "@/lib/firebase/admin-firestore";
import { convertEpsg4326ToUtm48S } from "@/lib/formatters";
import {
  CreateSpatialAssetInput,
  UpdateSpatialAssetInput,
} from "@/server/validation/spatial-assets";
import type {
  SpatialAssetRecord,
  SpatialLayerType,
  AssetInspectionEntry,
  AssetChangeLogEntry,
} from "@/types";

export class SpatialAssetError extends Error {
  public code: string;
  constructor(message: string, code: string = "SPATIAL_ASSET_ERROR") {
    super(message);
    this.name = "SpatialAssetError";
    this.code = code;
  }
}

export async function listSpatialAssets(filters?: {
  layerType?: SpatialLayerType;
  condition?: string;
  search?: string;
}): Promise<{ items: SpatialAssetRecord[]; count: number }> {
  const snapshot = await adminDb
    .collection("spatialAssets")
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  let items = snapshot.docs.map((doc) => ({
    assetId: doc.id,
    ...doc.data(),
  })) as SpatialAssetRecord[];

  if (filters?.layerType) {
    items = items.filter((a) => a.layerType === filters.layerType);
  }
  if (filters?.condition) {
    items = items.filter((a) => a.condition === filters.condition);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.assetCode?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.picName?.toLowerCase().includes(q)
    );
  }

  return { items, count: items.length };
}

export async function getSpatialAssetById(
  assetId: string
): Promise<SpatialAssetRecord | null> {
  const doc = await adminDb.collection("spatialAssets").doc(assetId).get();
  if (!doc.exists) return null;
  return { assetId: doc.id, ...doc.data() } as SpatialAssetRecord;
}

export async function createSpatialAsset(
  input: CreateSpatialAssetInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<SpatialAssetRecord> {
  const docRef = adminDb.collection("spatialAssets").doc();
  const utm = convertEpsg4326ToUtm48S(input.longitude, input.latitude);
  const nowIso = new Date().toISOString();

  const geometry = input.geometry ?? {
    type: "Point" as const,
    coordinates: [input.longitude, input.latitude],
  };

  const initialChange: AssetChangeLogEntry = {
    changedAt: nowIso,
    changedBy: actorUid,
    summary: `Aset spasial ${input.assetCode} (${input.name}) didaftarkan pada koordinat ${input.longitude.toFixed(6)}, ${input.latitude.toFixed(6)} (EPSG:4326).`,
  };

  const record: SpatialAssetRecord = {
    assetId: docRef.id,
    assetCode: input.assetCode,
    name: input.name,
    layerType: input.layerType,
    category: input.category,
    subCategory: input.subCategory || "",
    coordinates: {
      longitude: input.longitude,
      latitude: input.latitude,
      srid: 4326,
      utmEasting: utm.easting,
      utmNorthing: utm.northing,
      utmZone: "48S",
    },
    geometry,
    condition: input.condition,
    acquisitionYear: input.acquisitionYear,
    assetValueIdr: input.assetValueIdr,
    picName: input.picName,
    picContact: input.picContact || "",
    photoUrl: input.photoUrl || "",
    photoCaption: input.photoCaption || "",
    operationalStatus: input.operationalStatus,
    inspectionHistory: [],
    changeHistory: [initialChange],
    notes: input.notes || "",
    createdBy: actorUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(record);

  await createAuditLog({
    actorUid,
    action: "CREATE_SPATIAL_ASSET",
    entityType: "spatial_asset",
    entityId: docRef.id,
    result: "SUCCESS",
    metadata: {
      assetCode: input.assetCode,
      layerType: input.layerType,
      srid: 4326,
      utmZone: "48S",
    },
    requestId,
  });

  return record;
}

export async function updateSpatialAsset(
  assetId: string,
  input: UpdateSpatialAssetInput,
  actorUid: string,
  actorName: string,
  requestId: string = crypto.randomUUID()
): Promise<SpatialAssetRecord | null> {
  const docRef = adminDb.collection("spatialAssets").doc(assetId);
  const existingDoc = await docRef.get();
  if (!existingDoc.exists) return null;

  const existing = existingDoc.data() as SpatialAssetRecord;
  const nowIso = new Date().toISOString();

  const nextInspections: AssetInspectionEntry[] = [
    ...(existing.inspectionHistory || []),
  ];
  const nextChanges: AssetChangeLogEntry[] = [...(existing.changeHistory || [])];

  const { inspectionEntry, ...fieldUpdates } = input;

  if (inspectionEntry) {
    nextInspections.unshift({
      inspectionId: `insp-${Date.now()}`,
      inspectedAt: nowIso,
      inspectorName: actorName || actorUid,
      inspectorUid: actorUid,
      conditionAfter: inspectionEntry.conditionAfter,
      notes: inspectionEntry.notes,
      maintenanceCostIdr: inspectionEntry.maintenanceCostIdr,
    });
    fieldUpdates.condition = inspectionEntry.conditionAfter;
    nextChanges.unshift({
      changedAt: nowIso,
      changedBy: actorUid,
      summary: `Inspeksi lapangan dicatat: kondisi ${inspectionEntry.conditionAfter} — ${inspectionEntry.notes}`,
    });
  } else {
    nextChanges.unshift({
      changedAt: nowIso,
      changedBy: actorUid,
      summary: `Pembaruan atribut aset: ${Object.keys(fieldUpdates).join(", ")}`,
    });
  }

  await docRef.update({
    ...fieldUpdates,
    inspectionHistory: nextInspections,
    changeHistory: nextChanges.slice(0, 50),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await createAuditLog({
    actorUid,
    action: inspectionEntry ? "LOG_ASSET_INSPECTION" : "UPDATE_SPATIAL_ASSET",
    entityType: "spatial_asset",
    entityId: assetId,
    result: "SUCCESS",
    metadata: { updatedFields: Object.keys(input) },
    requestId,
  });

  const updated = await docRef.get();
  return { assetId: updated.id, ...updated.data() } as SpatialAssetRecord;
}
