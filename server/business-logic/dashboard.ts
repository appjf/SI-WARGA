import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { Role, hasPermission } from "@/lib/rbac/matrix";
import { calculateFinancialSummary } from "@/server/business-logic/finance";

export interface DashboardReportData {
  operationalArea: string;
  totalResidents: number;
  totalHouseholds: number;
  totalComplaints: number;
  financialSummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    currency: string;
  } | null;
  notice?: string;
}

export async function generateDashboardReport(
  callerRoles: Role[]
): Promise<DashboardReportData> {
  const [residentsSnap, householdsSnap, complaintsSnap] = await Promise.all([
    adminDb.collection("residents").count().get(),
    adminDb.collection("households").count().get(),
    adminDb.collection("complaints").count().get(),
  ]);

  const canViewFinance = hasPermission(callerRoles, "finance:read");

  let financialSummary = null;
  if (canViewFinance) {
    const fin = await calculateFinancialSummary();
    financialSummary = {
      totalIncome: fin.totalIncome,
      totalExpense: fin.totalExpense,
      balance: fin.balance,
      currency: fin.currency,
    };
  }

  return {
    operationalArea: "RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Banyuresmi, Garut",
    totalResidents: residentsSnap.data().count,
    totalHouseholds: householdsSnap.data().count,
    totalComplaints: complaintsSnap.data().count,
    financialSummary,
    notice: canViewFinance
      ? undefined
      : "Detailed financial ledger is restricted to authorized financial officers.",
  };
}
