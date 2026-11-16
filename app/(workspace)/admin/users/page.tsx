"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Edit3 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/rbac/matrix";
import { bffApi, BffClientError } from "@/services/api-client";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectInput, TextInput } from "@/components/ui/FormFields";
import { ErrorState, ForbiddenState } from "@/components/ui/States";
import { StatusText } from "@/components/ui/StatusText";

interface AdminUserRow {
  uid: string;
  email: string;
  displayName: string;
  roles: Role[];
  status: "active" | "inactive" | "disabled" | "pending";
  residentId: string | null;
  houseId: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { can } = useAuth();
  const { showToast } = useToast();

  const canRead = can("users:read");
  const canManageRoles = can("users:manage_roles");

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(["WARGA"]);
  const [selectedStatus, setSelectedStatus] =
    useState<AdminUserRow["status"]>("active");
  const [houseIdInput, setHouseIdInput] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bffApi.listAdminUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat daftar akun pengguna."
      );
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadUsers();
    });
    return () => {
      active = false;
    };
  }, [loadUsers]);

  if (!canRead) {
    return (
      <ForbiddenState
        title="Akses Manajemen Pengguna Terbatas"
        message="Halaman ini hanya tersedia untuk Super Administrator, Admin RW, dan Ketua RT."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  const openEditModal = (u: AdminUserRow) => {
    setEditingUser(u);
    setSelectedRoles(u.roles.length ? u.roles : ["WARGA"]);
    setSelectedStatus(u.status);
    setHouseIdInput(u.houseId || "");
  };

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (selectedRoles.length === 0) {
      showToast({
        variant: "error",
        title: "Minimal 1 peran",
        description: "Pilih setidaknya satu peran RBAC untuk akun ini.",
      });
      return;
    }

    setSaving(true);
    try {
      await bffApi.updateAdminUser(editingUser.uid, {
        roles: selectedRoles,
        status: selectedStatus,
        houseId: houseIdInput.trim() || null,
      });
      showToast({
        variant: "success",
        title: "Peran pengguna diperbarui",
        description: `Hak akses untuk ${editingUser.email || editingUser.uid} telah disimpan.`,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menyimpan perubahan",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      key: "user",
      header: "Pengguna",
      render: (row) => (
        <div>
          <p className="font-medium text-[#1F2933]">
            {row.displayName || "Pengguna Terdaftar"}
          </p>
          <p className="text-xs text-[#667085]">{row.email || row.uid}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Peran RBAC",
      render: (row) => (
        <span className="text-xs font-medium text-[#1F2933]">
          {row.roles.map((r) => ROLE_LABELS[r] || r).join(" · ")}
        </span>
      ),
    },
    {
      key: "houseId",
      header: "Unit Rumah",
      render: (row) => (
        <span className="font-mono text-xs text-[#667085]">
          {row.houseId || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusText
          label={row.status === "active" ? "Aktif" : row.status}
          tone={
            row.status === "active"
              ? "success"
              : row.status === "disabled"
                ? "danger"
                : "warning"
          }
        />
      ),
    },
    {
      key: "actions",
      header: "Tindakan",
      align: "right",
      render: (row) =>
        canManageRoles ? (
          <Button
            size="sm"
            variant="outline"
            iconLeft={<Edit3 className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => openEditModal(row)}
          >
            Atur Peran
          </Button>
        ) : (
          <span className="text-xs text-[#667085]">Lihat saja</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-xl border border-[#E4E7EC] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F5E4A]/10 text-[#1F5E4A]">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F2933]">
              Pengelolaan Akun &amp; Peran Kepengurusan
            </h2>
            <p className="text-sm text-[#667085]">
              Penetapan hak akses berbasis peran dilakukan secara terpusat di
              server dan dicatat dalam audit log.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={() => void loadUsers()} />
      ) : (
        <DataTable
          data={users}
          columns={columns}
          keyExtractor={(r) => r.uid}
          loading={loading}
          searchPlaceholder="Cari nama, email, atau UID..."
          searchFilter={(row, q) =>
            (row.displayName || "").toLowerCase().includes(q) ||
            (row.email || "").toLowerCase().includes(q) ||
            row.uid.toLowerCase().includes(q)
          }
          emptyTitle="Belum Ada Pengguna Tercatat"
          emptyDescription="Pengguna yang masuk ke portal akan muncul di sini untuk ditautkan ke unit rumah atau peran pengurus."
        />
      )}

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Atur Peran & Status Akun"
        description={editingUser?.email || editingUser?.uid}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <span className="block text-sm font-medium text-[#1F2933]">
              Pilih Peran RBAC
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_ROLES.map((role) => {
                const checked = selectedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                      checked
                        ? "border-[#1F5E4A] bg-[#1F5E4A]/5 text-[#1F5E4A]"
                        : "border-[#E4E7EC] bg-white text-[#1F2933]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role)}
                      className="h-4 w-4 accent-[#1F5E4A]"
                    />
                    <span>{ROLE_LABELS[role]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <FormField id="admin-user-status" label="Status Akun" required>
            <SelectInput
              id="admin-user-status"
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as AdminUserRow["status"])
              }
            >
              <option value="active">Aktif</option>
              <option value="pending">Menunggu Aktivasi</option>
              <option value="inactive">Nonaktif Sementara</option>
              <option value="disabled">Diblokir / Suspended</option>
            </SelectInput>
          </FormField>

          <FormField
            id="admin-user-house"
            label="ID Unit Rumah Tangga (Opsional)"
            helperText="Contoh: house-gg-rt06-001 untuk menautkan akun warga ke data keluarga."
          >
            <TextInput
              id="admin-user-house"
              value={houseIdInput}
              onChange={(e) => setHouseIdInput(e.target.value)}
              placeholder="house-gg-rt06-001"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E7EC] pt-4">
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
