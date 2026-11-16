import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTransactionSchema,
  approveTransactionSchema,
  reversalTransactionSchema,
} from "@/server/validation/finance";
import {
  recordTransaction,
  processTransactionApproval,
  processTransactionReversal,
  calculateFinancialSummary,
  IdempotencyConflictError,
  SeparationOfDutiesError,
  InvalidTransactionStateError,
  FinanceValidationError,
} from "@/server/business-logic/finance";
import { adminDb } from "@/lib/firebase/admin";

describe("Work Package C — Financial Transaction Integrity & Idempotency", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Integer Rupiah & Boundary Validation", () => {
    it("accepts positive safe integer IDR amounts", () => {
      const validPayload = {
        type: "income",
        amount: 250000,
        categoryId: "CAT-IURAN",
        period: "2026-11",
      };
      const result = createTransactionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects non-integer floating point amounts", () => {
      const floatPayload = {
        type: "income",
        amount: 250000.75,
        categoryId: "CAT-IURAN",
        period: "2026-11",
      };
      const result = createTransactionSchema.safeParse(floatPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("integer");
      }
    });

    it("rejects zero amount transactions", () => {
      const zeroPayload = {
        type: "income",
        amount: 0,
        categoryId: "CAT-IURAN",
        period: "2026-11",
      };
      const result = createTransactionSchema.safeParse(zeroPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive");
      }
    });

    it("rejects negative amount transactions", () => {
      const negativePayload = {
        type: "expense",
        amount: -50000,
        categoryId: "CAT-KEAMANAN",
        period: "2026-11",
      };
      const result = createTransactionSchema.safeParse(negativePayload);
      expect(result.success).toBe(false);
    });

    it("rejects invalid period format (must be YYYY-MM)", () => {
      const invalidPeriod = {
        type: "income",
        amount: 50000,
        categoryId: "CAT-IURAN",
        period: "November-2026",
      };
      const result = createTransactionSchema.safeParse(invalidPeriod);
      expect(result.success).toBe(false);
    });
  });

  describe("Atomic Idempotency Engine", () => {
    it("returns existing transaction when duplicate idempotencyKey is called with identical payload", async () => {
      // Correct SHA256 for income:100000:CAT-IURAN:2026-11
      const expectedHash = "8925c3c0539bf0b2dcded51b77957e15f0638cf0d5df1c2fcfbbc287e721b1a5";
      const mockKeyData = {
        idempotencyKey: "key-1234567890",
        payloadHash: expectedHash,
        transactionId: "existing-tx-999",
      };
      const mockExistingTx = {
        transactionId: "existing-tx-999",
        type: "income",
        amount: 100000,
        currency: "IDR",
        categoryId: "CAT-IURAN",
        period: "2026-11",
        status: "PENDING_APPROVAL",
      };

      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockImplementation(async (ref: any) => {
            if (ref.path?.includes("idempotencyKeys")) {
              return {
                exists: true,
                data: () => mockKeyData,
              };
            }
            return {
              exists: true,
              id: "existing-tx-999",
              data: () => mockExistingTx,
            };
          }),
          set: vi.fn(),
          update: vi.fn(),
        };
        return callback(fakeTx);
      });

      const result = await recordTransaction(
        {
          type: "income",
          amount: 100000,
          categoryId: "CAT-IURAN",
          period: "2026-11",
          idempotencyKey: "key-1234567890",
        },
        "bendahara-uid"
      );

      expect(result.isNew).toBe(false);
      expect(result.transaction.transactionId).toBe("existing-tx-999");
    });

    it("throws IdempotencyConflictError (409) when same key is sent with different transaction payload", async () => {
      const mockKeyData = {
        idempotencyKey: "key-conflict-test",
        payloadHash: "hash-original",
        transactionId: "tx-original-1",
      };

      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockImplementation(async (ref: any) => {
            if (ref.path?.includes("idempotencyKeys")) {
              return {
                exists: true,
                data: () => mockKeyData,
              };
            }
            return { exists: false };
          }),
          set: vi.fn(),
          update: vi.fn(),
        };
        return callback(fakeTx);
      });

      await expect(
        recordTransaction(
          {
            type: "income",
            amount: 750000, // different amount
            categoryId: "CAT-IURAN",
            period: "2026-11",
            idempotencyKey: "key-conflict-test",
          },
          "bendahara-uid"
        )
      ).rejects.toThrow(IdempotencyConflictError);
    });

    it("simulates concurrent requests with same idempotency key and payload", async () => {
      const expectedHash = "8925c3c0539bf0b2dcded51b77957e15f0638cf0d5df1c2fcfbbc287e721b1a5";
      let isFirstCall = true;

      // Simulate Firestore transaction conflict resolution:
      // The first transaction commits and writes the key.
      // The second transaction (or retry) reads the committed key and returns the existing transaction.
      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        if (isFirstCall) {
          isFirstCall = false;
          const fakeTx1 = {
            get: vi.fn().mockResolvedValue({ exists: false }),
            set: vi.fn(),
            update: vi.fn(),
          };
          return callback(fakeTx1);
        } else {
          const fakeTx2 = {
            get: vi.fn().mockImplementation(async (ref: any) => {
              if (ref.path?.includes("idempotencyKeys")) {
                return {
                  exists: true,
                  data: () => ({
                    idempotencyKey: "concurrent-key-12345",
                    payloadHash: expectedHash,
                    transactionId: "tx-concurrent-winner",
                  }),
                };
              }
              return {
                exists: true,
                id: "tx-concurrent-winner",
                data: () => ({
                  transactionId: "tx-concurrent-winner",
                  amount: 100000,
                  type: "income",
                }),
              };
            }),
            set: vi.fn(),
            update: vi.fn(),
          };
          return callback(fakeTx2);
        }
      });

      const payload = {
        type: "income" as const,
        amount: 100000,
        categoryId: "CAT-IURAN",
        period: "2026-11",
        idempotencyKey: "concurrent-key-12345",
      };

      const res1 = await recordTransaction(payload, "actor-1");
      const res2 = await recordTransaction(payload, "actor-2");

      // Exactly one was marked as new
      const newCount = (res1.isNew ? 1 : 0) + (res2.isNew ? 1 : 0);
      expect(newCount).toBe(1);
      expect(res1.isNew).toBe(true);
      expect(res2.isNew).toBe(false);
    });
  });

  describe("Separation of Duties & Approval Workflow", () => {
    it("forbids the creator of a transaction from approving their own transaction", async () => {
      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              transactionId: "tx-123",
              createdBy: "bendahara-uid", // Same as approver!
              status: "PENDING_APPROVAL",
              amount: 500000,
            }),
          }),
          update: vi.fn(),
        };
        return callback(fakeTx);
      });

      await expect(
        processTransactionApproval(
          "tx-123",
          { action: "APPROVE" },
          "bendahara-uid" // Same UID as creator!
        )
      ).rejects.toThrow(SeparationOfDutiesError);
    });

    it("allows independent reviewer (e.g. Ketua RT) to approve transaction to POSTED status", async () => {
      let updatedData: any = null;
      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              transactionId: "tx-123",
              createdBy: "bendahara-uid",
              status: "PENDING_APPROVAL",
              amount: 500000,
            }),
          }),
          update: vi.fn().mockImplementation((ref: any, data: any) => {
            updatedData = data;
          }),
        };
        return callback(fakeTx);
      });

      const result = await processTransactionApproval(
        "tx-123",
        { action: "APPROVE" },
        "ketua-rt-uid" // Different UID
      );

      expect(result.status).toBe("POSTED");
      expect(result.approvedBy).toBe("ketua-rt-uid");
    });

    it("requires rejectionReason when rejecting a transaction", () => {
      const invalidReject = {
        action: "REJECT",
        rejectionReason: "",
      };
      const res = approveTransactionSchema.safeParse(invalidReject);
      expect(res.success).toBe(false);

      const validReject = {
        action: "REJECT",
        rejectionReason: "Nominal dan kuitansi fisik tidak sesuai dengan catatan kas",
      };
      const resValid = approveTransactionSchema.safeParse(validReject);
      expect(resValid.success).toBe(true);
    });

    it("rejects approving a transaction that is not in PENDING_APPROVAL status", async () => {
      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              transactionId: "tx-posted-already",
              createdBy: "bendahara-uid",
              status: "POSTED",
            }),
          }),
          update: vi.fn(),
        };
        return callback(fakeTx);
      });

      await expect(
        processTransactionApproval("tx-posted-already", { action: "APPROVE" }, "ketua-rt-uid")
      ).rejects.toThrow(InvalidTransactionStateError);
    });
  });

  describe("Reversal Ledger Integrity", () => {
    it("creates an offsetting reversal transaction and updates original status to REVERSED", async () => {
      let originalUpdated: any = null;
      let reversalCreated: any = null;

      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              transactionId: "tx-to-reverse",
              type: "income",
              amount: 150000,
              categoryId: "CAT-IURAN",
              period: "2026-11",
              status: "POSTED",
            }),
          }),
          set: vi.fn().mockImplementation((ref: any, data: any) => {
            if (ref.path?.includes("transactions")) {
              reversalCreated = data;
            }
          }),
          update: vi.fn().mockImplementation((ref: any, data: any) => {
            originalUpdated = data;
          }),
        };
        return callback(fakeTx);
      });

      const result = await processTransactionReversal(
        {
          originalTransactionId: "tx-to-reverse",
          reason: "Salah input data warga duplikat",
        },
        "bendahara-uid"
      );

      expect(result.originalTransaction.status).toBe("REVERSED");
      expect(reversalCreated.isReversal).toBe(true);
      expect(reversalCreated.type).toBe("expense"); // Offsetting entry
      expect(reversalCreated.originalTransactionId).toBe("tx-to-reverse");
      expect(originalUpdated.status).toBe("REVERSED");
    });

    it("rejects reversing an already reversed transaction", async () => {
      vi.spyOn(adminDb, "runTransaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              transactionId: "tx-already-reversed",
              status: "POSTED",
              reversedAt: "2026-11-15T00:00:00Z",
            }),
          }),
        };
        return callback(fakeTx);
      });

      await expect(
        processTransactionReversal(
          {
            originalTransactionId: "tx-already-reversed",
            reason: "Double reversal attempt",
          },
          "bendahara-uid"
        )
      ).rejects.toThrow(InvalidTransactionStateError);
    });
  });
});
