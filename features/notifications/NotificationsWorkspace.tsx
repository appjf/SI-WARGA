"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellDot,
  Check,
  Megaphone,
  Pin,
  Send,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import { formatDateTimeJakarta } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  FormField,
  SelectInput,
  TextareaInput,
  TextInput,
} from "@/components/ui/FormFields";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { StatusText } from "@/components/ui/StatusText";
import type { AnnouncementRecord, NotificationRecord } from "@/types";

const OFFICIAL_PUBLISH_ROLES = [
  "SUPER_ADMIN",
  "ADMIN_RW",
  "KETUA_RT",
  "SEKRETARIS_RT",
  "BENDAHARA_RT",
] as const;

export function NotificationsWorkspace() {
  const { profile, hasAnyRole } = useAuth();
  const { showToast } = useToast();

  const canPublish = hasAnyRole([...OFFICIAL_PUBLISH_ROLES]);

  const [activeTab, setActiveTab] = useState<"notifications" | "announcements">(
    "notifications"
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Publish Announcement Modal
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [publishingAnn, setPublishingAnn] = useState(false);
  const [annForm, setAnnForm] = useState({
    title: "",
    content: "",
    category: "UMUM",
    audience: "ALL_WARGA" as "ALL_WARGA" | "PENGURUS_ONLY",
    isPinned: false,
    broadcastNotification: true,
  });

  // Direct Notification Modal
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifForm, setNotifForm] = useState({
    recipientUid: "ALL",
    title: "",
    message: "",
    type: "ANNOUNCEMENT",
    link: "/notifications",
  });

  const loadCenterData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const [notifRes, annRes] = await Promise.all([
        bffApi.listNotifications(unreadOnly),
        bffApi.listAnnouncements(categoryFilter),
      ]);
      setNotifications(notifRes.data || []);
      setAnnouncements(annRes.data || []);
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat pusat informasi dan notifikasi."
      );
    } finally {
      setLoading(false);
    }
  }, [profile, unreadOnly, categoryFilter]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadCenterData();
    });
    return () => {
      active = false;
    };
  }, [loadCenterData]);

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await bffApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      showToast({
        variant: "success",
        title: "Notifikasi ditandai sudah dibaca",
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal memperbarui status notifikasi",
        description: err instanceof BffClientError ? err.message : undefined,
      });
    } finally {
      setMarkingId(null);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingAnn(true);
    try {
      await bffApi.publishAnnouncement({
        title: annForm.title.trim(),
        content: annForm.content.trim(),
        category: annForm.category,
        audience: annForm.audience,
        isPinned: annForm.isPinned,
        broadcastNotification: annForm.broadcastNotification,
      });
      showToast({
        variant: "success",
        title: "Pengumuman resmi diterbitkan",
        description: annForm.broadcastNotification
          ? "Notifikasi siaran dikirim ke penerima target."
          : undefined,
      });
      setAnnModalOpen(false);
      setAnnForm({
        title: "",
        content: "",
        category: "UMUM",
        audience: "ALL_WARGA",
        isPinned: false,
        broadcastNotification: true,
      });
      setActiveTab("announcements");
      await loadCenterData();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menerbitkan pengumuman",
        description: err instanceof BffClientError ? err.message : undefined,
      });
    } finally {
      setPublishingAnn(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingNotif(true);
    try {
      await bffApi.sendNotification({
        recipientUid: notifForm.recipientUid.trim() || "ALL",
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        type: notifForm.type,
        link: notifForm.link.trim() || undefined,
      });
      showToast({
        variant: "success",
        title: "Notifikasi terkirim",
        description: `Tujuan: ${notifForm.recipientUid}`,
      });
      setNotifModalOpen(false);
      setNotifForm({
        recipientUid: "ALL",
        title: "",
        message: "",
        type: "ANNOUNCEMENT",
        link: "/notifications",
      });
      await loadCenterData();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mengirim notifikasi",
        description: err instanceof BffClientError ? err.message : undefined,
      });
    } finally {
      setSendingNotif(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header & Official Publish Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2933]">
            Pusat Notifikasi &amp; Informasi RT 06
          </h2>
          <p className="text-sm text-[#667085]">
            Pemberitahuan sistem, tindak lanjut pengaduan, serta pengumuman resmi pengurus RT 06 RW 01.
          </p>
        </div>

        {canPublish && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              iconLeft={<Send className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setNotifModalOpen(true)}
            >
              Kirim Notifikasi
            </Button>
            <Button
              iconLeft={<Megaphone className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setAnnModalOpen(true)}
            >
              Terbitkan Pengumuman
            </Button>
          </div>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-3 border-b border-[#E4E7EC] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "notifications"
                ? "bg-[#1F5E4A] text-white"
                : "bg-white text-[#667085] hover:bg-[#EFF2EE] hover:text-[#1F2933]"
            }`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span>
              Notifikasi Saya ({unreadCount} belum dibaca)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "announcements"
                ? "bg-[#1F5E4A] text-white"
                : "bg-white text-[#667085] hover:bg-[#EFF2EE] hover:text-[#1F2933]"
            }`}
          >
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            <span>Pengumuman Resmi ({announcements.length})</span>
          </button>
        </div>

        {activeTab === "notifications" ? (
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1F2933]">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="h-4 w-4 rounded accent-[#1F5E4A]"
            />
            <span>Tampilkan hanya yang belum dibaca</span>
          </label>
        ) : (
          <select
            aria-label="Filter kategori pengumuman"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2933]"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="KEGIATAN">Kegiatan Warga</option>
            <option value="KEUANGAN">Iuran &amp; Keuangan</option>
            <option value="KEAMANAN">Keamanan Lingkungan</option>
            <option value="INFRASTRUKTUR">Infrastruktur &amp; Sarpras</option>
            <option value="UMUM">Informasi Umum</option>
          </select>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadCenterData()} />
      ) : activeTab === "notifications" ? (
        notifications.length === 0 ? (
          <EmptyState
            title="Tidak Ada Notifikasi"
            description={
              unreadOnly
                ? "Seluruh notifikasi Anda sudah dibaca."
                : "Belum ada notifikasi pribadi maupun siaran yang masuk."
            }
          />
        ) : (
          <div className="divide-y divide-[#E4E7EC] rounded-xl border border-[#E4E7EC] bg-white">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between ${
                  notif.isRead ? "bg-white" : "bg-[#F7F8F6]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      notif.isRead
                        ? "bg-[#EFF2EE] text-[#667085]"
                        : "bg-[#1F5E4A]/10 text-[#1F5E4A]"
                    }`}
                  >
                    {notif.isRead ? (
                      <Bell className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <BellDot className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1F2933]">
                        {notif.title}
                      </h3>
                      <StatusText
                        label={notif.isRead ? "Sudah Dibaca" : "Belum Dibaca"}
                        tone={notif.isRead ? "neutral" : "info"}
                      />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[#667085]">
                      {notif.message}
                    </p>
                    <p className="mt-2 text-xs text-[#667085]">
                      Kategori: {notif.type} ·{" "}
                      {notif.recipientUid === "ALL" ? "Siaran RT 06" : "Pribadi"} ·{" "}
                      {formatDateTimeJakarta(notif.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {notif.link && notif.link !== "/notifications" && (
                    <Link
                      href={notif.link}
                      className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2933] hover:bg-[#EFF2EE]"
                    >
                      Buka Tautan
                    </Link>
                  )}
                  {!notif.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={markingId === notif.id}
                      iconLeft={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      onClick={() => void handleMarkAsRead(notif.id)}
                    >
                      Tandai Dibaca
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : announcements.length === 0 ? (
        <EmptyState
          title="Belum Ada Pengumuman Resmi"
          description="Pengumuman kegiatan, jadwal kerja bakti, dan edaran keuangan RT 06 akan tampil di sini."
          actionLabel={canPublish ? "Terbitkan Pengumuman" : undefined}
          onAction={canPublish ? () => setAnnModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <article
              key={ann.announcementId}
              className="rounded-xl border border-[#E4E7EC] bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#1F5E4A]">
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[#A15C00]">
                        <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Disematkan</span>
                        <span>·</span>
                      </span>
                    )}
                    <span>{ann.category}</span>
                    <span>·</span>
                    <span>
                      {ann.audience === "PENGURUS_ONLY"
                        ? "Khusus Pengurus"
                        : "Seluruh Warga RT 06"}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-[#1F2933]">
                    {ann.title}
                  </h3>
                </div>
                <span className="text-xs text-[#667085]">
                  {formatDateTimeJakarta(ann.publishedAt)}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#1F2933]">
                {ann.content}
              </p>

              <p className="mt-4 border-t border-[#E4E7EC] pt-3 text-xs text-[#667085]">
                Diterbitkan oleh:{" "}
                <strong className="text-[#1F2933]">
                  {ann.publishedByName || ann.publishedBy}
                </strong>
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Modal: Publish Announcement */}
      <Modal
        open={annModalOpen}
        onClose={() => setAnnModalOpen(false)}
        title="Terbitkan Pengumuman Resmi"
        description="Pengumuman tampil di Pusat Informasi dan opsional dikirim sebagai notifikasi siaran."
      >
        <form onSubmit={handlePublishAnnouncement} className="space-y-4">
          <FormField id="ann-title" label="Judul Pengumuman" required>
            <TextInput
              id="ann-title"
              required
              placeholder="Contoh: Jadwal Kerja Bakti Drainase Blok A–C"
              value={annForm.title}
              onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="ann-cat" label="Kategori" required>
              <SelectInput
                id="ann-cat"
                value={annForm.category}
                onChange={(e) =>
                  setAnnForm((p) => ({ ...p, category: e.target.value }))
                }
              >
                <option value="UMUM">Informasi Umum</option>
                <option value="KEGIATAN">Kegiatan Warga</option>
                <option value="KEUANGAN">Iuran &amp; Keuangan</option>
                <option value="KEAMANAN">Keamanan Lingkungan</option>
                <option value="INFRASTRUKTUR">Infrastruktur &amp; Sarpras</option>
              </SelectInput>
            </FormField>

            <FormField id="ann-aud" label="Target Audiens" required>
              <SelectInput
                id="ann-aud"
                value={annForm.audience}
                onChange={(e) =>
                  setAnnForm((p) => ({
                    ...p,
                    audience: e.target.value as "ALL_WARGA" | "PENGURUS_ONLY",
                  }))
                }
              >
                <option value="ALL_WARGA">Seluruh Warga RT 06</option>
                <option value="PENGURUS_ONLY">Khusus Pengurus RT/RW</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField id="ann-content" label="Isi Pengumuman" required>
            <TextareaInput
              id="ann-content"
              required
              rows={5}
              placeholder="Tuliskan detail waktu, tempat, dan imbauan secara jelas..."
              value={annForm.content}
              onChange={(e) =>
                setAnnForm((p) => ({ ...p, content: e.target.value }))
              }
            />
          </FormField>

          <div className="space-y-2 rounded-lg bg-[#F7F8F6] p-3 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-[#1F2933]">
              <input
                type="checkbox"
                checked={annForm.isPinned}
                onChange={(e) =>
                  setAnnForm((p) => ({ ...p, isPinned: e.target.checked }))
                }
                className="h-4 w-4 rounded accent-[#1F5E4A]"
              />
              <span>Sematkan di bagian atas papan pengumuman</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[#1F2933]">
              <input
                type="checkbox"
                checked={annForm.broadcastNotification}
                onChange={(e) =>
                  setAnnForm((p) => ({
                    ...p,
                    broadcastNotification: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded accent-[#1F5E4A]"
              />
              <span>Kirim notifikasi siaran ke warga (ALL)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E4E7EC] pt-4">
            <Button variant="outline" onClick={() => setAnnModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={publishingAnn}>
              Terbitkan Sekarang
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Direct Notification */}
      <Modal
        open={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        title="Kirim Notifikasi Langsung"
        description="Gunakan UID warga tertentu atau isi 'ALL' untuk siaran seluruh warga RT 06."
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          <FormField id="ntf-uid" label="Target Penerima (UID atau ALL)" required>
            <TextInput
              id="ntf-uid"
              required
              value={notifForm.recipientUid}
              onChange={(e) =>
                setNotifForm((p) => ({ ...p, recipientUid: e.target.value }))
              }
            />
          </FormField>
          <FormField id="ntf-type" label="Jenis Notifikasi" required>
            <SelectInput
              id="ntf-type"
              value={notifForm.type}
              onChange={(e) =>
                setNotifForm((p) => ({ ...p, type: e.target.value }))
              }
            >
              <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
              <option value="BILLING">BILLING</option>
              <option value="COMPLAINT">COMPLAINT</option>
              <option value="APPROVAL">APPROVAL</option>
              <option value="SYSTEM">SYSTEM</option>
            </SelectInput>
          </FormField>
          <FormField id="ntf-title" label="Judul Notifikasi" required>
            <TextInput
              id="ntf-title"
              required
              value={notifForm.title}
              onChange={(e) =>
                setNotifForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </FormField>
          <FormField id="ntf-msg" label="Pesan" required>
            <TextareaInput
              id="ntf-msg"
              required
              value={notifForm.message}
              onChange={(e) =>
                setNotifForm((p) => ({ ...p, message: e.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-[#E4E7EC] pt-4">
            <Button variant="outline" onClick={() => setNotifModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={sendingNotif}>
              Kirim Notifikasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
