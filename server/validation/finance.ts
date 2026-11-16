import { z } from "zod";

export const transactionTypeEnum = z.enum(["income", "expense"]);
export const transactionStatusEnum = z.enum([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "POSTED",
  "REVERSED",
]);

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  amount: z
    .number()
    .int("Amount must be an integer (Rupiah)")
    .positive("Amount must be strictly positive (greater than 0)")
    .refine((val) => Number.isSafeInteger(val), {
      message: "Amount exceeds maximum safe integer",
    }),
  categoryId: z.string().min(1, "categoryId is required").max(50),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM format"),
  description: z.string().max(500).optional(),
  idempotencyKey: z
    .string()
    .min(10, "idempotencyKey must be at least 10 characters")
    .max(128, "idempotencyKey must not exceed 128 characters")
    .optional(),
  sourceAccount: z.string().max(50).optional(),
});

export const approveTransactionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.action === "REJECT") {
        return !!data.rejectionReason && data.rejectionReason.trim().length >= 5;
      }
      return true;
    },
    {
      message: "rejectionReason with at least 5 characters is required when rejecting a transaction",
      path: ["rejectionReason"],
    }
  );

export const reversalTransactionSchema = z.object({
  originalTransactionId: z.string().min(1, "originalTransactionId is required"),
  reason: z.string().min(5, "Reversal reason must be at least 5 characters").max(500),
  idempotencyKey: z.string().min(10).max(128).optional(),
});

export const listTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  type: transactionTypeEnum.optional(),
  status: transactionStatusEnum.optional(),
  period: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ApproveTransactionInput = z.infer<typeof approveTransactionSchema>;
export type ReversalTransactionInput = z.infer<typeof reversalTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
