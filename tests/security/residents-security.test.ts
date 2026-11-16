import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerNewResident,
  fetchResidents,
  fetchResidentById,
  filterResidentPII,
  ResidentValidationError,
  ResidentForbiddenError,
} from "@/server/business-logic/residents";
import * as residentsDataAccess from "@/server/data-access/residents";
import { ResidentDocument } from "@/server/data-access/residents";

describe("Work Package B — Resident Data Security & PII Protection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sampleResident: ResidentDocument = {
    residentId: "res-001",
    fullName: "Bambang Pamungkas",
    houseId: "house-blok-a-01",
    nik: "3205011234560001",
    gender: "LAKI_LAKI",
    birthDate: "1985-05-12",
    birthPlace: "Garut",
    religion: "ISLAM",
    maritalStatus: "KAWIN",
    occupation: "Wiraswasta",
    familyRole: "KEPALA_KELUARGA",
    isHeadOfFamily: true,
    contact: {
      phone: "081234567890",
      email: "bambang@perumgreengarden.id",
      waNumber: "081234567890",
    },
    emergencyContact: {
      name: "Siti Rahma",
      relation: "Istri",
      phone: "081987654321",
    },
    verificationStatus: "verified",
    createdBy: "admin-uid",
    createdAt: "2026-11-15T00:00:00Z",
    updatedAt: "2026-11-15T00:00:00Z",
  };

  describe("Household Validation Integrity", () => {
    it("rejects resident creation if household does not exist in RT 06 RW 01", async () => {
      vi.spyOn(residentsDataAccess, "checkHouseholdExists").mockResolvedValue(false);

      await expect(
        registerNewResident(
          {
            fullName: "Warga Baru",
            houseId: "house-nonexistent-999",
            familyRole: "KEPALA_KELUARGA",
            isHeadOfFamily: true,
            contact: {},
          },
          "admin-uid"
        )
      ).rejects.toThrow(ResidentValidationError);
    });

    it("allows resident creation if household exists", async () => {
      vi.spyOn(residentsDataAccess, "checkHouseholdExists").mockResolvedValue(true);
      vi.spyOn(residentsDataAccess, "createResident").mockResolvedValue({
        ...sampleResident,
        residentId: "new-res-id",
      });

      const res = await registerNewResident(
        {
          fullName: "Bambang Pamungkas",
          houseId: "house-blok-a-01",
          familyRole: "KEPALA_KELUARGA",
          isHeadOfFamily: true,
          contact: {},
        },
        "admin-uid"
      );

      expect(res.residentId).toBe("new-res-id");
      expect(res.verificationStatus).toBe("verified");
    });
  });

  describe("PII Field-Level Filtering Matrix", () => {
    it("provides full unmasked PII to executive roles (KETUA_RT, SEKRETARIS_RT, SUPER_ADMIN)", () => {
      const filtered = filterResidentPII(sampleResident, ["KETUA_RT"], "ketua-uid");
      expect(filtered.nik).toBe("3205011234560001");
      expect(filtered.contact?.phone).toBe("081234567890");
      expect(filtered.contact?.email).toBe("bambang@perumgreengarden.id");
      expect(filtered.emergencyContact?.name).toBe("Siti Rahma");
    });

    it("masks sensitive PII (NIK and phone) for BENDAHARA_RT and PENGURUS", () => {
      const filtered = filterResidentPII(sampleResident, ["BENDAHARA_RT"], "bendahara-uid");

      // NIK must be masked (middle digits hidden)
      expect(filtered.nik).toBe("320501******0001");
      // Phone number must be masked
      expect(filtered.contact?.phone).toBe("0812****90");
      // Email masked
      expect(filtered.contact?.email).toContain("masked");
      // Emergency contact omitted
      expect(filtered.emergencyContact).toBeUndefined();
    });

    it("completely strips contact and NIK details when viewed by another regular WARGA", () => {
      const filtered = filterResidentPII(sampleResident, ["WARGA"], "other-warga-uid", "other-res-id");

      expect(filtered.nik).toBeUndefined();
      expect(filtered.contact).toBeUndefined();
      expect(filtered.emergencyContact).toBeUndefined();
      // Public directory fields remain
      expect(filtered.fullName).toBe("Bambang Pamungkas");
      expect(filtered.houseId).toBe("house-blok-a-01");
    });

    it("grants full PII access to Warga viewing their OWN resident profile", () => {
      // Caller residentId matches the sample resident
      const filtered = filterResidentPII(sampleResident, ["WARGA"], "resident-bambang-uid", "res-001");

      expect(filtered.nik).toBe("3205011234560001");
      expect(filtered.contact?.phone).toBe("081234567890");
      expect(filtered.emergencyContact?.name).toBe("Siti Rahma");
    });
  });

  describe("Cross-Resident Access & IDOR Protection", () => {
    it("forbids regular WARGA from fetching another resident's profile by ID", async () => {
      vi.spyOn(residentsDataAccess, "getResidentById").mockResolvedValue(sampleResident);

      // Caller is regular WARGA with a different residentId and UID
      await expect(
        fetchResidentById("res-001", ["WARGA"], "stranger-uid", "stranger-res-id")
      ).rejects.toThrow(ResidentForbiddenError);
    });

    it("allows authorized official (SEKRETARIS_RT) to fetch any resident profile by ID", async () => {
      vi.spyOn(residentsDataAccess, "getResidentById").mockResolvedValue(sampleResident);

      const resident = await fetchResidentById(
        "res-001",
        ["SEKRETARIS_RT"],
        "sekretaris-uid"
      );

      expect(resident).not.toBeNull();
      expect(resident?.fullName).toBe("Bambang Pamungkas");
    });

    it("restricts list query for regular WARGA to only their own record", async () => {
      vi.spyOn(residentsDataAccess, "getResidentById").mockResolvedValue(sampleResident);

      const result = await fetchResidents(
        { limit: 20 },
        ["WARGA"],
        "resident-bambang-uid",
        "res-001"
      );

      expect(result.count).toBe(1);
      expect(result.items[0].residentId).toBe("res-001");
    });
  });
});
