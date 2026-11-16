"use client";

import React, { useState } from "react";
import { ShieldCheck, KeyRound, User, Home } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ROLE_LABELS } from "@/lib/rbac/matrix";
import { bffApi, BffClientError } from "@/services/api-client";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput } from "@/components/ui/FormFields";
import { StatusText } from "@/components/ui/StatusText";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      showToast({
        variant: "error",
        title: "Nama tidak valid",
        description: "Nama tampilan minimal 2 karakter.",
      });
      return;
    }

    setSaving(true);
    try {
      await bffApi.updateMe({ displayName: displayName.trim() });
      await refreshProfile();
      showToast({
        variant: "success",
        title: "Profil diperbarui",
        description: "Nama tampilan akun Anda berhasil disimpan.",
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal memperbarui profil",
        description:
          err instanceof BffClientError
            ? err.message
            : "Terjadi kesalahan saat menyimpan.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Account & Profile Edit */}
        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6 lg:col-span-6">
          <div className="flex items-center gap-3 border-b border-[#E4E7EC] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5E4A]/10 text-[#1F5E4A]">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1F2933]">
                Identitas Akun Terverifikasi
              </h2>
              <p className="text-xs text-[#667085]">
                Data sesi diverifikasi server melalui Firebase Auth &amp; BFF
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2.5">
              <dt className="text-[#667085]">UID Pengguna</dt>
              <dd className="font-mono text-xs text-[#1F2933]">{profile.uid}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2.5">
              <dt className="text-[#667085]">Email</dt>
              <dd className="font-medium text-[#1F2933]">
                {profile.email || "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2.5">
              <dt className="text-[#667085]">Status Akun</dt>
              <dd>
                <StatusText
                  label={profile.status === "active" ? "Aktif" : profile.status}
                  tone={profile.status === "active" ? "success" : "warning"}
                />
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2.5">
              <dt className="flex items-center gap-1.5 text-[#667085]">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ID Rumah / Warga</span>
              </dt>
              <dd className="font-mono text-xs text-[#1F2933]">
                {profile.houseId || "Belum ditautkan"} /{" "}
                {profile.residentId || "—"}
              </dd>
            </div>
          </dl>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <FormField
              id="profile-display-name"
              label="Nama Tampilan"
              required
              helperText="Perubahan peran atau status akun hanya dapat dilakukan oleh administrator berwenang."
            >
              <TextInput
                id="profile-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama lengkap Anda"
              />
            </FormField>
            <Button type="submit" loading={saving}>
              Simpan Nama Tampilan
            </Button>
          </form>
        </section>

        {/* Server-Verified Roles & Permissions */}
        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6 lg:col-span-6">
          <div className="flex items-center gap-3 border-b border-[#E4E7EC] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5E4A]/10 text-[#1F5E4A]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1F2933]">
                Peran &amp; Matriks Izin Aktif
              </h2>
              <p className="text-xs text-[#667085]">
                Ditegakkan pada lapisan BFF API dan Firestore Rules
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-[#667085]">
                Peran Ditetapkan Server
              </h3>
              <div className="mt-2 space-y-2">
                {profile.roles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] px-3.5 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-[#1F2933]">
                      {ROLE_LABELS[role] || role}
                    </span>
                    <span className="font-mono text-xs text-[#1F5E4A]">
                      {role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#667085]">
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Izin Efektif ({profile.permissions.length})</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {profile.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="rounded-md border border-[#E4E7EC] px-2.5 py-1.5 font-mono text-xs text-[#1F2933]"
                  >
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
