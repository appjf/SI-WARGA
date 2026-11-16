import { z } from "zod";

export const contactSchema = z.object({
  phone: z.string().min(8).max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  waNumber: z.string().min(8).max(20).optional().or(z.literal("")),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  relation: z.string().min(2).max(50).optional(),
  phone: z.string().min(8).max(20).optional(),
});

export const createResidentSchema = z.object({
  fullName: z.string().min(2, "Full name must have at least 2 characters").max(100),
  houseId: z.string().min(1, "houseId is required").max(50),
  nik: z.string().regex(/^\d{16}$/, "NIK must be exactly 16 digits").optional().or(z.literal("")),
  gender: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD required").optional().or(z.literal("")),
  birthPlace: z.string().max(100).optional().or(z.literal("")),
  religion: z.enum(["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "LAINNYA"]).optional(),
  maritalStatus: z.enum(["BELUM_KAWIN", "KAWIN", "CERAI_HIDUP", "CERAI_MATI"]).optional(),
  occupation: z.string().max(100).optional().or(z.literal("")),
  familyRole: z.enum(["KEPALA_KELUARGA", "ISTRI", "ANAK", "FAMILI_LAIN"]).default("KEPALA_KELUARGA"),
  isHeadOfFamily: z.boolean().default(false),
  contact: contactSchema.default({}),
  emergencyContact: emergencyContactSchema.optional(),
});

export const updateResidentSchema = createResidentSchema.partial();

export const listResidentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  houseId: z.string().optional(),
  search: z.string().max(100).optional(),
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
export type ListResidentsQuery = z.infer<typeof listResidentsQuerySchema>;
