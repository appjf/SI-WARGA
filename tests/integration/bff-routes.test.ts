import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as authVerifyHandler } from "@/app/api/v1/auth/verify/route";
import { GET as getResidentsHandler, POST as postResidentsHandler } from "@/app/api/v1/residents/route";
import { GET as getFinanceHandler, POST as postFinanceHandler } from "@/app/api/v1/finance/route";
import { POST as approveFinanceHandler } from "@/app/api/v1/finance/[transactionId]/approve/route";
import { GET as getComplaintsHandler, POST as postComplaintsHandler } from "@/app/api/v1/complaints/route";
import { PATCH as patchComplaintStatusHandler } from "@/app/api/v1/complaints/[ticketId]/status/route";
import { GET as getDashboardHandler } from "@/app/api/v1/reports/dashboard/route";
import { GET as getNotificationsHandler } from "@/app/api/v1/notifications/route";
import { GET as getGisHandler } from "@/app/api/v1/gis/[...path]/route";
import { adminAuth } from "@/lib/firebase/admin";
import * as adminFirestore from "@/lib/firebase/admin-firestore";
import * as residentsBL from "@/server/business-logic/residents";
import * as financeBL from "@/server/business-logic/finance";
import * as complaintsBL from "@/server/business-logic/complaints";
import * as notifBL from "@/server/business-logic/notifications";
import * as gisClient from "@/server/integrations/gis-client";

describe("Work Package H — BFF HTTP Route Handler Integration Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createReq(url: string, method: string = "GET", body?: any, token?: string): NextRequest {
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (body) {
      headers.set("Content-Type", "application/json");
    }

    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function mockVerifiedUser(uid: string, roles: string[] = ["WARGA"]) {
    vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
      uid,
      email: `${uid}@ggr.id`,
      roles,
    } as any);

    vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({
      uid,
      status: "active",
      roles,
    } as any);
  }

  describe("Authentication Guard on Public & Protected Routes", () => {
    it("POST /api/v1/auth/verify returns 401 when missing token", async () => {
      const req = createReq("http://localhost:3000/api/v1/auth/verify", "POST");
      const res = await authVerifyHandler(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /api/v1/auth/verify returns 200 with verified user claims and roles", async () => {
      mockVerifiedUser("ketua-rt-uid", ["KETUA_RT"]);

      const req = createReq(
        "http://localhost:3000/api/v1/auth/verify",
        "POST",
        { idToken: "valid-token-string" }
      );
      const res = await authVerifyHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.uid).toBe("ketua-rt-uid");
      expect(data.data.roles).toContain("KETUA_RT");
    });

    it("GET /api/v1/residents returns 401 when no token is supplied", async () => {
      const req = createReq("http://localhost:3000/api/v1/residents");
      const res = await getResidentsHandler(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/residents returns 401 when no token is supplied", async () => {
      const req = createReq("http://localhost:3000/api/v1/residents", "POST", { fullName: "Test" });
      const res = await postResidentsHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/finance returns 401 when no token is supplied", async () => {
      const req = createReq("http://localhost:3000/api/v1/finance");
      const res = await getFinanceHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/complaints returns 401 when no token is supplied", async () => {
      const req = createReq("http://localhost:3000/api/v1/complaints");
      const res = await getComplaintsHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/reports/dashboard returns 401 when no token is supplied", async () => {
      const req = createReq("http://localhost:3000/api/v1/reports/dashboard");
      const res = await getDashboardHandler(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Residents Route Handlers", () => {
    it("GET /api/v1/residents allows authorized user with residents:read", async () => {
      mockVerifiedUser("sekretaris-uid", ["SEKRETARIS_RT"]);
      vi.spyOn(residentsBL, "fetchResidents").mockResolvedValue({
        items: [{ residentId: "res-1", fullName: "Ahmad" } as any],
        count: 1,
      });

      const req = createReq("http://localhost:3000/api/v1/residents", "GET", undefined, "valid-token");
      const res = await getResidentsHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
    });

    it("POST /api/v1/residents handles household not found error (HTTP 400)", async () => {
      mockVerifiedUser("sekretaris-uid", ["SEKRETARIS_RT"]);
      vi.spyOn(residentsBL, "registerNewResident").mockRejectedValue(
        new residentsBL.ResidentValidationError("Household with ID [house-999] does not exist in RT 06 RW 01.")
      );

      const req = createReq(
        "http://localhost:3000/api/v1/residents",
        "POST",
        {
          fullName: "Budi Santoso",
          houseId: "house-999",
          familyRole: "KEPALA_KELUARGA",
          isHeadOfFamily: true,
          contact: {},
        },
        "valid-token"
      );

      const res = await postResidentsHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("HOUSEHOLD_NOT_FOUND");
    });
  });

  describe("Finance Route Handlers", () => {
    it("POST /api/v1/finance rejects negative or zero amounts (HTTP 400)", async () => {
      mockVerifiedUser("bendahara-uid", ["BENDAHARA_RT"]);

      const req = createReq(
        "http://localhost:3000/api/v1/finance",
        "POST",
        {
          type: "income",
          amount: -50000,
          categoryId: "CAT-IURAN",
          period: "2026-11",
        },
        "valid-token"
      );

      const res = await postFinanceHandler(req);
      expect(res.status).toBe(400);
    });

    it("POST /api/v1/finance records new transaction (HTTP 201)", async () => {
      mockVerifiedUser("bendahara-uid", ["BENDAHARA_RT"]);
      vi.spyOn(financeBL, "recordTransaction").mockResolvedValue({
        transaction: {
          transactionId: "tx-new-001",
          type: "income",
          amount: 150000,
          currency: "IDR",
          status: "PENDING_APPROVAL",
        } as any,
        isNew: true,
      });

      const req = createReq(
        "http://localhost:3000/api/v1/finance",
        "POST",
        {
          type: "income",
          amount: 150000,
          categoryId: "CAT-IURAN",
          period: "2026-11",
        },
        "valid-token"
      );

      const res = await postFinanceHandler(req);
      expect(res.status).toBe(201);
    });

    it("POST /api/v1/finance/[id]/approve returns 403 on separation of duties violation", async () => {
      mockVerifiedUser("bendahara-uid", ["BENDAHARA_RT"]);
      vi.spyOn(financeBL, "processTransactionApproval").mockRejectedValue(
        new financeBL.SeparationOfDutiesError("Separation of duties violation: Creator cannot approve own transaction.")
      );

      const req = createReq(
        "http://localhost:3000/api/v1/finance/tx-001/approve",
        "POST",
        { action: "APPROVE" },
        "valid-token"
      );

      const res = await approveFinanceHandler(req, { params: Promise.resolve({ transactionId: "tx-001" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error.code).toBe("SEPARATION_OF_DUTIES_VIOLATION");
    });
  });

  describe("Complaints Route Handlers", () => {
    it("POST /api/v1/complaints creates ticket with SUBMITTED status (HTTP 201)", async () => {
      mockVerifiedUser("warga-uid", ["WARGA"]);
      vi.spyOn(complaintsBL, "submitComplaint").mockResolvedValue({
        ticketId: "complaint-001",
        reporterId: "warga-uid",
        category: "KEAMANAN",
        description: "Pintu gerbang pos ronda perlu diperbaiki",
        status: "SUBMITTED",
      } as any);

      const req = createReq(
        "http://localhost:3000/api/v1/complaints",
        "POST",
        {
          category: "KEAMANAN",
          description: "Pintu gerbang pos ronda perlu diperbaiki",
        },
        "valid-token"
      );

      const res = await postComplaintsHandler(req);
      expect(res.status).toBe(201);
    });

    it("PATCH /api/v1/complaints/[id]/status rejects invalid state transitions (HTTP 400)", async () => {
      mockVerifiedUser("pengurus-uid", ["PENGURUS"]);
      vi.spyOn(complaintsBL, "transitionComplaintStatus").mockRejectedValue(
        new complaintsBL.InvalidStateTransitionError("Illegal state transition from SUBMITTED to RESOLVED")
      );

      const req = createReq(
        "http://localhost:3000/api/v1/complaints/c-01/status",
        "PATCH",
        { status: "RESOLVED", notes: "Langsung selesai" },
        "valid-token"
      );

      const res = await patchComplaintStatusHandler(req, { params: Promise.resolve({ ticketId: "c-01" }) });
      expect(res.status).toBe(400);
    });
  });

  describe("GIS BFF Proxy", () => {
    it("GET /api/v1/gis/boundaries calls GIS client and returns GeoJSON", async () => {
      mockVerifiedUser("warga-uid", ["WARGA"]); // Warga has gis:read
      vi.spyOn(gisClient, "fetchGisLayer").mockResolvedValue({
        type: "FeatureCollection",
        features: [],
      });

      const req = createReq("http://localhost:3000/api/v1/gis/boundaries", "GET", undefined, "valid-token");
      const res = await getGisHandler(req, { params: Promise.resolve({ path: ["boundaries"] }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.type).toBe("FeatureCollection");
    });
  });

  describe("Notifications Route", () => {
    it("GET /api/v1/notifications lists user notifications", async () => {
      mockVerifiedUser("warga-uid", ["WARGA"]);
      vi.spyOn(notifBL, "getUserNotifications").mockResolvedValue({
        items: [{ id: "n-1", title: "Pemberitahuan Kerja Bakti" } as any],
        count: 1,
      });

      const req = createReq("http://localhost:3000/api/v1/notifications", "GET", undefined, "valid-token");
      const res = await getNotificationsHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.length).toBe(1);
    });
  });
});
