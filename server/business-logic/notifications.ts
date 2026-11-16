import "server-only";
import {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "@/server/validation/notifications";
import {
  createNotification as repoCreateNotification,
  listNotificationsForUser as repoListNotificationsForUser,
  markNotificationAsRead as repoMarkNotificationAsRead,
  NotificationDocument,
} from "@/server/data-access/notifications";
import { createAuditLog } from "@/lib/firebase/admin-firestore";

export async function sendNotification(
  input: CreateNotificationInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<NotificationDocument> {
  const notif = await repoCreateNotification(input, actorUid);

  await createAuditLog({
    actorUid,
    action: "SEND_NOTIFICATION",
    entityType: "notification",
    entityId: notif.id,
    result: "SUCCESS",
    metadata: {
      recipientUid: notif.recipientUid,
      type: notif.type,
      title: notif.title,
    },
    requestId,
  });

  return notif;
}

export async function getUserNotifications(
  userUid: string,
  query: ListNotificationsQuery
) {
  return await repoListNotificationsForUser(userUid, query);
}

export async function readNotification(
  notificationId: string,
  userUid: string
) {
  return await repoMarkNotificationAsRead(notificationId, userUid);
}
