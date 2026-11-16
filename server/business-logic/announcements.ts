import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createAuditLog } from "@/lib/firebase/admin-firestore";
import { createNotification } from "@/server/data-access/notifications";
import { CreateAnnouncementInput } from "@/server/validation/announcements";
import type { AnnouncementRecord } from "@/types";
import type { Role } from "@/lib/rbac/matrix";

export async function listAnnouncements(
  callerRoles: Role[],
  category?: string
): Promise<{ items: AnnouncementRecord[]; count: number }> {
  const isStaff = callerRoles.some((r) =>
    ["SUPER_ADMIN", "ADMIN_RW", "KETUA_RT", "SEKRETARIS_RT", "BENDAHARA_RT", "PENGURUS"].includes(r)
  );

  const snapshot = await adminDb
    .collection("announcements")
    .orderBy("publishedAt", "desc")
    .limit(50)
    .get();

  let items = snapshot.docs.map((doc) => ({
    announcementId: doc.id,
    ...doc.data(),
  })) as AnnouncementRecord[];

  if (!isStaff) {
    items = items.filter((a) => a.audience === "ALL_WARGA");
  }

  if (category && category !== "ALL") {
    items = items.filter((a) => a.category === category);
  }

  // Sort pinned items first while keeping chronological order
  items.sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));

  return { items, count: items.length };
}

export async function publishAnnouncement(
  input: CreateAnnouncementInput,
  actorUid: string,
  actorName: string,
  requestId: string = crypto.randomUUID()
): Promise<AnnouncementRecord> {
  const docRef = adminDb.collection("announcements").doc();

  const record: AnnouncementRecord = {
    announcementId: docRef.id,
    title: input.title,
    content: input.content,
    category: input.category,
    audience: input.audience,
    isPinned: input.isPinned,
    publishedBy: actorUid,
    publishedByName: actorName,
    publishedAt: FieldValue.serverTimestamp(),
    expiresAt: input.expiresAt || null,
  };

  await docRef.set(record);

  await createAuditLog({
    actorUid,
    action: "PUBLISH_ANNOUNCEMENT",
    entityType: "announcement",
    entityId: docRef.id,
    result: "SUCCESS",
    metadata: { title: input.title, audience: input.audience, category: input.category },
    requestId,
  });

  if (input.broadcastNotification) {
    try {
      await createNotification(
        {
          recipientUid: input.audience === "PENGURUS_ONLY" ? "ALL_PENGURUS" : "ALL_WARGA",
          title: `Pengumuman: ${input.title}`,
          message: input.content.slice(0, 180) + (input.content.length > 180 ? "..." : ""),
          type: "ANNOUNCEMENT",
          link: "/notifications",
          metadata: { announcementId: docRef.id, category: input.category },
        },
        actorUid
      );
    } catch (err) {
      console.warn("Failed to broadcast announcement notification:", err);
    }
  }

  return record;
}
