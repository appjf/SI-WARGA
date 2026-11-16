import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(4, "Judul pengumuman minimal 4 karakter").max(150),
  content: z.string().min(10, "Isi pengumuman minimal 10 karakter").max(3000),
  category: z.enum(["KEGIATAN", "KEUANGAN", "KEAMANAN", "INFRASTRUKTUR", "UMUM"]).default("UMUM"),
  audience: z.enum(["ALL_WARGA", "PENGURUS_ONLY"]).default("ALL_WARGA"),
  isPinned: z.boolean().default(false),
  broadcastNotification: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
