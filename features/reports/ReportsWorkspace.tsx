"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Building,
  Download,
  Lock,
  MapPin,
  MessageSquareWarning,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import { formatDateTimeJakarta, formatIdr } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { BreakdownList, DualBarChart } from "@/components/ui/Charts";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";

interface AnalyticsPayload {
  generatedAt: string;
  operationalArea: string;
  residents: {
    total: number;
    verified: number;
    pending: number;
    byFamilyRole: Record<string, number>;
    totalHouseholds: number;
  };
  complaints: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  assets: {
    total: number;
    totalValueIdr: number;
    byCondition: Record<string, number>;
    byLayer: Record<string, number>;
  };
  finance: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingCount: number;
    postedCount: number;
    byPeriod: Array<{ period: string; income: number; expense: number }>;
    byCategory: Record<string, number>;
  } | null;
}

const EXPORT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN_RW",
  "KETUA_RT",
  "SEKRETARIS_RT",
  "BENDAHARA_RT",
] as const;

export function ReportsWorkspace() {
  const { profile, can, hasAnyRole } = useAuth();
  const { showToast } = useToast();

  const canReadFinance = can("finance:read");
  const canExport = hasAnyRole([...EXPORT_ROLES]);

  const [report, setReport] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bffApi.getAnalytics();
      setReport(res.data ?? null);
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat laporan analitik GGR-ICMS."
      );
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadAnalytics();
    });
    return () => {
      active = false;
    };
  }, [loadAnalytics]);

  const handleExport = async (format: "csv" | "json") => {
    if (!canExport) return;
    setExporting(format);
    try {
      const res = await bffApi.getAnalytics(format);
      const data = res.data;
      if (!data) throw new Error("Data laporan kosong");

      let blob: Blob;
      let filename: string;
      const dateStamp = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        filename = `GGR-ICMS-RT06-Laporan-${dateStamp}.json`;
      } else {
        const rows: string[][] = [
          ["Kategori", "Metrik", "Nilai"],
          ["Wilayah", "Area Operasional", data.operationalArea],
          ["Kependudukan", "Total Warga Terdaftar", String(data.residents.total)],
          ["Kependudukan", "Warga Terverifikasi", String(data.residents.verified)],
          ["Kependudukan", "Total Rumah Tangga", String(data.residents.totalHouseholds)],
          ["Pengaduan", "Total Tiket", String(data.complaints.total)],
          ["Aset Spasial", "Total Unit Aset", String(data.assets.total)],
          ["Aset Spasial", "Total Nilai Aset (IDR)", String(data.assets.totalValueIdr)],
        ];

        if (data.finance) {
          rows.push(["Keuangan", "Total Pemasukan Terposting (IDR)", String(data.finance.totalIncome)]);
          rows.push(["Keuangan", "Total Pengeluaran Terposting (IDR)", String(data.finance.totalExpense)]);
          rows.push(["Keuangan", "Saldo Kas (IDR)", String(data.finance.balance)]);
          for (const p of data.finance.byPeriod) {
            rows.push([
              `Keuangan Periode ${p.period}`,
              "Pemasukan / Pengeluaran (IDR)",
              `${p.income} / ${p.expense}`,
            ]);
          }
        }

        const csvContent = rows
          .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
          .join("\n");
        blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        filename = `GGR-ICMS-RT06-Laporan-${dateStamp}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      showToast({
        variant: "success",
        title: `Ekspor ${format.toUpperCase()} berhasil`,
        description: `File ${filename} diunduh dan tercatat di log audit server.`,
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mengekspor laporan",
        description: err instanceof BffClientError ? err.message : undefined,
      });
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={4} />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <ErrorState
        message={error || "Laporan belum tersedia."}
        onRetry={() => void loadAnalytics()}
      />
    );
  }

  const familyRoleItems = Object.entries(report.residents.byFamilyRole).map(
    ([label, count]) => ({ label, count, color: "#1F5E4A" })
  );

  const complaintStatusItems = Object.entries(report.complaints.byStatus).map(
    ([label, count]) => ({
      label,
      count,
      color:
        label === "RESOLVED" || label === "CLOSED"
          ? "#217A45"
          : label === "REJECTED"
            ? "#B42318"
            : "#D9A441",
    })
  );

  const assetConditionItems = Object.entries(report.assets.byCondition).map(
    ([label, count]) => ({
      label,
      count,
      color:
        label === "GOOD"
          ? "#217A45"
          : label === "CRITICAL"
            ? "#B42318"
            : "#D9A441",
    })
  );

  const assetLayerItems = Object.entries(report.assets.byLayer).map(
    ([label, count]) => ({ label, count, color: "#2C7A5B" })
  );

  return (
    <div className="space-y-6">
      {/* Header & Role-Gated Export Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2933]">
            Laporan &amp; Analitik Terpadu RT 06
          </h2>
          <p className="text-sm text-[#667085]">
            Agregasi statistik kependudukan, keuangan, pengaduan, dan inventaris aset per{" "}
            {formatDateTimeJakarta(report.generatedAt)}.
          </p>
        </div>

        {canExport ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              loading={exporting === "csv"}
              iconLeft={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => void handleExport("csv")}
            >
              Ekspor CSV
            </Button>
            <Button
              variant="outline"
              loading={exporting === "json"}
              iconLeft={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => void handleExport("json")}
            >
              Ekspor JSON
            </Button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-[#667085]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ekspor laporan resmi khusus Pengurus / Pengelola RT</span>
          </div>
        )}
      </div>

      {/* Top Executive Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Populasi Warga</span>
            <Users className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {report.residents.total}
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            {report.residents.verified} terverifikasi · {report.residents.pending} pending
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Unit Rumah Tangga</span>
            <Building className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {report.residents.totalHouseholds}
          </p>
          <p className="mt-1 text-xs text-[#667085]">Persil hunian RT 06 RW 01</p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Total Pengaduan</span>
            <MessageSquareWarning className="h-4 w-4 text-[#A15C00]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {report.complaints.total}
          </p>
          <p className="mt-1 text-xs text-[#667085]">Rekap tiket warga</p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Nilai Inventaris Aset</span>
            <MapPin className="h-4 w-4 text-[#217A45]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-[#1F2933] tabular-nums">
            {formatIdr(report.assets.totalValueIdr)}
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            {report.assets.total} aset spasial terdaftar
          </p>
        </div>
      </div>

      {/* Finance Visualization (RBAC Gated) */}
      <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E7EC] pb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#1F2933]">
              Analitik Arus Kas RT 06 Per Periode
            </h3>
          </div>
          {canReadFinance && report.finance && (
            <span className="font-mono text-sm font-bold text-[#1F5E4A] tabular-nums">
              Saldo: {formatIdr(report.finance.balance)}
            </span>
          )}
        </div>

        {canReadFinance && report.finance ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <DualBarChart
                data={report.finance.byPeriod.map((p) => ({
                  label: p.period,
                  primaryValue: p.income,
                  secondaryValue: p.expense,
                }))}
                primaryLabel="Pemasukan Terposting"
                secondaryLabel="Pengeluaran Terposting"
                formatValue={formatIdr}
              />
            </div>
            <div className="space-y-3 rounded-lg bg-[#F7F8F6] p-4 text-xs lg:col-span-4">
              <p className="font-semibold text-[#1F2933]">Ringkasan Status Buku Kas</p>
              <div className="flex justify-between">
                <span className="text-[#667085]">Total Pemasukan</span>
                <span className="font-mono font-semibold text-[#217A45] tabular-nums">
                  {formatIdr(report.finance.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Total Pengeluaran</span>
                <span className="font-mono font-semibold text-[#B42318] tabular-nums">
                  {formatIdr(report.finance.totalExpense)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E4E7EC] pt-2">
                <span className="text-[#667085]">Transaksi Terposting</span>
                <span className="font-mono font-semibold text-[#1F2933] tabular-nums">
                  {report.finance.postedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Menunggu Approval</span>
                <span className="font-mono font-semibold text-[#A15C00] tabular-nums">
                  {report.finance.pendingCount}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-8 text-sm text-[#667085]">
            <Lock className="h-5 w-5 shrink-0 text-[#667085]" aria-hidden="true" />
            <p>
              Rincian keuangan kas RT hanya dapat diakses oleh peran yang memiliki izin{" "}
              <code className="font-mono text-xs">finance:read</code> (Bendahara RT, Ketua RT,
              Admin RW, Super Admin).
            </p>
          </div>
        )}
      </section>

      {/* Residents, Complaints & Spatial Asset Distributions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
          <div className="flex items-center gap-2 border-b border-[#E4E7EC] pb-3">
            <BarChart3 className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#1F2933]">
              Komposisi Peran Keluarga
            </h3>
          </div>
          <div className="mt-4">
            <BreakdownList items={familyRoleItems} />
          </div>
        </section>

        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
          <div className="flex items-center gap-2 border-b border-[#E4E7EC] pb-3">
            <MessageSquareWarning className="h-4 w-4 text-[#A15C00]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#1F2933]">
              Distribusi Status Pengaduan
            </h3>
          </div>
          <div className="mt-4">
            <BreakdownList items={complaintStatusItems} />
          </div>
        </section>

        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
          <div className="flex items-center gap-2 border-b border-[#E4E7EC] pb-3">
            <MapPin className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#1F2933]">
              Kondisi &amp; Layer Aset Spasial
            </h3>
          </div>
          <div className="mt-4 space-y-5">
            <BreakdownList items={assetConditionItems} />
            {assetLayerItems.length > 0 && (
              <div className="border-t border-[#E4E7EC] pt-4">
                <p className="mb-2 text-xs font-semibold text-[#667085]">
                  Sebaran per Layer Spasial
                </p>
                <BreakdownList items={assetLayerItems} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
