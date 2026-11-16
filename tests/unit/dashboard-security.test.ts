import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDashboardReport } from "@/server/business-logic/dashboard";
import { adminDb } from "@/lib/firebase/admin";
import * as financeBusinessLogic from "@/server/business-logic/finance";

describe("Work Package E/H — Dashboard Reports & Role-Based Data Visibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock count aggregates
    vi.spyOn(adminDb, "collection").mockImplementation((collectionName: string) => {
      let countVal = 10;
      if (collectionName === "residents") countVal = 120;
      if (collectionName === "households") countVal = 45;
      if (collectionName === "complaints") countVal = 18;

      return {
        count: () => ({
          get: async () => ({
            data: () => ({ count: countVal }),
          }),
        }),
      } as any;
    });
  });

  it("exposes full financial totals to roles with finance:read (BENDAHARA_RT, KETUA_RT)", async () => {
    vi.spyOn(financeBusinessLogic, "calculateFinancialSummary").mockResolvedValue({
      totalIncome: 12500000,
      totalExpense: 4200000,
      balance: 8300000,
      currency: "IDR",
      postedCount: 35,
    });

    const report = await generateDashboardReport(["BENDAHARA_RT"]);

    expect(report.totalResidents).toBe(120);
    expect(report.totalHouseholds).toBe(45);
    expect(report.totalComplaints).toBe(18);
    expect(report.financialSummary).not.toBeNull();
    expect(report.financialSummary?.balance).toBe(8300000);
    expect(report.notice).toBeUndefined();
  });

  it("restricts financial totals to null for roles without finance:read (WARGA)", async () => {
    const report = await generateDashboardReport(["WARGA"]);

    expect(report.totalResidents).toBe(120);
    expect(report.totalHouseholds).toBe(45);
    expect(report.totalComplaints).toBe(18);
    expect(report.financialSummary).toBeNull();
    expect(report.notice).toContain("restricted to authorized financial officers");
  });
});
