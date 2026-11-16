import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getMeHandler, PATCH as patchMeHandler } from "@/app/api/v1/me/route";
import { GET as getHouseholdsHandler, POST as postHouseholdsHandler } from "@/app/api/v1/households/route";
import { GET as getAnnouncementsHandler, POST as postAnnouncementsHandler } from "@/app/api/v1/announcements/route";
import { GET as getSpatialAssetsHandler, POST as postSpatialAssetsHandler } from "@/app/api/v1/spatial-assets/route";
import { GET as getAnalyticsHandler } from "@/app/api/v1/reports/analytics/route";
import { GET as getAdminUsersHandler } from "@/app/api/v1/admin/users/route";
import { PATCH as patchAdminUserHandler } from "@/app/api/v1/admin/users/[uid]/route";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import * as adminFirestore from "@/lib/firebase/admin-firestore";
import * as householdsBL from "@/server/business-logic/households";
import * as announcementsBL from "@/server/business-logic/announcements";
import * as spatialAssetsBL from "@/server/business-logic/spatial-assets";
import * as analyticsBL from "@/server/business-logic/analytics";

describe("Work Package 6J — Phase 6 BFF Route Authorization & Integration Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createReq(
    url: string,
    method: string = "GET",
    body?: unknown,
    token?: string
  ): NextRequest {
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

  function mockUser(uid: string, roles: string[]) {
    vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
      uid,
      email: `${uid}@ggr.id`,
      roles,
    } as any);

    vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({
      uid,
      email: `${uid}@ggr.id`,
      displayName: uid,
      status: "active",
      roles,
      residentId: "res-1",
      houseId: "house-a1",
    } as any);
  }

  describe("/api/v1/me", () => {
    it("returns 401 without bearer token", async () => {
      const res = await getMeHandler(createReq("http://localhost:3000/api/v1/me"));
      expect(res.status).toBe(401);
    });

    it("returns server-verified roles and permissions on GET", async () => {
      mockUser("ketua-uid", ["KETUA_RT"]);
      const res = await getMeHandler(
        createReq("http://localhost:3000/api/v1/me", "GET", undefined, "tok")
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.roles).toEqual(["KETUA_RT"]);
      expect(body.data.permissions).toContain("finance:approve");
    });

    it("ignores any client attempts to alter role/status via PATCH /api/v1/me", async () => {
      mockUser("warga-uid", ["WARGA"]);
      const upsertSpy = vi
        .spyOn(adminFirestore, "upsertUserProfile")
        .mockResolvedValue({} as any);
      vi.spyOn(adminFirestore, "createAuditLog").mockResolvedValue("log-1" as any);

      const res = await patchMeHandler(
        createReq(
          "http://localhost:3000/api/v1/me",
          "PATCH",
          { displayName: "Warga Jujur", roles: ["SUPER_ADMIN"], status: "active" },
          "tok"
        )
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(upsertSpy).toHaveBeenCalledWith("warga-uid", { displayName: "Warga Jujur" });
      expect(body.data.roles).toEqual(["WARGA"]);
    });
  });

  describe("/api/v1/households", () => {
    it("blocks WARGA from creating a household (403) and allows SEKRETARIS_RT (201)", async () => {
      mockUser("warga-uid", ["WARGA"]);
      const denied = await postHouseholdsHandler(
        createReq(
          "http://localhost:3000/api/v1/households",
          "POST",
          {
            houseCode: "A-10",
            blockName: "Blok A",
            addressLabel: "Perum Green Garden Residence Blok A-10",
          },
          "tok"
        )
      );
      expect(denied.status).toBe(403);

      mockUser("sek-uid", ["SEKRETARIS_RT"]);
      vi.spyOn(householdsBL, "createHousehold").mockResolvedValue({
        houseId: "A-10",
        houseCode: "A-10",
        blockName: "Blok A",
        addressLabel: "Perum Green Garden Residence Blok A-10",
        occupancyStatus: "OCCUPIED",
      });

      const allowed = await postHouseholdsHandler(
        createReq(
          "http://localhost:3000/api/v1/households",
          "POST",
          {
            houseCode: "A-10",
            blockName: "Blok A",
            addressLabel: "Perum Green Garden Residence Blok A-10",
          },
          "tok"
        )
      );
      expect(allowed.status).toBe(201);
    });

    it("lists scoped households for authenticated user", async () => {
      mockUser("warga-uid", ["WARGA"]);
      vi.spyOn(householdsBL, "listHouseholds").mockResolvedValue({
        items: [{ houseId: "house-a1", houseCode: "A-01" } as any],
        count: 1,
      });

      const res = await getHouseholdsHandler(
        createReq("http://localhost:3000/api/v1/households", "GET", undefined, "tok")
      );
      expect(res.status).toBe(200);
    });
  });

  describe("/api/v1/announcements", () => {
    it("blocks WARGA from publishing announcements (403) and allows KETUA_RT (201)", async () => {
      mockUser("warga-uid", ["WARGA"]);
      const denied = await postAnnouncementsHandler(
        createReq(
          "http://localhost:3000/api/v1/announcements",
          "POST",
          {
            title: "Info Warga",
            content: "Isi pengumuman minimal sepuluh karakter.",
            category: "UMUM",
          },
          "tok"
        )
      );
      expect(denied.status).toBe(403);

      mockUser("ketua-uid", ["KETUA_RT"]);
      vi.spyOn(announcementsBL, "publishAnnouncement").mockResolvedValue({
        announcementId: "ann-1",
        title: "Kerja Bakti",
        content: "Kerja bakti saluran air Minggu pagi.",
        category: "KEGIATAN",
        audience: "ALL_WARGA",
        isPinned: true,
        publishedBy: "ketua-uid",
      });

      const allowed = await postAnnouncementsHandler(
        createReq(
          "http://localhost:3000/api/v1/announcements",
          "POST",
          {
            title: "Kerja Bakti",
            content: "Kerja bakti saluran air Minggu pagi.",
            category: "KEGIATAN",
            isPinned: true,
          },
          "tok"
        )
      );
      expect(allowed.status).toBe(201);

      vi.spyOn(announcementsBL, "listAnnouncements").mockResolvedValue({
        items: [],
        count: 0,
      });
      const listRes = await getAnnouncementsHandler(
        createReq("http://localhost:3000/api/v1/announcements", "GET", undefined, "tok")
      );
      expect(listRes.status).toBe(200);
    });
  });

  describe("/api/v1/spatial-assets", () => {
    it("enforces gis:read (403 for BENDAHARA_RT, 200 for WARGA) and gis:write (403 for WARGA, 201 for ADMIN_RW)", async () => {
      mockUser("bendahara-uid", ["BENDAHARA_RT"]);
      const noGisRead = await getSpatialAssetsHandler(
        createReq("http://localhost:3000/api/v1/spatial-assets", "GET", undefined, "tok")
      );
      expect(noGisRead.status).toBe(403);

      mockUser("warga-uid", ["WARGA"]);
      vi.spyOn(spatialAssetsBL, "listSpatialAssets").mockResolvedValue({
        items: [],
        count: 0,
      });
      const wargaRead = await getSpatialAssetsHandler(
        createReq("http://localhost:3000/api/v1/spatial-assets", "GET", undefined, "tok")
      );
      expect(wargaRead.status).toBe(200);

      const wargaWrite = await postSpatialAssetsHandler(
        createReq(
          "http://localhost:3000/api/v1/spatial-assets",
          "POST",
          {
            assetCode: "AST-01",
            name: "Pos Kamling",
            layerType: "assets",
            category: "Keamanan",
            longitude: 107.9022,
            latitude: -7.2165,
            acquisitionYear: 2024,
            assetValueIdr: 5000000,
            picName: "Sarpras",
          },
          "tok"
        )
      );
      expect(wargaWrite.status).toBe(403);

      mockUser("admin-rw-uid", ["ADMIN_RW"]);
      vi.spyOn(spatialAssetsBL, "createSpatialAsset").mockResolvedValue({
        assetId: "asset-001",
        assetCode: "AST-01",
        name: "Pos Kamling",
        layerType: "assets",
        category: "Keamanan",
        coordinates: {
          longitude: 107.9022,
          latitude: -7.2165,
          srid: 4326,
          utmEasting: 820450,
          utmNorthing: 9201450,
          utmZone: "48S",
        },
        geometry: { type: "Point", coordinates: [107.9022, -7.2165] },
        condition: "GOOD",
        acquisitionYear: 2024,
        assetValueIdr: 5000000,
        picName: "Sarpras",
        operationalStatus: "ACTIVE",
        inspectionHistory: [],
        changeHistory: [],
      });

      const adminWrite = await postSpatialAssetsHandler(
        createReq(
          "http://localhost:3000/api/v1/spatial-assets",
          "POST",
          {
            assetCode: "AST-01",
            name: "Pos Kamling",
            layerType: "assets",
            category: "Keamanan",
            longitude: 107.9022,
            latitude: -7.2165,
            acquisitionYear: 2024,
            assetValueIdr: 5000000,
            picName: "Sarpras",
          },
          "tok"
        )
      );
      expect(adminWrite.status).toBe(201);
    });
  });

  describe("/api/v1/reports/analytics & /api/v1/admin/users", () => {
    it("gates financial analytics by finance:read and logs exports", async () => {
      mockUser("warga-uid", ["WARGA"]);
      const auditSpy = vi
        .spyOn(adminFirestore, "createAuditLog")
        .mockResolvedValue("audit-1" as any);
      vi.spyOn(analyticsBL, "generateAnalyticsReport").mockResolvedValue({
        generatedAt: "2026-11-16T00:00:00.000Z",
        operationalArea: "RT 06 RW 01 Green Garden Residence",
        residents: {
          total: 20,
          verified: 18,
          pending: 2,
          byFamilyRole: {},
          totalHouseholds: 10,
        },
        complaints: { total: 4, byStatus: {}, byCategory: {}, byPriority: {} },
        assets: { total: 3, totalValueIdr: 12000000, byCondition: {}, byLayer: {} },
        finance: null,
      });

      const res = await getAnalyticsHandler(
        createReq(
          "http://localhost:3000/api/v1/reports/analytics?export=csv",
          "GET",
          undefined,
          "tok"
        )
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.data.finance).toBeNull();
      expect(auditSpy).toHaveBeenCalledTimes(1);
    });

    it("enforces users:read and users:manage_roles on admin user endpoints", async () => {
      mockUser("warga-uid", ["WARGA"]);
      const wargaList = await getAdminUsersHandler(
        createReq("http://localhost:3000/api/v1/admin/users", "GET", undefined, "tok")
      );
      expect(wargaList.status).toBe(403);

      mockUser("ketua-uid", ["KETUA_RT"]);
      const ketuaPatch = await patchAdminUserHandler(
        createReq(
          "http://localhost:3000/api/v1/admin/users/target-1",
          "PATCH",
          { roles: ["SUPER_ADMIN"] },
          "tok"
        ),
        { params: Promise.resolve({ uid: "target-1" }) }
      );
      expect(ketuaPatch.status).toBe(403);

      // Verify SUPER_ADMIN access passes authorization gate
      mockUser("sa-uid", ["SUPER_ADMIN"]);
      vi.spyOn(adminDb, "collection").mockReturnValue({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
      } as any);
      const saList = await getAdminUsersHandler(
        createReq("http://localhost:3000/api/v1/admin/users", "GET", undefined, "tok")
      );
      expect(saList.status).toBe(200);
    });
  });
});
