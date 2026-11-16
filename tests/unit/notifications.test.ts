import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendNotification,
  getUserNotifications,
  readNotification,
} from "@/server/business-logic/notifications";
import * as notifDataAccess from "@/server/data-access/notifications";

describe("Work Package G — Internal Notifications Foundation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sampleNotif: notifDataAccess.NotificationDocument = {
    id: "notif-001",
    recipientUid: "user-warga-123",
    title: "Tagihan Iuran Kas RT",
    message: "Iuran kas bulan November 2026 telah diterbitkan",
    type: "BILLING",
    isRead: false,
    createdAt: "2026-11-15T00:00:00Z",
    createdBy: "bendahara-uid",
  };

  it("dispatches internal notification and records audit log", async () => {
    vi.spyOn(notifDataAccess, "createNotification").mockResolvedValue(sampleNotif);

    const result = await sendNotification(
      {
        recipientUid: "user-warga-123",
        title: "Tagihan Iuran Kas RT",
        message: "Iuran kas bulan November 2026 telah diterbitkan",
        type: "BILLING",
      },
      "bendahara-uid"
    );

    expect(result.id).toBe("notif-001");
    expect(result.isRead).toBe(false);
  });

  it("retrieves notifications intended for authenticated user", async () => {
    vi.spyOn(notifDataAccess, "listNotificationsForUser").mockResolvedValue({
      items: [sampleNotif],
      count: 1,
    });

    const res = await getUserNotifications("user-warga-123", { limit: 20 });
    expect(res.count).toBe(1);
    expect(res.items[0].recipientUid).toBe("user-warga-123");
  });

  it("allows recipient to mark their own notification as read", async () => {
    vi.spyOn(notifDataAccess, "markNotificationAsRead").mockResolvedValue({
      ...sampleNotif,
      isRead: true,
      readAt: "2026-11-15T01:00:00Z",
    });

    const updated = await readNotification("notif-001", "user-warga-123");
    expect(updated?.isRead).toBe(true);
  });

  it("rejects unauthorized user trying to mark someone else's notification as read", async () => {
    vi.spyOn(notifDataAccess, "markNotificationAsRead").mockRejectedValue(
      new Error("UNAUTHORIZED_NOTIFICATION_ACCESS")
    );

    await expect(readNotification("notif-001", "intruder-user-999")).rejects.toThrow(
      "UNAUTHORIZED_NOTIFICATION_ACCESS"
    );
  });
});
