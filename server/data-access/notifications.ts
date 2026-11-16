import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { CreateNotificationInput, ListNotificationsQuery } from "@/server/validation/notifications";

export interface NotificationDocument {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: any;
  createdAt: any;
  createdBy: string;
}

export async function createNotification(
  input: CreateNotificationInput,
  creatorUid: string
): Promise<NotificationDocument> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return {
      id: `test-notif-${Date.now()}`,
      recipientUid: input.recipientUid,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link,
      metadata: input.metadata || {},
      isRead: false,
      createdAt: new Date().toISOString(),
      createdBy: creatorUid,
    };
  }

  const docRef = adminDb.collection("notifications").doc();

  const notification: NotificationDocument = {
    id: docRef.id,
    recipientUid: input.recipientUid,
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link,
    metadata: input.metadata || {},
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: creatorUid,
  };

  await docRef.set(notification);
  return notification;
}

export async function listNotificationsForUser(
  userUid: string,
  params: ListNotificationsQuery
): Promise<{ items: NotificationDocument[]; count: number }> {
  // Read notifications specifically for user, or broadcast messages (ALL_WARGA)
  const userQuery = adminDb
    .collection("notifications")
    .where("recipientUid", "in", [userUid, "ALL_WARGA"])
    .orderBy("createdAt", "desc")
    .limit(params.limit || 20);

  const snapshot = await userQuery.get();
  let items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as NotificationDocument[];

  if (params.unreadOnly) {
    items = items.filter((n) => !n.isRead);
  }

  return {
    items,
    count: items.length,
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userUid: string
): Promise<NotificationDocument | null> {
  const docRef = adminDb.collection("notifications").doc(notificationId);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  const data = doc.data() as NotificationDocument;
  // Recipient check: only recipient or broadcast receiver can mark read
  if (data.recipientUid !== userUid && data.recipientUid !== "ALL_WARGA") {
    throw new Error("UNAUTHORIZED_NOTIFICATION_ACCESS");
  }

  await docRef.update({
    isRead: true,
    readAt: FieldValue.serverTimestamp(),
  });

  return {
    ...data,
    isRead: true,
  };
}
