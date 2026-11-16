import { z } from "zod";

export const notificationTypeEnum = z.enum([
  "BILLING",
  "COMPLAINT",
  "ANNOUNCEMENT",
  "APPROVAL",
  "SYSTEM",
]);

export const createNotificationSchema = z.object({
  recipientUid: z.string().min(1, "recipientUid is required"), // Specific user UID, or 'ALL_WARGA', 'ALL_PENGURUS'
  title: z.string().min(3).max(100),
  message: z.string().min(5).max(500),
  type: notificationTypeEnum.default("SYSTEM"),
  link: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  unreadOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
