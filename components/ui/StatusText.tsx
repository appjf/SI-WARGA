"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

interface StatusTextProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

const TONE_MAP: Record<StatusTone, { color: string; Icon: React.ElementType }> = {
  success: { color: "text-[#217A45]", Icon: CheckCircle2 },
  warning: { color: "text-[#A15C00]", Icon: AlertTriangle },
  danger: { color: "text-[#B42318]", Icon: XCircle },
  info: { color: "text-[#1F5E4A]", Icon: Clock },
  neutral: { color: "text-[#667085]", Icon: ShieldCheck },
};

/**
 * Clean unboxed status indicator pairing semantic color with explicit icon + label.
 * Complies with Zero-Pill & No-Hue-Only-Signaling rules.
 */
export function StatusText({
  label,
  tone = "neutral",
  className,
}: StatusTextProps) {
  const { color, Icon } = TONE_MAP[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap",
        color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function getTransactionStatusMeta(status: string): {
  label: string;
  tone: StatusTone;
} {
  switch (status) {
    case "POSTED":
    case "APPROVED":
      return { label: "Disetujui & Terposting", tone: "success" };
    case "PENDING_APPROVAL":
      return { label: "Menunggu Persetujuan", tone: "warning" };
    case "REJECTED":
      return { label: "Ditolak", tone: "danger" };
    case "REVERSED":
      return { label: "Dibatalkan (Reversal)", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function getComplaintStatusMeta(status: string): {
  label: string;
  tone: StatusTone;
  Icon?: React.ElementType;
} {
  switch (status) {
    case "SUBMITTED":
      return { label: "Diajukan", tone: "info" };
    case "VERIFIED":
      return { label: "Terverifikasi", tone: "info" };
    case "ASSIGNED":
      return { label: "Ditugaskan", tone: "warning" };
    case "IN_PROGRESS":
      return { label: "Sedang Ditindaklanjuti", tone: "warning", Icon: Wrench };
    case "RESOLVED":
      return { label: "Selesai Ditangani", tone: "success" };
    case "CLOSED":
      return { label: "Ditutup", tone: "neutral" };
    case "REJECTED":
      return { label: "Ditolak", tone: "danger" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function getConditionStatusMeta(condition: string): {
  label: string;
  tone: StatusTone;
} {
  switch (condition) {
    case "GOOD":
      return { label: "Baik", tone: "success" };
    case "FAIR":
      return { label: "Cukup / Perlu Pantauan", tone: "warning" };
    case "POOR":
      return { label: "Rusak Ringan", tone: "warning" };
    case "CRITICAL":
      return { label: "Rusak Berat / Kritis", tone: "danger" };
    default:
      return { label: condition, tone: "neutral" };
  }
}

export { RotateCcw, Wrench };
