"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  Lock,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import { formatDateJakarta } from "@/lib/formatters";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  FormField,
  SelectInput,
  TextInput,
} from "@/components/ui/FormFields";
import { ErrorState, ForbiddenState } from "@/components/ui/States";
import { StatusText } from "@/components/ui/StatusText";
import type { HouseholdRecord, ResidentRecord } from "@/types";

export function ResidentsWorkspace() {
  const router = useRouter();
  const { profile, can } = useAuth();
  const { showToast } = useToast();

  const canReadResidents = can("residents:read");
  const canWriteResidents = can("residents:write");
  const canWriteHouseholds = can("households:write");

  const [activeTab, setActiveTab] = useState<"residents" | "households">(
    "residents"
  );
  const [residents, setResidents] = useState<ResidentRecord[]>([]);
  const [households, setHouseholds] = useState<HouseholdRecord[]>([]);
  const [houseFilter, setHouseFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail modal
  const [selectedResident, setSelectedResident] =
    useState<ResidentRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resident registration modal
  const [createResidentOpen, setCreateResidentOpen] = useState(false);
  const [resForm, setResForm] = useState({
    fullName: "",
    houseId: "",
    nik: "",
    gender: "LAKI_LAKI" as "LAKI_LAKI" | "PEREMPUAN",
    birthDate: "",
    occupation: "",
    familyRole: "KEPALA_KELUARGA" as
      | "KEPALA_KELUARGA"
      | "ISTRI"
      | "ANAK"
      | "FAMILI_LAIN",
    isHeadOfFamily: true,
    phone: "",
    email: "",
  });
  const [savingResident, setSavingResident] = useState(false);

  // Household registration modal
  const [createHouseOpen, setCreateHouseOpen] = useState(false);
  const [houseForm, setHouseForm] = useState({
    houseCode: "",
    blockName: "Blok A",
    addressLabel: "",
    occupancyStatus: "OCCUPIED" as "OCCUPIED" | "VACANT" | "RENTED",
    headResidentName: "",
  });
  const [savingHouse, setSavingHouse] = useState(false);

  const loadData = useCallback(async () => {
    if (!canReadResidents) return;
    setLoading(true);
    setError(null);
    try {
      const [resList, houseList] = await Promise.all([
        bffApi.listResidents({ limit: 50 }),
        bffApi.listHouseholds().catch(() => ({ success: true, data: [] })),
      ]);
      setResidents(resList.data || []);
      const hItems = houseList.data || [];
      setHouseholds(hItems);
      if (hItems.length > 0 && !resForm.houseId) {
        setResForm((prev) => ({ ...prev, houseId: hItems[0].houseId }));
      }
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat data warga dan rumah tangga."
      );
    } finally {
      setLoading(false);
    }
  }, [canReadResidents, resForm.houseId]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  if (!canReadResidents) {
    return (
      <ForbiddenState
        title="Akses Data Warga Dibatasi"
        message="Anda tidak memiliki izin membaca direktori kependudukan."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  const isFullPiiRole = profile?.roles?.some((r) =>
    ["SUPER_ADMIN", "ADMIN_RW", "KETUA_RT", "SEKRETARIS_RT"].includes(r)
  );

  const openResidentDetail = async (resident: ResidentRecord) => {
    setSelectedResident(resident);
    setDetailLoading(true);
    try {
      const res = await bffApi.getResident(resident.residentId);
      if (res.data) {
        setSelectedResident(res.data);
      }
    } catch (err) {
      showToast({
        variant: "error",
        title: "Akses detail terbatas",
        description:
          err instanceof BffClientError
            ? err.message
            : "Tidak dapat memuat detail warga.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.fullName.trim() || resForm.fullName.trim().length < 2) {
      showToast({
        variant: "error",
        title: "Nama wajib diisi",
        description: "Nama lengkap warga minimal 2 karakter.",
      });
      return;
    }
    if (!resForm.houseId) {
      showToast({
        variant: "error",
        title: "Unit rumah belum dipilih",
        description: "Tambahkan unit rumah tangga terlebih dahulu sebelum mendaftarkan warga.",
      });
      return;
    }
    if (resForm.nik && !/^\d{16}$/.test(resForm.nik)) {
      showToast({
        variant: "error",
        title: "Format NIK tidak valid",
        description: "NIK harus tepat 16 digit angka.",
      });
      return;
    }

    setSavingResident(true);
    try {
      await bffApi.createResident({
        fullName: resForm.fullName.trim(),
        houseId: resForm.houseId,
        nik: resForm.nik || undefined,
        gender: resForm.gender,
        birthDate: resForm.birthDate || undefined,
        occupation: resForm.occupation || undefined,
        familyRole: resForm.familyRole,
        isHeadOfFamily: resForm.familyRole === "KEPALA_KELUARGA" || resForm.isHeadOfFamily,
        contact: {
          phone: resForm.phone || "",
          email: resForm.email || "",
          waNumber: resForm.phone || "",
        },
      });

      showToast({
        variant: "success",
        title: "Warga berhasil didaftarkan",
        description: `${resForm.fullName} telah ditambahkan ke RT 06 RW 01.`,
      });
      setCreateResidentOpen(false);
      setResForm((prev) => ({
        ...prev,
        fullName: "",
        nik: "",
        birthDate: "",
        occupation: "",
        phone: "",
        email: "",
      }));
      await loadData();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mendaftarkan warga",
        description:
          err instanceof BffClientError ? err.message : "Periksa kembali isian formulir.",
      });
    } finally {
      setSavingResident(false);
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseForm.houseCode.trim() || !houseForm.addressLabel.trim()) {
      showToast({
        variant: "error",
        title: "Data rumah belum lengkap",
        description: "Kode unit rumah dan label alamat wajib diisi.",
      });
      return;
    }

    setSavingHouse(true);
    try {
      await bffApi.createHousehold({
        houseCode: houseForm.houseCode.trim(),
        blockName: houseForm.blockName.trim(),
        addressLabel: houseForm.addressLabel.trim(),
        occupancyStatus: houseForm.occupancyStatus,
        headResidentName: houseForm.headResidentName.trim(),
      });
      showToast({
        variant: "success",
        title: "Unit rumah tangga terdaftar",
        description: `Unit ${houseForm.houseCode} siap digunakan untuk registrasi warga.`,
      });
      setCreateHouseOpen(false);
      setHouseForm({
        houseCode: "",
        blockName: "Blok A",
        addressLabel: "",
        occupancyStatus: "OCCUPIED",
        headResidentName: "",
      });
      await loadData();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menambahkan rumah tangga",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSavingHouse(false);
    }
  };

  const filteredResidents =
    houseFilter === "ALL"
      ? residents
      : residents.filter((r) => r.houseId === houseFilter);

  const residentColumns: ColumnDef<ResidentRecord>[] = [
    {
      key: "fullName",
      header: "Nama Warga",
      render: (row) => (
        <div>
          <p className="font-medium text-[#1F2933]">{row.fullName}</p>
          <p className="text-xs text-[#667085]">
            {row.familyRole.replace("_", " ")} · Unit{" "}
            <span className="font-mono">{row.houseId}</span>
          </p>
        </div>
      ),
    },
    {
      key: "nik",
      header: "NIK (Sesuai Hak Akses)",
      render: (row) => (
        <span className="font-mono text-xs text-[#1F2933] tabular-nums">
          {row.nik ? row.nik : "Disembunyikan (PII)"}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Kontak",
      render: (row) => (
        <span className="font-mono text-xs text-[#667085] tabular-nums">
          {row.contact?.phone || "Terbatas"}
        </span>
      ),
    },
    {
      key: "verificationStatus",
      header: "Status",
      render: (row) => (
        <StatusText
          label={
            row.verificationStatus === "verified"
              ? "Terverifikasi"
              : row.verificationStatus === "pending"
                ? "Menunggu"
                : "Belum Verifikasi"
          }
          tone={
            row.verificationStatus === "verified"
              ? "success"
              : row.verificationStatus === "pending"
                ? "warning"
                : "neutral"
          }
        />
      ),
    },
    {
      key: "actions",
      header: "Detail",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          iconLeft={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={(e) => {
            e.stopPropagation();
            void openResidentDetail(row);
          }}
        >
          Lihat
        </Button>
      ),
    },
  ];

  const householdColumns: ColumnDef<HouseholdRecord>[] = [
    {
      key: "houseCode",
      header: "Kode Rumah",
      render: (row) => (
        <div>
          <p className="font-mono text-sm font-semibold text-[#1F5E4A]">
            {row.houseCode}
          </p>
          <p className="text-xs text-[#667085]">{row.houseId}</p>
        </div>
      ),
    },
    {
      key: "blockName",
      header: "Blok & Alamat",
      render: (row) => (
        <div>
          <p className="font-medium text-[#1F2933]">{row.blockName}</p>
          <p className="text-xs text-[#667085]">{row.addressLabel}</p>
        </div>
      ),
    },
    {
      key: "headResidentName",
      header: "Kepala Keluarga",
      render: (row) => (
        <span className="text-sm text-[#1F2933]">
          {row.headResidentName || "Belum ditautkan"}
        </span>
      ),
    },
    {
      key: "occupancyStatus",
      header: "Hunian",
      render: (row) => (
        <StatusText
          label={
            row.occupancyStatus === "OCCUPIED"
              ? "Dihuni"
              : row.occupancyStatus === "RENTED"
                ? "Disewa"
                : "Kosong"
          }
          tone={
            row.occupancyStatus === "OCCUPIED"
              ? "success"
              : row.occupancyStatus === "RENTED"
                ? "info"
                : "neutral"
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & PII Policy Banner */}
      <section className="flex flex-col gap-4 rounded-xl border border-[#E4E7EC] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2933]">
            Direktori Kependudukan &amp; Rumah Tangga
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#667085]">
            <Lock className="h-3.5 w-3.5 text-[#1F5E4A]" aria-hidden="true" />
            <span>
              {isFullPiiRole
                ? "Akses PII penuh aktif sesuai peran kepengurusan Anda."
                : "Perlindungan PII aktif: NIK dan kontak disamarkan atau dibatasi oleh server."}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canWriteHouseholds && (
            <Button
              variant="outline"
              iconLeft={<Building2 className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setCreateHouseOpen(true)}
            >
              Tambah Rumah Tangga
            </Button>
          )}
          {canWriteResidents && (
            <Button
              iconLeft={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setCreateResidentOpen(true)}
            >
              Registrasi Warga
            </Button>
          )}
        </div>
      </section>

      {/* Segmented Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Submenu kependudukan"
          className="inline-flex rounded-lg border border-[#E4E7EC] bg-white p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "residents"}
            onClick={() => setActiveTab("residents")}
            className={`inline-flex min-h-9 items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "residents"
                ? "bg-[#1F5E4A] text-white"
                : "text-[#667085] hover:text-[#1F2933]"
            }`}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Daftar Warga ({residents.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "households"}
            onClick={() => setActiveTab("households")}
            className={`inline-flex min-h-9 items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "households"
                ? "bg-[#1F5E4A] text-white"
                : "text-[#667085] hover:text-[#1F2933]"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Unit Rumah Tangga ({households.length})</span>
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void loadData()} />
      ) : activeTab === "residents" ? (
        <DataTable
          data={filteredResidents}
          columns={residentColumns}
          keyExtractor={(r) => r.residentId}
          loading={loading}
          searchPlaceholder="Cari nama warga atau kode unit..."
          searchFilter={(row, q) =>
            row.fullName.toLowerCase().includes(q) ||
            row.houseId.toLowerCase().includes(q)
          }
          toolbar={
            households.length > 0 ? (
              <SelectInput
                aria-label="Filter unit rumah"
                value={houseFilter}
                onChange={(e) => setHouseFilter(e.target.value)}
                className="w-48 py-2 text-xs"
              >
                <option value="ALL">Semua Unit Rumah</option>
                {households.map((h) => (
                  <option key={h.houseId} value={h.houseId}>
                    {h.houseCode} ({h.blockName})
                  </option>
                ))}
              </SelectInput>
            ) : null
          }
          emptyTitle="Belum Ada Data Warga"
          emptyDescription="Warga yang didaftarkan oleh Sekretaris RT atau tertaut ke unit rumah akan tampil di sini."
          emptyActionLabel={canWriteResidents ? "Registrasi Warga Pertama" : undefined}
          onEmptyAction={
            canWriteResidents ? () => setCreateResidentOpen(true) : undefined
          }
          onRowClick={(r) => void openResidentDetail(r)}
        />
      ) : (
        <DataTable
          data={households}
          columns={householdColumns}
          keyExtractor={(h) => h.houseId}
          loading={loading}
          searchPlaceholder="Cari kode rumah, blok, atau kepala keluarga..."
          searchFilter={(row, q) =>
            row.houseCode.toLowerCase().includes(q) ||
            row.blockName.toLowerCase().includes(q) ||
            (row.headResidentName || "").toLowerCase().includes(q)
          }
          emptyTitle="Belum Ada Unit Rumah Tangga"
          emptyDescription="Tambahkan unit rumah Green Garden Residence agar registrasi warga tervalidasi dengan benar."
          emptyActionLabel={
            canWriteHouseholds ? "Tambah Rumah Tangga" : undefined
          }
          onEmptyAction={
            canWriteHouseholds ? () => setCreateHouseOpen(true) : undefined
          }
        />
      )}

      {/* Detail Warga Modal */}
      <Modal
        open={Boolean(selectedResident)}
        onClose={() => setSelectedResident(null)}
        title="Detail Data Warga"
        description={selectedResident?.residentId}
      >
        {selectedResident && (
          <div className="space-y-4">
            {detailLoading && (
              <p className="text-xs text-[#667085]">
                Memverifikasi kelengkapan data sesuai hak akses...
              </p>
            )}
            <dl className="divide-y divide-[#E4E7EC] text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Nama Lengkap</dt>
                <dd className="font-semibold text-[#1F2933]">
                  {selectedResident.fullName}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">ID Unit Rumah</dt>
                <dd className="font-mono text-xs text-[#1F5E4A]">
                  {selectedResident.houseId}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Peran Keluarga</dt>
                <dd className="text-[#1F2933]">
                  {selectedResident.familyRole.replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">NIK</dt>
                <dd className="font-mono text-xs text-[#1F2933]">
                  {selectedResident.nik || "Disembunyikan (PII terlindungi)"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Telepon / WhatsApp</dt>
                <dd className="font-mono text-xs text-[#1F2933]">
                  {selectedResident.contact?.phone || "Disembunyikan"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Email</dt>
                <dd className="text-xs text-[#1F2933]">
                  {selectedResident.contact?.email || "Disembunyikan"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Pekerjaan</dt>
                <dd className="text-[#1F2933]">
                  {selectedResident.occupation || "—"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Status Verifikasi</dt>
                <dd>
                  <StatusText
                    label={
                      selectedResident.verificationStatus === "verified"
                        ? "Terverifikasi"
                        : "Menunggu"
                    }
                    tone={
                      selectedResident.verificationStatus === "verified"
                        ? "success"
                        : "warning"
                    }
                  />
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#667085]">Terdaftar Sejak</dt>
                <dd className="text-xs text-[#667085]">
                  {formatDateJakarta(selectedResident.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* Register Resident Modal */}
      <Modal
        open={createResidentOpen}
        onClose={() => setCreateResidentOpen(false)}
        title="Registrasi Warga Baru"
        description="Data rumah tangga wajib terdaftar terlebih dahulu di RT 06 RW 01."
      >
        <form onSubmit={handleCreateResident} className="space-y-4">
          <FormField id="res-name" label="Nama Lengkap" required>
            <TextInput
              id="res-name"
              value={resForm.fullName}
              onChange={(e) =>
                setResForm((p) => ({ ...p, fullName: e.target.value }))
              }
              placeholder="Contoh: Hendra Wijaya"
            />
          </FormField>

          <FormField
            id="res-house"
            label="Unit Rumah Tangga"
            required
            helperText={
              households.length === 0
                ? "Belum ada rumah tangga. Silakan tambah unit rumah terlebih dahulu."
                : undefined
            }
          >
            <SelectInput
              id="res-house"
              value={resForm.houseId}
              onChange={(e) =>
                setResForm((p) => ({ ...p, houseId: e.target.value }))
              }
            >
              <option value="">-- Pilih Unit Rumah --</option>
              {households.map((h) => (
                <option key={h.houseId} value={h.houseId}>
                  {h.houseCode} — {h.addressLabel}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="res-nik"
              label="NIK (16 Digit)"
              helperText="Disimpan privat sesuai aturan PII."
            >
              <TextInput
                id="res-nik"
                maxLength={16}
                value={resForm.nik}
                onChange={(e) =>
                  setResForm((p) => ({ ...p, nik: e.target.value }))
                }
                placeholder="320501xxxxxxxxxx"
              />
            </FormField>

            <FormField id="res-role" label="Peran dalam Keluarga" required>
              <SelectInput
                id="res-role"
                value={resForm.familyRole}
                onChange={(e) =>
                  setResForm((p) => ({
                    ...p,
                    familyRole: e.target.value as typeof resForm.familyRole,
                  }))
                }
              >
                <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
                <option value="ISTRI">Istri</option>
                <option value="ANAK">Anak</option>
                <option value="FAMILI_LAIN">Famili Lain</option>
              </SelectInput>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="res-gender" label="Jenis Kelamin">
              <SelectInput
                id="res-gender"
                value={resForm.gender}
                onChange={(e) =>
                  setResForm((p) => ({
                    ...p,
                    gender: e.target.value as "LAKI_LAKI" | "PEREMPUAN",
                  }))
                }
              >
                <option value="LAKI_LAKI">Laki-laki</option>
                <option value="PEREMPUAN">Perempuan</option>
              </SelectInput>
            </FormField>

            <FormField id="res-birth" label="Tanggal Lahir">
              <TextInput
                id="res-birth"
                type="date"
                value={resForm.birthDate}
                onChange={(e) =>
                  setResForm((p) => ({ ...p, birthDate: e.target.value }))
                }
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="res-phone" label="Nomor HP / WhatsApp">
              <TextInput
                id="res-phone"
                value={resForm.phone}
                onChange={(e) =>
                  setResForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="0812xxxxxxxx"
              />
            </FormField>
            <FormField id="res-occupation" label="Pekerjaan">
              <TextInput
                id="res-occupation"
                value={resForm.occupation}
                onChange={(e) =>
                  setResForm((p) => ({ ...p, occupation: e.target.value }))
                }
                placeholder="Wiraswasta / Karyawan"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E7EC] pt-4">
            <Button
              variant="outline"
              onClick={() => setCreateResidentOpen(false)}
              disabled={savingResident}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={savingResident}
              iconLeft={<UserCheck className="h-4 w-4" aria-hidden="true" />}
            >
              Simpan Data Warga
            </Button>
          </div>
        </form>
      </Modal>

      {/* Register Household Modal */}
      <Modal
        open={createHouseOpen}
        onClose={() => setCreateHouseOpen(false)}
        title="Tambah Unit Rumah Tangga"
        description="Registrasi unit rumah di wilayah RT 06 RW 01 Green Garden Residence."
      >
        <form onSubmit={handleCreateHousehold} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="house-code" label="Kode Unit Rumah" required>
              <TextInput
                id="house-code"
                value={houseForm.houseCode}
                onChange={(e) =>
                  setHouseForm((p) => ({ ...p, houseCode: e.target.value }))
                }
                placeholder="GG-RT06-001"
              />
            </FormField>
            <FormField id="house-block" label="Blok" required>
              <TextInput
                id="house-block"
                value={houseForm.blockName}
                onChange={(e) =>
                  setHouseForm((p) => ({ ...p, blockName: e.target.value }))
                }
                placeholder="Blok A"
              />
            </FormField>
          </div>

          <FormField id="house-address" label="Label Alamat Unit" required>
            <TextInput
              id="house-address"
              value={houseForm.addressLabel}
              onChange={(e) =>
                setHouseForm((p) => ({ ...p, addressLabel: e.target.value }))
              }
              placeholder="Blok A No. 01, Perum Green Garden Residence"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="house-status" label="Status Hunian">
              <SelectInput
                id="house-status"
                value={houseForm.occupancyStatus}
                onChange={(e) =>
                  setHouseForm((p) => ({
                    ...p,
                    occupancyStatus: e.target
                      .value as typeof houseForm.occupancyStatus,
                  }))
                }
              >
                <option value="OCCUPIED">Dihuni Pemilik</option>
                <option value="RENTED">Disewa</option>
                <option value="VACANT">Kosong</option>
              </SelectInput>
            </FormField>

            <FormField id="house-head" label="Nama Kepala Keluarga">
              <TextInput
                id="house-head"
                value={houseForm.headResidentName}
                onChange={(e) =>
                  setHouseForm((p) => ({
                    ...p,
                    headResidentName: e.target.value,
                  }))
                }
                placeholder="Opsional"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E7EC] pt-4">
            <Button
              variant="outline"
              onClick={() => setCreateHouseOpen(false)}
              disabled={savingHouse}
            >
              Batal
            </Button>
            <Button type="submit" loading={savingHouse}>
              Simpan Rumah Tangga
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
