"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/layouts/PublicShell";
import { ForbiddenState } from "@/components/ui/States";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl py-8">
        <ForbiddenState
          title="Akses Tidak Diizinkan (401 / 403)"
          message="Sesi Anda belum terautentikasi atau peran akun Anda tidak memiliki izin untuk mengakses halaman tersebut."
          actionLabel="Kembali ke Dashboard"
          onAction={() => router.push("/dashboard")}
        />
      </div>
    </PublicShell>
  );
}
