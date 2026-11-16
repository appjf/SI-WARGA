"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Eye,
  MapPin,
  MessageSquarePlus,
  Send,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import { formatDateTimeJakarta } from "@/lib/formatters";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  FormField,
  SelectInput,
  TextareaInput,
  TextInput,
} from "@/components/ui/FormFields";
import { ErrorState, ForbiddenState } from "@/components/ui/States";
import {
  getComplaintStatusMeta,
  StatusText,
} from "@/components/ui/StatusText";
import type { ComplaintRecord, ComplaintStatus } from "@/types";

const ALLOWED_NEXT_STATES: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ["VERIFIED", "REJECTED"],
  VERIFIED: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  REJECTED: [],
};

export function ComplaintsWorkspace() {
  const router = useRouter();
  const { profile, can } = useAuth();
  const { showToast } = useToast();

  const canRead = can("complaints:read");
  const canWrite = can("complaints:write");
  const canManage = can("complaints:manage");

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Create complaint modal
  const [createOpen, setCreateOpen] = useState(false);
  const [compForm, setCompForm] = useState({
    category: "INFRASTRUKTUR",
    title: "",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    locationDescription: "",
    spatialId: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Detail & status transition modal
  const [selected, setSelected] = useState<ComplaintRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<ComplaintStatus | "">("");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const loadComplaints = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bffApi.listComplaints({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        limit: 50,
      });
      setComplaints(res.data || []);
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat daftar pengaduan warga."
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, statusFilter, categoryFilter]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadComplaints();
    });
    return () => {
      active = false;
    };
  }, [loadComplaints]);

  if (!canRead) {
    return (
      <ForbiddenState
        title="Akses Pengaduan Dibatasi"
        message="Akun Anda tidak memiliki izin untuk membaca modul pengaduan."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (compForm.description.trim().length < 5) {
      showToast({
        variant: "error",
        title: "Deskripsi terlalu singkat",
        description: "Jelaskan keluhan atau aspirasi minimal 5 karakter.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await bffApi.createComplaint({
        category: compForm.category,
        title: compForm.title.trim() || undefined,
        priority: compForm.priority,
        locationDescription: compForm.locationDescription.trim(),
        spatialId: compForm.spatialId.trim() || null,
        description: compForm.description.trim(),
      });

      showToast({
        variant: "success",
        title: "Pengaduan berhasil dikirim",
        description: `Tiket #${res.data?.ticketId?.slice(0, 8)} berstatus Diajukan.`,
      });
      setCreateOpen(false);
      setCompForm({
        category: "INFRASTRUKTUR",
        title: "",
        priority: "NORMAL",
        locationDescription: "",
        spatialId: "",
        description: "",
      });
      await loadComplaints();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mengirim pengaduan",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openComplaintDetail = async (item: ComplaintRecord) => {
    setSelected(item);
    const allowed = ALLOWED_NEXT_STATES[item.status] || [];
    setNextStatus(allowed[0] || "");
    setTransitionNotes("");
    setAssignedTo(item.assignedTo || "");
    setOfficerName(item.officerName || "");
    setRejectionReason("");

    try {
      const fresh = await bffApi.getComplaint(item.ticketId);
      if (fresh.data) {
        setSelected(fresh.data);
      }
    } catch {
      // Keep list record if detail refresh fails
    }
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !nextStatus) return;

    if (nextStatus === "ASSIGNED" && !assignedTo.trim()) {
      showToast({
        variant: "error",
        title: "Petugas wajib ditentukan",
        description: "Masukkan ID atau kode petugas untuk status Ditugaskan.",
      });
      return;
    }

    if (nextStatus === "REJECTED" && rejectionReason.trim().length < 5) {
      showToast({
        variant: "error",
        title: "Alasan penolakan wajib diisi",
        description: "Masukkan alasan penolakan minimal 5 karakter.",
      });
      return;
    }

    setTransitioning(true);
    try {
      const res = await bffApi.transitionComplaintStatus(selected.ticketId, {
        status: nextStatus,
        notes: transitionNotes.trim() || undefined,
        assignedTo: nextStatus === "ASSIGNED" ? assignedTo.trim() : undefined,
        officerName:
          nextStatus === "ASSIGNED" ? officerName.trim() || undefined : undefined,
        rejectionReason:
          nextStatus === "REJECTED" ? rejectionReason.trim() : undefined,
      });

      if (res.data) {
        setSelected(res.data);
        const nextAllowed = ALLOWED_NEXT_STATES[res.data.status] || [];
        setNextStatus(nextAllowed[0] || "");
      }
      setTransitionNotes("");
      showToast({
        variant: "success",
        title: "Status pengaduan diperbarui",
        description: `Tiket kini berstatus ${nextStatus}.`,
      });
      await loadComplaints();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Transisi status ditolak",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setTransitioning(false);
    }
  };

  const isStaff = profile?.roles?.some((r) =>
    ["SUPER_ADMIN", "ADMIN_RW", "KETUA_RT", "SEKRETARIS_RT", "PENGURUS"].includes(r)
  );

  const getAvailableTransitionsForUser = (c: ComplaintRecord): ComplaintStatus[] => {
    const allowed = ALLOWED_NEXT_STATES[c.status] || [];
    const isReporter = c.reporterId === profile?.uid;
    return allowed.filter((target) => {
      if (target === "CLOSED") {
        return (
          isReporter ||
          profile?.roles?.some((r) =>
            ["SUPER_ADMIN", "ADMIN_RW", "KETUA_RT"].includes(r)
          )
        );
      }
      return Boolean(isStaff || canManage);
    });
  };

  const columns: ColumnDef<ComplaintRecord>[] = [
    {
      key: "title",
      header: "Pengaduan & Lokasi",
      render: (row) => (
        <div>
          <p className="font-medium text-[#1F2933]">
            {row.title || row.description.slice(0, 60)}
          </p>
          <p className="mt-0.5 text-xs text-[#667085]">
            <span className="font-mono">#{row.ticketId.slice(0, 8)}</span> ·{" "}
            {row.category} · {row.locationDescription || "Area RT 06 RW 01"}
          </p>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Prioritas",
      render: (row) => (
        <span
          className={`text-xs font-semibold ${
            row.priority === "URGENT" || row.priority === "HIGH"
              ? "text-[#B42318]"
              : "text-[#667085]"
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const meta = getComplaintStatusMeta(row.status);
        return <StatusText label={meta.label} tone={meta.tone} />;
      },
    },
    {
      key: "createdAt",
      header: "Dilaporkan",
      render: (row) => (
        <span className="text-xs text-[#667085] tabular-nums">
          {formatDateTimeJakarta(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Tindakan",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          iconLeft={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={(e) => {
            e.stopPropagation();
            void openComplaintDetail(row);
          }}
        >
          Detail &amp; Riwayat
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-[#E4E7EC] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2933]">
            Layanan Pengaduan &amp; Tindak Lanjut Lingkungan
          </h2>
          <p className="mt-1 text-xs text-[#667085]">
            Alur status terverifikasi: Diajukan → Terverifikasi → Ditugaskan →
            Ditindaklanjuti → Selesai → Ditutup.
          </p>
        </div>

        {(canWrite || canManage) && (
          <Button
            iconLeft={<MessageSquarePlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setCreateOpen(true)}
          >
            Ajukan Pengaduan
          </Button>
        )}
      </section>

      {error ? (
        <ErrorState message={error} onRetry={() => void loadComplaints()} />
      ) : (
        <DataTable
          data={complaints}
          columns={columns}
          keyExtractor={(c) => c.ticketId}
          loading={loading}
          searchPlaceholder="Cari judul, kategori, atau ID tiket..."
          searchFilter={(row, q) =>
            (row.title || "").toLowerCase().includes(q) ||
            row.description.toLowerCase().includes(q) ||
            row.ticketId.toLowerCase().includes(q) ||
            (row.locationDescription || "").toLowerCase().includes(q)
          }
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <SelectInput
                aria-label="Filter status pengaduan"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-44 py-2 text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="SUBMITTED">Diajukan</option>
                <option value="VERIFIED">Terverifikasi</option>
                <option value="ASSIGNED">Ditugaskan</option>
                <option value="IN_PROGRESS">Sedang Ditindaklanjuti</option>
                <option value="RESOLVED">Selesai</option>
                <option value="CLOSED">Ditutup</option>
                <option value="REJECTED">Ditolak</option>
              </SelectInput>
              <SelectInput
                aria-label="Filter kategori pengaduan"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-44 py-2 text-xs"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="INFRASTRUKTUR">Infrastruktur</option>
                <option value="KEAMANAN">Keamanan</option>
                <option value="KEBERSIHAN">Kebersihan</option>
                <option value="FASILITAS_UMUM">Fasilitas Umum</option>
                <option value="SOSIAL">Sosial</option>
                <option value="LAINNYA">Lainnya</option>
              </SelectInput>
            </div>
          }
          emptyTitle="Belum Ada Tiket Pengaduan"
          emptyDescription="Pengaduan atau laporan kondisi fasilitas lingkungan dari warga akan tampil di sini."
          emptyActionLabel={
            canWrite || canManage ? "Buat Pengaduan Pertama" : undefined
          }
          onEmptyAction={
            canWrite || canManage ? () => setCreateOpen(true) : undefined
          }
          onRowClick={(c) => void openComplaintDetail(c)}
        />
      )}

      {/* Submit Complaint Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Ajukan Pengaduan / Aspirasi Warga"
        description="Laporkan kendala prasarana, keamanan, atau kebersihan di wilayah RT 06 RW 01."
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="comp-cat" label="Kategori" required>
              <SelectInput
                id="comp-cat"
                value={compForm.category}
                onChange={(e) =>
                  setCompForm((p) => ({ ...p, category: e.target.value }))
                }
              >
                <option value="INFRASTRUKTUR">Infrastruktur &amp; Drainase</option>
                <option value="KEAMANAN">Keamanan Lingkungan</option>
                <option value="KEBERSIHAN">Kebersihan &amp; Sampah</option>
                <option value="FASILITAS_UMUM">Fasilitas Umum</option>
                <option value="SOSIAL">Kemasyarakatan / Sosial</option>
                <option value="LAINNYA">Lainnya</option>
              </SelectInput>
            </FormField>

            <FormField id="comp-priority" label="Tingkat Prioritas">
              <SelectInput
                id="comp-priority"
                value={compForm.priority}
                onChange={(e) =>
                  setCompForm((p) => ({
                    ...p,
                    priority: e.target.value as typeof compForm.priority,
                  }))
                }
              >
                <option value="LOW">Rendah</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak (Urgent)</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField id="comp-title" label="Judul Singkat Laporan">
            <TextInput
              id="comp-title"
              value={compForm.title}
              onChange={(e) =>
                setCompForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Contoh: Lampu jalan Blok A2 mati"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="comp-loc" label="Lokasi Kejadian">
              <TextInput
                id="comp-loc"
                value={compForm.locationDescription}
                onChange={(e) =>
                  setCompForm((p) => ({
                    ...p,
                    locationDescription: e.target.value,
                  }))
                }
                placeholder="Depan rumah Blok A No. 05"
              />
            </FormField>
            <FormField
              id="comp-spatial"
              label="Kode Objek GIS (Opsional)"
              helperText="Contoh: F-POS-01 atau H-006-001"
            >
              <TextInput
                id="comp-spatial"
                value={compForm.spatialId}
                onChange={(e) =>
                  setCompForm((p) => ({ ...p, spatialId: e.target.value }))
                }
                placeholder="F-POS-01"
              />
            </FormField>
          </div>

          <FormField id="comp-desc" label="Uraian Pengaduan" required>
            <TextareaInput
              id="comp-desc"
              value={compForm.description}
              onChange={(e) =>
                setCompForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Jelaskan kondisi di lapangan secara rinci agar petugas mudah menindaklanjuti."
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E7EC] pt-4">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={submitting}
              iconLeft={<Send className="h-4 w-4" aria-hidden="true" />}
            >
              Kirim Pengaduan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complaint Detail & Status Transition Modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || `Tiket #${selected?.ticketId.slice(0, 8)}`}
        description={`ID Tiket: ${selected?.ticketId}`}
        maxWidthClass="max-w-2xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-4">
              <StatusText
                label={getComplaintStatusMeta(selected.status).label}
                tone={getComplaintStatusMeta(selected.status).tone}
              />
              <span className="text-xs text-[#667085]">
                {selected.category} · Prioritas {selected.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <p className="leading-relaxed text-[#1F2933]">
                {selected.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#667085]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {selected.locationDescription || "Area RT 06 RW 01"}
                </span>
                {selected.spatialId && (
                  <span className="font-mono text-[#1F5E4A]">
                    Objek Spasial: {selected.spatialId}
                  </span>
                )}
                {selected.officerName && (
                  <span>Petugas: {selected.officerName}</span>
                )}
              </div>
              {selected.rejectionReason && (
                <div className="mt-2 rounded-lg border border-[#B42318]/25 bg-[#B42318]/5 p-3 text-xs text-[#B42318]">
                  Alasan Penolakan: {selected.rejectionReason}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="space-y-3 border-t border-[#E4E7EC] pt-4">
              <h3 className="text-sm font-semibold text-[#1F2933]">
                Riwayat Status &amp; Dokumentasi Tindak Lanjut
              </h3>
              <ol className="space-y-3">
                {(selected.statusHistory || []).map((entry, idx) => {
                  const meta = getComplaintStatusMeta(entry.toStatus);
                  return (
                    <li
                      key={`${entry.timestamp}-${idx}`}
                      className="flex items-start justify-between gap-4 rounded-lg border border-[#E4E7EC] p-3 text-xs"
                    >
                      <div className="space-y-1">
                        <StatusText label={meta.label} tone={meta.tone} />
                        {entry.notes && (
                          <p className="text-[#1F2933]">{entry.notes}</p>
                        )}
                        {entry.officerName && (
                          <p className="text-[#667085]">
                            Petugas ditugaskan: {entry.officerName} (
                            {entry.assignedTo})
                          </p>
                        )}
                        {entry.rejectionReason && (
                          <p className="text-[#B42318]">
                            Alasan: {entry.rejectionReason}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[#667085] tabular-nums">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatDateTimeJakarta(entry.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Transition Form */}
            {(() => {
              const allowedTransitions = getAvailableTransitionsForUser(selected);
              if (allowedTransitions.length === 0) return null;

              return (
                <form
                  onSubmit={handleTransition}
                  className="space-y-4 border-t border-[#E4E7EC] pt-4"
                >
                  <h3 className="text-sm font-semibold text-[#1F2933]">
                    Perbarui Status Tiket
                  </h3>

                  <FormField id="comp-next-status" label="Status Berikutnya" required>
                    <SelectInput
                      id="comp-next-status"
                      value={nextStatus}
                      onChange={(e) =>
                        setNextStatus(e.target.value as ComplaintStatus)
                      }
                    >
                      {allowedTransitions.map((st) => (
                        <option key={st} value={st}>
                          {getComplaintStatusMeta(st).label} ({st})
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  {nextStatus === "ASSIGNED" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="comp-assigned-to" label="ID / UID Petugas" required>
                        <TextInput
                          id="comp-assigned-to"
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value)}
                          placeholder="petugas-keamanan-01"
                        />
                      </FormField>
                      <FormField id="comp-officer-name" label="Nama Petugas">
                        <TextInput
                          id="comp-officer-name"
                          value={officerName}
                          onChange={(e) => setOfficerName(e.target.value)}
                          placeholder="Pak Asep (Keamanan RT)"
                        />
                      </FormField>
                    </div>
                  )}

                  {nextStatus === "REJECTED" && (
                    <FormField
                      id="comp-reject-reason"
                      label="Alasan Penolakan (Min. 5 Karakter)"
                      required
                    >
                      <TextareaInput
                        id="comp-reject-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Jelaskan alasan pengaduan tidak dapat diproses."
                      />
                    </FormField>
                  )}

                  <FormField
                    id="comp-notes"
                    label="Catatan / Tautan Bukti Dokumentasi"
                    helperText="Catat hasil pengecekan atau tautan dokumentasi penyelesaian."
                  >
                    <TextareaInput
                      id="comp-notes"
                      value={transitionNotes}
                      onChange={(e) => setTransitionNotes(e.target.value)}
                      placeholder="Contoh: Lampu telah diganti dan menyala normal."
                    />
                  </FormField>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelected(null)}
                      disabled={transitioning}
                    >
                      Tutup
                    </Button>
                    <Button type="submit" loading={transitioning}>
                      Terapkan Perubahan Status
                    </Button>
                  </div>
                </form>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
