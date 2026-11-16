import { z } from "zod";

export const createHouseholdSchema = z.object({
  houseId: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "houseId hanya boleh huruf, angka, '-' dan '_'")
    .optional(),
  houseCode: z.string().min(3, "Kode rumah minimal 3 karakter").max(30),
  blockName: z.string().min(1, "Nama blok wajib diisi").max(40),
  addressLabel: z.string().min(3, "Alamat unit wajib diisi").max(200),
  occupancyStatus: z.enum(["OCCUPIED", "VACANT", "RENTED"]).default("OCCUPIED"),
  headResidentName: z.string().max(100).optional(),
});

export const updateHouseholdSchema = createHouseholdSchema.partial();

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
