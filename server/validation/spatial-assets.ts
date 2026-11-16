import { z } from "zod";

export const spatialLayerTypeEnum = z.enum([
  "boundaries",
  "houses",
  "roads",
  "drainage",
  "facilities",
  "assets",
]);

export const assetConditionEnum = z.enum(["GOOD", "FAIR", "POOR", "CRITICAL"]);
export const operationalStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED"]);

export const createSpatialAssetSchema = z.object({
  assetCode: z.string().min(3, "Kode aset minimal 3 karakter").max(40),
  name: z.string().min(3, "Nama aset minimal 3 karakter").max(120),
  layerType: spatialLayerTypeEnum,
  category: z.string().min(2).max(60),
  subCategory: z.string().max(60).optional().default(""),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  geometry: z
    .object({
      type: z.enum(["Point", "LineString", "MultiLineString", "Polygon"]),
      coordinates: z.any(),
    })
    .optional(),
  condition: assetConditionEnum.default("GOOD"),
  acquisitionYear: z.number().int().min(1980).max(2035),
  assetValueIdr: z.number().int().min(0, "Nilai aset harus integer Rupiah >= 0"),
  picName: z.string().min(2, "Penanggung jawab wajib diisi").max(100),
  picContact: z.string().max(30).optional().default(""),
  photoUrl: z.string().max(500).optional().default(""),
  photoCaption: z.string().max(200).optional().default(""),
  operationalStatus: operationalStatusEnum.default("ACTIVE"),
  notes: z.string().max(1000).optional().default(""),
});

export const updateSpatialAssetSchema = z.object({
  name: z.string().min(3).max(120).optional(),
  category: z.string().min(2).max(60).optional(),
  condition: assetConditionEnum.optional(),
  assetValueIdr: z.number().int().min(0).optional(),
  picName: z.string().min(2).max(100).optional(),
  picContact: z.string().max(30).optional(),
  photoUrl: z.string().max(500).optional(),
  photoCaption: z.string().max(200).optional(),
  operationalStatus: operationalStatusEnum.optional(),
  notes: z.string().max(1000).optional(),
  inspectionEntry: z
    .object({
      conditionAfter: assetConditionEnum,
      notes: z.string().min(3, "Catatan inspeksi minimal 3 karakter").max(500),
      maintenanceCostIdr: z.number().int().min(0).optional(),
    })
    .optional(),
});

export type CreateSpatialAssetInput = z.infer<typeof createSpatialAssetSchema>;
export type UpdateSpatialAssetInput = z.infer<typeof updateSpatialAssetSchema>;
