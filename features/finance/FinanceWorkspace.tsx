"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import { formatDateTimeJakarta, formatIdr } from "@/lib/formatters";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import {
  FormField,
  SelectInput,
  TextareaInput,
  TextInput,
} from "@/components/ui/FormFields";
import { ErrorState, ForbiddenState } from "@/components/ui/States";
import {
  getTransactionStatusMeta,
  StatusText,
} from "@/components/ui/StatusText";
import type { DashboardReportData, TransactionRecord } from "@/types";

const FINANCE_CATEGORIES = [
  { id: "CAT-IURAN", label: "Iuran Warga Bulanan" },
  { id: "CAT-KEAMANAN", label: "Operasional Keamanan / Ronda" },
  { id: "CAT-KEBERSIHAN", label: "Pengelolaan Sampah & Kebersihan" },
  { id: "CAT-INFRASTRUKTUR", label: "Pemeliharaan Jalan & Drainase" },
  { id: "CAT-SOSIAL", label: "Dana Sosial & Kegiatan Warga" },
  { id: "CAT-OPERASIONAL", label: "Administrasi & Kesekretariatan" },
];

export function FinanceWorkspace() {
  const router = useRouter();
  const { profile, can } = useAuth();
  const { showToast } = useToast();

  const canRead = can("finance:read");
  const canWrite = can("finance:write");
  const canApprove = can("finance:approve");

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [summary, setSummary] =
    useState<DashboardReportData["financialSummary"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("");

  // Create transaction modal
  const [createOpen, setCreateOpen] = useState(false);
  const [txForm, setTxForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    categoryId: "CAT-IURAN",
    period: "2026-11",
    description: "",
  });
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
  const [submittingTx, setSubmittingTx] = useState(false);

  // Approve / Reject dialog
  const [approvalTarget, setApprovalTarget] = useState<{
    tx: TransactionRecord;
    action: "APPROVE" | "REJECT";
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  // Reversal modal
  const [reversalTarget, setReversalTarget] =
    useState<TransactionRecord | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [processingReversal, setProcessingReversal] = useState(false);

  const loadFinance = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);

    try {
      const [dashRes, txRes] = await Promise.all([
        bffApi.getDashboard(),
        bffApi.listTransactions({
          type: typeFilter !== "ALL" ? typeFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          period: periodFilter.trim() || undefined,
          limit: 50,
        }),
      ]);

      setSummary(dashRes.data?.financialSummary ?? null);
      setTransactions(txRes.data || []);
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat data keuangan RT 06."
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, typeFilter, statusFilter, periodFilter]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadFinance();
    });
    return () => {
      active = false;
    };
  }, [loadFinance]);

  if (!canRead) {
    return (
      <ForbiddenState
        title="Akses Ledger Keuangan Dibatasi"
        message="Modul keuangan hanya dapat diakses oleh Bendahara RT, Ketua RT, Admin RW, dan Super Administrator."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(txForm.amount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      showToast({
        variant: "error",
        title: "Nominal tidak valid",
        description:
          "Nominal wajib berupa bilangan bulat Rupiah (integer) lebih besar dari 0.",
      });
      return;
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(txForm.period)) {
      showToast({
        variant: "error",
        title: "Format periode tidak valid",
        description: "Gunakan format YYYY-MM, misalnya 2026-11.",
      });
      return;
    }

    setSubmittingTx(true);
    try {
      const res = await bffApi.createTransaction({
        type: txForm.type,
        amount: numericAmount,
        categoryId: txForm.categoryId,
        period: txForm.period,
        description: txForm.description.trim(),
        idempotencyKey,
      });

      showToast({
        variant: "success",
        title: res.meta?.idempotentReplay
          ? "Transaksi Idempoten Dikembalikan"
          : "Transaksi Dicatat (Menunggu Persetujuan)",
        description: `ID: ${res.data?.transactionId} · ${formatIdr(numericAmount)}`,
      });
      setCreateOpen(false);
      setTxForm((p) => ({ ...p, amount: "", description: "" }));
      setIdempotencyKey(
        `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      );
      await loadFinance();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mencatat transaksi",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleConfirmApproval = async () => {
    if (!approvalTarget) return;
    if (
      approvalTarget.action === "REJECT" &&
      rejectionReason.trim().length < 5
    ) {
      showToast({
        variant: "error",
        title: "Alasan penolakan diperlukan",
        description: "Masukkan alasan penolakan minimal 5 karakter.",
      });
      return;
    }

    setProcessingApproval(true);
    try {
      await bffApi.approveTransaction(approvalTarget.tx.transactionId, {
        action: approvalTarget.action,
        rejectionReason:
          approvalTarget.action === "REJECT"
            ? rejectionReason.trim()
            : undefined,
      });

      showToast({
        variant: "success",
        title:
          approvalTarget.action === "APPROVE"
            ? "Transaksi Disetujui & Terposting"
            : "Transaksi Ditolak",
        description: `Transaksi ${approvalTarget.tx.transactionId} telah diproses.`,
      });
      setApprovalTarget(null);
      setRejectionReason("");
      await loadFinance();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Persetujuan gagal",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget) return;
    if (reversalReason.trim().length < 5) {
      showToast({
        variant: "error",
        title: "Alasan reversal terlalu singkat",
        description: "Jelaskan alasan pembalikan transaksi minimal 5 karakter.",
      });
      return;
    }

    setProcessingReversal(true);
    try {
      await bffApi.reverseTransaction({
        originalTransactionId: reversalTarget.transactionId,
        reason: reversalReason.trim(),
        idempotencyKey: `rev-${reversalTarget.transactionId}-${Date.now()}`,
      });
      showToast({
        variant: "success",
        title: "Reversal Ledger Berhasil",
        description: `Transaksi penyeimbang telah dibuat untuk ${reversalTarget.transactionId}.`,
      });
      setReversalTarget(null);
      setReversalReason("");
      await loadFinance();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Reversal gagal",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setProcessingReversal(false);
    }
  };

  const columns: ColumnDef<TransactionRecord>[] = [
    {
      key: "description",
      header: "Transaksi & Kategori",
      render: (row) => (
        <div>
          <p className="font-medium text-[#1F2933]">
            {row.description || row.categoryId}
          </p>
          <p className="mt-0.5 font-mono text-xs text-[#667085]">
            {row.categoryId} · Periode {row.period} ·{" "}
            {formatDateTimeJakarta(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Jenis",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            row.type === "income" ? "text-[#217A45]" : "text-[#A15C00]"
          }`}
        >
          {row.type === "income" ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{row.type === "income" ? "Pemasukan" : "Pengeluaran"}</span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal (IDR)",
      align: "right",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#1F2933] tabular-nums">
          {formatIdr(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const meta = getTransactionStatusMeta(row.status);
        return <StatusText label={meta.label} tone={meta.tone} />;
      },
    },
    {
      key: "actions",
      header: "Tindakan",
      align: "right",
      render: (row) => {
        const isSelfCreator = row.createdBy === profile?.uid;
        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {row.status === "PENDING_APPROVAL" && canApprove && (
              <>
                {isSelfCreator ? (
                  <span
                    title="Pembuat transaksi tidak boleh menyetujui transaksi sendiri"
                    className="inline-flex items-center gap-1 text-xs text-[#667085]"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Menunggu reviewer lain</span>
                  </span>
                ) : (
                  <>
                    <Button
                      size="sm"
                      iconLeft={
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      }
                      onClick={() =>
                        setApprovalTarget({ tx: row, action: "APPROVE" })
                      }
                    >
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      iconLeft={
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      }
                      onClick={() =>
                        setApprovalTarget({ tx: row, action: "REJECT" })
                      }
                    >
                      Tolak
                    </Button>
                  </>
                )}
              </>
            )}

            {row.status === "POSTED" && !row.isReversal && canWrite && (
              <Button
                size="sm"
                variant="outline"
                iconLeft={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => setReversalTarget(row)}
              >
                Reversal
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Saldo Kas Terposting</span>
            <Wallet className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1F2933] tabular-nums">
            {formatIdr(summary?.balance ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Total Pemasukan</span>
            <TrendingUp className="h-4 w-4 text-[#217A45]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#217A45] tabular-nums">
            {formatIdr(summary?.totalIncome ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085]">
            <span>Total Pengeluaran</span>
            <TrendingDown className="h-4 w-4 text-[#A15C00]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#A15C00] tabular-nums">
            {formatIdr(summary?.totalExpense ?? 0)}
          </p>
        </div>
      </section>

      {/* Header & Action */}
      <section className="flex flex-col gap-4 rounded-xl border border-[#E4E7EC] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2933]">
            Buku Kas &amp; Transaksi RT 06 RW 01
          </h2>
          <p className="mt-1 text-xs text-[#667085]">
            Seluruh transaksi dicatat dalam integer Rupiah dengan kunci
            idempotensi dan pemisahan tugas persetujuan.
          </p>
        </div>

        {canWrite && (
          <Button
            iconLeft={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setCreateOpen(true)}
          >
            Catat Transaksi
          </Button>
        )}
      </section>

      {error ? (
        <ErrorState message={error} onRetry={() => void loadFinance()} />
      ) : (
        <DataTable
          data={transactions}
          columns={columns}
          keyExtractor={(t) => t.transactionId}
          loading={loading}
          searchPlaceholder="Cari deskripsi atau kategori transaksi..."
          searchFilter={(row, q) =>
            (row.description || "").toLowerCase().includes(q) ||
            row.categoryId.toLowerCase().includes(q) ||
            row.transactionId.toLowerCase().includes(q)
          }
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <SelectInput
                aria-label="Filter jenis transaksi"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-36 py-2 text-xs"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </SelectInput>
              <SelectInput
                aria-label="Filter status transaksi"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-44 py-2 text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                <option value="POSTED">Terposting</option>
                <option value="REJECTED">Ditolak</option>
                <option value="REVERSED">Reversal</option>
              </SelectInput>
              <TextInput
                aria-label="Filter periode YYYY-MM"
                placeholder="Periode (2026-11)"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-36 py-2 text-xs"
              />
            </div>
          }
          emptyTitle="Belum Ada Transaksi Kas"
          emptyDescription="Catat pemasukan iuran atau pengeluaran operasional RT 06 untuk memulai pembukuan."
          emptyActionLabel={canWrite ? "Catat Transaksi Pertama" : undefined}
          onEmptyAction={canWrite ? () => setCreateOpen(true) : undefined}
        />
      )}

      {/* Create Transaction Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Catat Transaksi Keuangan Baru"
        description="Transaksi baru berstatus Menunggu Persetujuan sebelum diposting ke saldo kas."
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tx-type" label="Jenis Transaksi" required>
              <SelectInput
                id="tx-type"
                value={txForm.type}
                onChange={(e) =>
                  setTxForm((p) => ({
                    ...p,
                    type: e.target.value as "income" | "expense",
                  }))
                }
              >
                <option value="income">Pemasukan (Income)</option>
                <option value="expense">Pengeluaran (Expense)</option>
              </SelectInput>
            </FormField>

            <FormField id="tx-period" label="Periode (YYYY-MM)" required>
              <TextInput
                id="tx-period"
                value={txForm.period}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, period: e.target.value }))
                }
                placeholder="2026-11"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="tx-amount"
              label="Nominal (Integer Rupiah)"
              required
              helperText="Tanpa titik/desimal, misal 150000"
            >
              <TextInput
                id="tx-amount"
                type="number"
                min={1}
                step={1}
                value={txForm.amount}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="150000"
              />
            </FormField>

            <FormField id="tx-category" label="Kategori Anggaran" required>
              <SelectInput
                id="tx-category"
                value={txForm.categoryId}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, categoryId: e.target.value }))
                }
              >
                {FINANCE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <FormField id="tx-desc" label="Keterangan Transaksi" required>
            <TextareaInput
              id="tx-desc"
              value={txForm.description}
              onChange={(e) =>
                setTxForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Iuran keamanan & kebersihan bulan November Blok A"
            />
          </FormField>

          <FormField
            id="tx-idempotency"
            label="Kunci Idempotensi (Otomatis)"
            helperText="Mencegah duplikasi transaksi jika jaringan terganggu."
          >
            <TextInput
              id="tx-idempotency"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="font-mono text-xs"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E7EC] pt-4">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submittingTx}
            >
              Batal
            </Button>
            <Button type="submit" loading={submittingTx}>
              Simpan &amp; Ajukan Persetujuan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve / Reject Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(approvalTarget)}
        onClose={() => {
          setApprovalTarget(null);
          setRejectionReason("");
        }}
        onConfirm={handleConfirmApproval}
        title={
          approvalTarget?.action === "APPROVE"
            ? "Setujui & Posting Transaksi"
            : "Tolak Transaksi"
        }
        message={
          approvalTarget
            ? `Konfirmasi ${
                approvalTarget.action === "APPROVE" ? "persetujuan" : "penolakan"
              } transaksi senilai ${formatIdr(approvalTarget.tx.amount)} (${
                approvalTarget.tx.description || approvalTarget.tx.categoryId
              }).`
            : ""
        }
        confirmLabel={
          approvalTarget?.action === "APPROVE"
            ? "Ya, Setujui Transaksi"
            : "Tolak Transaksi"
        }
        variant={approvalTarget?.action === "REJECT" ? "danger" : "primary"}
        loading={processingApproval}
      >
        {approvalTarget?.action === "REJECT" && (
          <FormField
            id="reject-reason"
            label="Alasan Penolakan (Minimal 5 Karakter)"
            required
          >
            <TextareaInput
              id="reject-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Nominal tidak sesuai dengan kuitansi lampiran."
            />
          </FormField>
        )}
      </ConfirmDialog>

      {/* Reversal Modal */}
      <Modal
        open={Boolean(reversalTarget)}
        onClose={() => {
          setReversalTarget(null);
          setReversalReason("");
        }}
        title="Reversal Transaksi Terposting"
        description="Sistem akan membuat entri pembalik otomatis tanpa menghapus riwayat audit ledger."
      >
        {reversalTarget && (
          <form onSubmit={handleConfirmReversal} className="space-y-4">
            <div className="rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-4 text-sm">
              <p className="font-semibold text-[#1F2933]">
                {reversalTarget.description || reversalTarget.categoryId}
              </p>
              <p className="mt-1 font-mono text-xs text-[#667085]">
                ID: {reversalTarget.transactionId} ·{" "}
                {formatIdr(reversalTarget.amount)}
              </p>
            </div>

            <FormField
              id="rev-reason"
              label="Alasan Reversal (Minimal 5 Karakter)"
              required
            >
              <TextareaInput
                id="rev-reason"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Contoh: Kesalahan input nominal ganda oleh petugas piket."
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 border-t border-[#E4E7EC] pt-4">
              <Button
                variant="outline"
                onClick={() => setReversalTarget(null)}
                disabled={processingReversal}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={processingReversal}
              >
                Buat Transaksi Reversal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
