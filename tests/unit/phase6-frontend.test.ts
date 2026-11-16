import { describe, it, expect } from "vitest";
import { getVisibleNavigation } from "@/lib/rbac/navigation";
import { ALL_ROLES, getEffectivePermissions } from "@/lib/rbac/matrix";
import { resolveDashboardConfig } from "@/features/dashboard/role-config";
import {
  convertEpsg4326ToUtm48S,
  formatIdr,
  haversineDistanceMeters,
  parseTimestamp,
} from "@/lib/formatters";
import { createHouseholdSchema } from "@/server/validation/households";
import { createAnnouncementSchema } from "@/server/validation/announcements";
import { createSpatialAssetSchema } from "@/server/validation/spatial-assets";
import { SPATIAL_LAYERS, RT06_BASELINE_FEATURES } from "@/features/gis/gis-baseline";

describe("Work Package 6J — Frontend RBAC, Formatters, GIS & Validation Tests", () => {
  describe("Role-Based Navigation & Dashboard Resolution across 7 Roles", () => {
    it("hides Finance and GIS from unauthorized roles accurately", () => {
      const bendaharaNav = getVisibleNavigation(["BENDAHARA_RT"]).map((n) => n.id);
      expect(bendaharaNav).toContain("finance");
      expect(bendaharaNav).toContain("residents");
      expect(bendaharaNav).not.toContain("gis");
      expect(bendaharaNav).not.toContain("complaints");
      expect(bendaharaNav).not.toContain("admin-users");

      const sekretarisNav = getVisibleNavigation(["SEKRETARIS_RT"]).map((n) => n.id);
      expect(sekretarisNav).toContain("residents");
      expect(sekretarisNav).toContain("gis");
      expect(sekretarisNav).not.toContain("finance");
      expect(sekretarisNav).not.toContain("admin-users");

      const wargaNav = getVisibleNavigation(["WARGA"]).map((n) => n.id);
      expect(wargaNav).toContain("dashboard");
      expect(wargaNav).toContain("complaints");
      expect(wargaNav).toContain("gis");
      expect(wargaNav).not.toContain("finance");
      expect(wargaNav).not.toContain("admin-users");
    });

    it("resolves distinct role dashboard headlines and permitted quick actions for every role", () => {
      for (const role of ALL_ROLES) {
        const cfg = resolveDashboardConfig([role]);
        expect(cfg.primaryRole).toBe(role);
        expect(cfg.headline.length).toBeGreaterThan(5);
        expect(cfg.quickActions.length).toBeGreaterThan(0);

        const effectivePerms = new Set(getEffectivePermissions([role]));
        for (const action of cfg.quickActions) {
          if (action.requiredPermission && role !== "SUPER_ADMIN") {
            expect(effectivePerms.has(action.requiredPermission)).toBe(true);
          }
        }
      }
    });
  });

  describe("Financial, Temporal & Geodetic Formatters (EPSG:4326 -> EPSG:32748)", () => {
    it("formats integer IDR currency cleanly and handles invalid numbers", () => {
      expect(formatIdr(150000)).toContain("150.000");
      expect(formatIdr(0)).toContain("0");
      expect(formatIdr(null)).toBe("Rp 0");
    });

    it("projects Green Garden Residence RT 06 coordinates (EPSG:4326) to UTM Zone 48S (EPSG:32748)", () => {
      const utm = convertEpsg4326ToUtm48S(107.9022, -7.2165);
      expect(utm.zone).toBe("48S");
      expect(utm.srid).toBe(32748);
      // Garut West Java sits near ~820,000 mE, ~9,201,000 mN in UTM 48S
      expect(utm.easting).toBeGreaterThan(800000);
      expect(utm.easting).toBeLessThan(850000);
      expect(utm.northing).toBeGreaterThan(9150000);
      expect(utm.northing).toBeLessThan(9250000);
    });

    it("calculates Haversine metric distance accurately", () => {
      const samePoint = haversineDistanceMeters(107.9022, -7.2165, 107.9022, -7.2165);
      expect(samePoint).toBe(0);

      const dist = haversineDistanceMeters(107.9012, -7.2165, 107.9028, -7.2165);
      expect(dist).toBeGreaterThan(150);
      expect(dist).toBeLessThan(200);
    });

    it("parses Firestore timestamp objects and ISO strings", () => {
      expect(parseTimestamp({ _seconds: 1700000000 })?.getUTCFullYear()).toBe(2023);
      expect(parseTimestamp("2026-11-16T00:00:00.000Z")?.getUTCFullYear()).toBe(2026);
      expect(parseTimestamp("not-a-date")).toBeNull();
    });
  });

  describe("GIS 6-Layer Coverage & Domain Form Validation Schemas", () => {
    it("provides all 6 mandatory spatial layers and RT 06 baseline geometry", () => {
      const keys = SPATIAL_LAYERS.map((l) => l.key);
      expect(keys).toEqual([
        "boundaries",
        "houses",
        "roads",
        "drainage",
        "facilities",
        "assets",
      ]);
      for (const k of keys) {
        expect(RT06_BASELINE_FEATURES[k].length).toBeGreaterThan(0);
      }
    });

    it("validates 12-attribute spatial asset input and rejects non-integer IDR value", () => {
      const valid = createSpatialAssetSchema.safeParse({
        assetCode: "AST-PJU-10",
        name: "Tiang PJU Blok C",
        layerType: "assets",
        category: "Penerangan Jalan",
        longitude: 107.9021,
        latitude: -7.2168,
        condition: "GOOD",
        acquisitionYear: 2025,
        assetValueIdr: 4500000,
        picName: "Seksi Sarpras",
        operationalStatus: "ACTIVE",
      });
      expect(valid.success).toBe(true);

      const invalidFloatIdr = createSpatialAssetSchema.safeParse({
        assetCode: "AST-PJU-11",
        name: "Tiang PJU Blok D",
        layerType: "assets",
        category: "Penerangan Jalan",
        longitude: 107.9021,
        latitude: -7.2168,
        condition: "GOOD",
        acquisitionYear: 2025,
        assetValueIdr: 4500000.5,
        picName: "Seksi Sarpras",
      });
      expect(invalidFloatIdr.success).toBe(false);
    });

    it("validates household and announcement payloads cleanly", () => {
      expect(
        createHouseholdSchema.safeParse({
          houseCode: "A-09",
          blockName: "Blok A",
          addressLabel: "Perum Green Garden Residence Blok A No. 09, RT 06 RW 01",
          occupancyStatus: "OCCUPIED",
        }).success
      ).toBe(true);

      expect(
        createAnnouncementSchema.safeParse({
          title: "Kerja Bakti Minggu",
          content: "Kerja bakti pembersihan saluran drainase dimulai pukul 07.00 WIB.",
          category: "KEGIATAN",
          audience: "ALL_WARGA",
        }).success
      ).toBe(true);
    });
  });
});
