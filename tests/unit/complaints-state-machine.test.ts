import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateComplaintStatusSchema,
  createComplaintSchema,
} from "@/server/validation/complaints";
import {
  transitionComplaintStatus,
  submitComplaint,
  InvalidStateTransitionError,
  UnauthorizedTransitionError,
} from "@/server/business-logic/complaints";
import { adminDb } from "@/lib/firebase/admin";

describe("Work Package D — Complaint State Machine & Lifecycle Transitions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Zod Validation Constraints", () => {
    it("mandates assignedTo when transitioning to ASSIGNED", () => {
      const invalidPayload = {
        status: "ASSIGNED",
        assignedTo: "", // Empty assignedTo
      };
      const res = updateComplaintStatusSchema.safeParse(invalidPayload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("assignedTo");
      }

      const validPayload = {
        status: "ASSIGNED",
        assignedTo: "officer-uid-007",
        officerName: "Budi Santoso",
      };
      const resValid = updateComplaintStatusSchema.safeParse(validPayload);
      expect(resValid.success).toBe(true);
    });

    it("mandates rejectionReason when rejecting a complaint", () => {
      const invalidPayload = {
        status: "REJECTED",
        rejectionReason: "No", // Less than 5 chars
      };
      const res = updateComplaintStatusSchema.safeParse(invalidPayload);
      expect(res.success).toBe(false);

      const validPayload = {
        status: "REJECTED",
        rejectionReason: "Bukan merupakan kewenangan wilayah RT 06",
      };
      const resValid = updateComplaintStatusSchema.safeParse(validPayload);
      expect(resValid.success).toBe(true);
    });
  });

  describe("State Transition Progression (SUBMITTED -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED)", () => {
    function setupComplaintMock(initialStatus: string, reporterId: string = "reporter-123") {
      const complaintData: any = {
        ticketId: "complaint-ticket-1",
        reporterId,
        category: "INFRASTRUKTUR",
        description: "Lampu jalan Blok A padam",
        status: initialStatus,
        statusHistory: [
          {
            fromStatus: "SUBMITTED",
            toStatus: initialStatus,
            changedBy: reporterId,
            timestamp: "2026-11-15T00:00:00Z",
          },
        ],
      };

      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => complaintData,
          }),
          update: vi.fn().mockImplementation((ref: any, updates: any) => {
            Object.assign(complaintData, updates);
          }),
        };
        return callback(fakeTx);
      });

      return complaintData;
    }

    it("allows legal progression: SUBMITTED -> VERIFIED by Pengurus", async () => {
      setupComplaintMock("SUBMITTED");

      const result = await transitionComplaintStatus(
        "complaint-ticket-1",
        { status: "VERIFIED", notes: "Laporan telah ditinjau dan terverifikasi" },
        "pengurus-uid",
        ["PENGURUS"]
      );

      expect(result.status).toBe("VERIFIED");
      expect(result.statusHistory.length).toBe(2);
      expect(result.statusHistory[1].fromStatus).toBe("SUBMITTED");
      expect(result.statusHistory[1].toStatus).toBe("VERIFIED");
    });

    it("allows legal progression: VERIFIED -> ASSIGNED with officer", async () => {
      setupComplaintMock("VERIFIED");

      const result = await transitionComplaintStatus(
        "complaint-ticket-1",
        {
          status: "ASSIGNED",
          assignedTo: "petugas-lapangan-uid",
          officerName: "Pak Slamet",
          notes: "Ditugaskan ke teknisi listrik RT",
        },
        "ketua-rt-uid",
        ["KETUA_RT"]
      );

      expect(result.status).toBe("ASSIGNED");
      expect(result.assignedTo).toBe("petugas-lapangan-uid");
    });

    it("allows legal progression: ASSIGNED -> IN_PROGRESS", async () => {
      setupComplaintMock("ASSIGNED");

      const result = await transitionComplaintStatus(
        "complaint-ticket-1",
        { status: "IN_PROGRESS", notes: "Teknisi sedang melakukan perbaikan kabel lampu jalan" },
        "petugas-lapangan-uid",
        ["PENGURUS"]
      );

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("allows legal progression: IN_PROGRESS -> RESOLVED", async () => {
      setupComplaintMock("IN_PROGRESS");

      const result = await transitionComplaintStatus(
        "complaint-ticket-1",
        { status: "RESOLVED", notes: "Bohlam dan fitting lampu jalan telah diganti dan menyala normal" },
        "petugas-lapangan-uid",
        ["PENGURUS"]
      );

      expect(result.status).toBe("RESOLVED");
    });

    it("allows reporting Warga to close a RESOLVED ticket (RESOLVED -> CLOSED)", async () => {
      setupComplaintMock("RESOLVED", "resident-warga-uid");

      const result = await transitionComplaintStatus(
        "complaint-ticket-1",
        { status: "CLOSED", notes: "Terima kasih, lampu jalan sudah menyala terang kembali" },
        "resident-warga-uid", // Same UID as reporter!
        ["WARGA"]
      );

      expect(result.status).toBe("CLOSED");
    });

    it("blocks unauthorized Warga from closing someone else's complaint", async () => {
      setupComplaintMock("RESOLVED", "original-reporter-uid");

      await expect(
        transitionComplaintStatus(
          "complaint-ticket-1",
          { status: "CLOSED" },
          "other-warga-uid", // Different Warga!
          ["WARGA"]
        )
      ).rejects.toThrow(UnauthorizedTransitionError);
    });

    it("rejects illegal state shortcuts: SUBMITTED directly to RESOLVED throws InvalidStateTransitionError", async () => {
      setupComplaintMock("SUBMITTED");

      await expect(
        transitionComplaintStatus(
          "complaint-ticket-1",
          { status: "RESOLVED" },
          "pengurus-uid",
          ["PENGURUS"]
        )
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it("forbids any transition from terminal states (CLOSED -> SUBMITTED)", async () => {
      setupComplaintMock("CLOSED");

      await expect(
        transitionComplaintStatus(
          "complaint-ticket-1",
          { status: "SUBMITTED" },
          "pengurus-uid",
          ["PENGURUS"]
        )
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it("forbids regular WARGA from changing complaint status to VERIFIED", async () => {
      setupComplaintMock("SUBMITTED");

      await expect(
        transitionComplaintStatus(
          "complaint-ticket-1",
          { status: "VERIFIED" },
          "regular-warga-uid",
          ["WARGA"]
        )
      ).rejects.toThrow(UnauthorizedTransitionError);
    });
  });
});
