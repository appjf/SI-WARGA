import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { Role, hasPermission } from "@/lib/rbac/matrix";

export interface AnalyticsReportData {
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

export async function generateAnalyticsReport(
  callerRoles: Role[]
): Promise<AnalyticsReportData> {
  const canViewFinance = hasPermission(callerRoles, "finance:read");

  const [residentsSnap, householdsSnap, complaintsSnap, assetsSnap] =
    await Promise.all([
      adminDb.collection("residents").limit(500).get(),
      adminDb.collection("households").count().get(),
      adminDb.collection("complaints").limit(500).get(),
      adminDb.collection("spatialAssets").limit(500).get(),
    ]);

  let verified = 0;
  let pending = 0;
  const byFamilyRole: Record<string, number> = {};
  residentsSnap.forEach((doc) => {
    const d = doc.data();
    if (d.verificationStatus === "verified") verified++;
    else pending++;
    const role = String(d.familyRole || "LAINNYA");
    byFamilyRole[role] = (byFamilyRole[role] || 0) + 1;
  });

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  complaintsSnap.forEach((doc) => {
    const d = doc.data();
    const s = String(d.status || "SUBMITTED");
    const c = String(d.category || "LAINNYA");
    const p = String(d.priority || "NORMAL");
    byStatus[s] = (byStatus[s] || 0) + 1;
    byCategory[c] = (byCategory[c] || 0) + 1;
    byPriority[p] = (byPriority[p] || 0) + 1;
  });

  let totalValueIdr = 0;
  const byCondition: Record<string, number> = {};
  const byLayer: Record<string, number> = {};
  assetsSnap.forEach((doc) => {
    const d = doc.data();
    totalValueIdr += Number(d.assetValueIdr || 0);
    const cond = String(d.condition || "GOOD");
    const layer = String(d.layerType || "assets");
    byCondition[cond] = (byCondition[cond] || 0) + 1;
    byLayer[layer] = (byLayer[layer] || 0) + 1;
  });

  let financeData: AnalyticsReportData["finance"] = null;
  if (canViewFinance) {
    const txSnap = await adminDb.collection("transactions").limit(500).get();
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingCount = 0;
    let postedCount = 0;
    const periodMap: Record<string, { income: number; expense: number }> = {};
    const finCategory: Record<string, number> = {};

    txSnap.forEach((doc) => {
      const tx = doc.data();
      const amount = Number(tx.amount || 0);
      if (tx.status === "PENDING_APPROVAL") {
        pendingCount++;
      }
      if (tx.status === "POSTED") {
        postedCount++;
        const period = String(tx.period || "Unknown");
        if (!periodMap[period]) {
          periodMap[period] = { income: 0, expense: 0 };
        }
        if (tx.type === "income") {
          totalIncome += amount;
          periodMap[period].income += amount;
        } else if (tx.type === "expense") {
          totalExpense += amount;
          periodMap[period].expense += amount;
        }
        const cat = String(tx.categoryId || "UMUM");
        finCategory[cat] = (finCategory[cat] || 0) + amount;
      }
    });

    const byPeriod = Object.entries(periodMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({ period, ...vals }));

    financeData = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingCount,
      postedCount,
      byPeriod,
      byCategory: finCategory,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    operationalArea:
      "RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Banyuresmi, Garut",
    residents: {
      total: residentsSnap.size,
      verified,
      pending,
      byFamilyRole,
      totalHouseholds: householdsSnap.data().count,
    },
    complaints: {
      total: complaintsSnap.size,
      byStatus,
      byCategory,
      byPriority,
    },
    assets: {
      total: assetsSnap.size,
      totalValueIdr,
      byCondition,
      byLayer,
    },
    finance: financeData,
  };
}
