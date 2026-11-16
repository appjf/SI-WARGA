"use client";

import React from "react";
import { AlertTriangle, FolderOpen, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "./Button";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Memuat data"
      className="space-y-3 rounded-xl border border-[#E4E7EC] bg-white p-5"
    >
      <div className="h-4 w-1/3 animate-pulse rounded bg-[#EFF2EE]" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 border-t border-[#E4E7EC] pt-3"
        >
          <div className="h-4 w-2/5 animate-pulse rounded bg-[#EFF2EE]" />
          <div className="h-4 w-1/5 animate-pulse rounded bg-[#EFF2EE]" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-[#EFF2EE]" />
        </div>
      ))}
      <span className="sr-only">Memuat data...</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#E4E7EC] bg-white px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF2EE] text-[#1F5E4A]">
        <FolderOpen className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#1F2933]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#667085]">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Gagal Memuat Data",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-[#B42318]/25 bg-white px-6 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B42318]/10 text-[#B42318]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#1F2933]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#667085]">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            onClick={onRetry}
            iconLeft={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}

export function ForbiddenState({
  title = "Akses Dibatasi",
  message = "Peran akun Anda tidak memiliki kewenangan untuk mengakses halaman atau tindakan ini.",
  actionLabel = "Kembali ke Dashboard",
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#E4E7EC] bg-white px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A15C00]/10 text-[#A15C00]">
        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[#1F2933]">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#667085]">
        {message}
      </p>
      {onAction && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
