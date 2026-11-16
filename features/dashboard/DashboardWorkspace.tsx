"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building,
  Lock,
  Megaphone,
  MessageSquareWarning,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import { resolveDashboardConfig } from "./role-config";
import { ROLE_LABELS } from "@/lib/rbac/matrix";
import { formatDateJakarta, formatIdr } from "@/lib/formatters";
import {
  getComplaintStatusMeta,
  getTransactionStatusMeta,
  StatusText,
} from "@/components/ui/StatusText";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import type {
  AnnouncementRecord,
  ComplaintRecord,
  DashboardReportData,
  TransactionRecord,
} from "@/types";

export function DashboardWorkspace() {
  const { profile, can } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardReportData | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<
    TransactionRecord[]
  >([]);

  const canReadFinance = can("finance:read");

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    try {
      const [dashRes, annRes, compRes, finRes] = await Promise.all([
        bffApi.getDashboard(),
        bffApi.listAnnouncements().catch(() => ({ success: true, data: [] })),
        bffApi
          .listComplaints({ limit: 5 })
          .catch(() => ({ success: true, data: [] })),
        canReadFinance
          ? bffApi
              .listTransactions({ status: "PENDING_APPROVAL", limit: 5 })
              .catch(() => ({ success: true, data: [] }))
          : Promise.resolve({ success: true, data: [] }),
      ]);

      setDashboard(dashRes.data ?? null);
      setAnnouncements((annRes.data ?? []).slice(0, 3));
      setComplaints((compRes.data ?? []).slice(0, 5));
      setPendingTransactions((finRes.data ?? []).slice(0, 5));
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat ringkasan dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [profile, canReadFinance]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  if (!profile) return null;

  const config = resolveDashboardConfig(profile.roles);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={4} />
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadData()} />;
  }

  return (
    <div className="space-y-6">
      {/* Role Header & Quick Actions */}
      <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#1F5E4A]">
              Peran Aktif: {ROLE_LABELS[config.primaryRole]} ·{" "}
              {dashboard?.operationalArea || "RT 06 RW 01 Green Garden Residence"}
            </p>
            <h2 className="text-xl font-bold text-[#1F2933] sm:text-2xl">
              {config.headline}
            </h2>
            <p className="max-w-2xl text-sm text-[#667085]">
              {config.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {config.quickActions.map((action, idx) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  idx === 0
                    ? "bg-[#1F5E4A] text-white hover:bg-[#174939]"
                    : "border border-[#E4E7EC] bg-white text-[#1F2933] hover:bg-[#F7F8F6]"
                }`}
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Primary KPI Grid */}
      <section aria-label="Ringkasan indikator lingkungan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#667085]">
              Warga Terdaftar
            </span>
            <Users className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {dashboard?.totalResidents ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            Basis data kependudukan RT 06
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#667085]">
              Unit Rumah Tangga
            </span>
            <Building className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {dashboard?.totalHouseholds ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            Persil &amp; kepala keluarga aktif
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#667085]">
              Total Tiket Pengaduan
            </span>
            <MessageSquareWarning
              className="h-4 w-4 text-[#A15C00]"
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {dashboard?.totalComplaints ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            Laporan fasilitas &amp; aspirasi
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#667085]">
              Saldo Kas Terposting
            </span>
            {canReadFinance ? (
              <Wallet className="h-4 w-4 text-[#217A45]" aria-hidden="true" />
            ) : (
              <Lock className="h-4 w-4 text-[#667085]" aria-hidden="true" />
            )}
          </div>
          {canReadFinance && dashboard?.financialSummary ? (
            <>
              <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
                {formatIdr(dashboard.financialSummary.balance)}
              </p>
              <p className="mt-1 text-xs text-[#667085] tabular-nums">
                Masuk {formatIdr(dashboard.financialSummary.totalIncome)} · Keluar{" "}
                {formatIdr(dashboard.financialSummary.totalExpense)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-semibold text-[#667085]">
                Terbatas untuk Bendahara &amp; Ketua RT
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                {dashboard?.notice || "Sesuai matriks otorisasi server."}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Operational Split: Recent Complaints + Announcements / Approvals */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Complaints */}
        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
            <div>
              <h3 className="text-base font-semibold text-[#1F2933]">
                {can("complaints:manage")
                  ? "Antrean Pengaduan Warga Terbaru"
                  : "Pengaduan & Aspirasi Terbaru"}
              </h3>
              <p className="text-xs text-[#667085]">
                Pemantauan status tiket pengaduan RT 06 RW 01
              </p>
            </div>
            <Link
              href="/complaints"
              className="text-xs font-semibold text-[#1F5E4A] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {complaints.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#667085]">
              Belum ada pengaduan yang tercatat.
            </p>
          ) : (
            <ul className="divide-y divide-[#E4E7EC]">
              {complaints.map((c) => {
                const meta = getComplaintStatusMeta(c.status);
                return (
                  <li
                    key={c.ticketId}
                    className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1F2933]">
                        {c.title || c.description}
                      </p>
                      <p className="mt-0.5 text-xs text-[#667085]">
                        {c.category} · Prioritas {c.priority} ·{" "}
                        {formatDateJakarta(c.createdAt)}
                      </p>
                    </div>
                    <StatusText label={meta.label} tone={meta.tone} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Right Column: Financial Approvals (if finance:read) + Announcements */}
        <div className="space-y-6 lg:col-span-5">
          {canReadFinance && (
            <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
                <div>
                  <h3 className="text-base font-semibold text-[#1F2933]">
                    Transaksi Menunggu Persetujuan
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Memerlukan reviewer independen (Separation of Duties)
                  </p>
                </div>
                <Link
                  href="/finance"
                  className="text-xs font-semibold text-[#1F5E4A] hover:underline"
                >
                  Buka Kas
                </Link>
              </div>

              {pendingTransactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#667085]">
                  Tidak ada transaksi yang menunggu persetujuan.
                </p>
              ) : (
                <ul className="divide-y divide-[#E4E7EC]">
                  {pendingTransactions.map((tx) => {
                    const meta = getTransactionStatusMeta(tx.status);
                    return (
                      <li
                        key={tx.transactionId}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1F2933]">
                            {tx.description || tx.categoryId}
                          </p>
                          <p className="text-xs text-[#667085]">
                            {tx.type === "income" ? "Pemasukan" : "Pengeluaran"} ·
                            Periode {tx.period}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-[#1F2933] tabular-nums">
                            {formatIdr(tx.amount)}
                          </p>
                          <StatusText label={meta.label} tone={meta.tone} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          <section className="rounded-xl border border-[#E4E7EC] bg-white p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
              <div className="flex items-center gap-2">
                <Megaphone
                  className="h-4 w-4 text-[#1F5E4A]"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-[#1F2933]">
                  Pengumuman Lingkungan
                </h3>
              </div>
              <Link
                href="/notifications"
                className="text-xs font-semibold text-[#1F5E4A] hover:underline"
              >
                Pusat Info
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="py-6 text-center">
                <Bell
                  className="mx-auto h-6 w-6 text-[#667085]/60"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm text-[#667085]">
                  Belum ada pengumuman terbaru dari pengurus RT 06.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E4E7EC]">
                {announcements.map((ann) => (
                  <li key={ann.announcementId} className="py-3.5">
                    <p className="text-sm font-semibold text-[#1F2933]">
                      {ann.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#667085]">
                      {ann.content}
                    </p>
                    <p className="mt-1.5 text-[11px] text-[#667085]">
                      {ann.category} · {formatDateJakarta(ann.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
