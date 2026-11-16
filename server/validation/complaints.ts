import { z } from "zod";

export const complaintCategoryEnum = z.enum([
  "INFRASTRUKTUR",
  "KEAMANAN",
  "KEBERSIHAN",
  "SOSIAL",
  "FASILITAS_UMUM",
  "LAINNYA",
]);

export const complaintPriorityEnum = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export const complaintStatusEnum = z.enum([
  "SUBMITTED",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
]);

export const createComplaintSchema = z.object({
  category: complaintCategoryEnum.or(z.string().min(2).max(50)),
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(5, "Description must be at least 5 characters").max(2000),
  priority: complaintPriorityEnum.default("NORMAL"),
  spatialId: z.string().max(100).optional().nullable(),
  locationDescription: z.string().max(250).optional().default(""),
});

export const updateComplaintStatusSchema = z
  .object({
    status: complaintStatusEnum,
    notes: z.string().max(1000).optional(),
    assignedTo: z.string().max(100).optional(),
    officerName: z.string().max(100).optional(),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.status === "ASSIGNED") {
        return !!data.assignedTo && data.assignedTo.trim().length > 0;
      }
      return true;
    },
    {
      message: "assignedTo (officer UID or designation) is required when transitioning to ASSIGNED",
      path: ["assignedTo"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "REJECTED") {
        return !!data.rejectionReason && data.rejectionReason.trim().length >= 5;
      }
      return true;
    },
    {
      message: "rejectionReason with at least 5 characters is required when rejecting a complaint",
      path: ["rejectionReason"],
    }
  );

export const listComplaintsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  status: complaintStatusEnum.optional(),
  category: z.string().optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusSchema>;
export type ListComplaintsQuery = z.infer<typeof listComplaintsQuerySchema>;
export type ComplaintStatus = z.infer<typeof complaintStatusEnum>;
