import "server-only";
import {
  CreateTransactionInput,
  ApproveTransactionInput,
  ReversalTransactionInput,
  ListTransactionsQuery,
} from "@/server/validation/finance";
import {
  TransactionDocument,
  executeIdempotentTransaction,
  executeApproveTransaction,
  executeReversalTransaction,
  listTransactions as repoListTransactions,
  getTransactionById as repoGetTransactionById,
  getFinancialSummary as repoGetFinancialSummary,
  IdempotencyConflictError,
  SeparationOfDutiesError,
  InvalidTransactionStateError,
} from "@/server/data-access/finance";
import { createAuditLog } from "@/lib/firebase/admin-firestore";

export {
  IdempotencyConflictError,
  SeparationOfDutiesError,
  InvalidTransactionStateError,
};

export class FinanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceValidationError";
  }
}

export async function recordTransaction(
  input: CreateTransactionInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<{ transaction: TransactionDocument; isNew: boolean }> {
  // Validate integer IDR
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new FinanceValidationError("Amount must be a strictly positive integer Rupiah.");
  }

  const result = await executeIdempotentTransaction(input, actorUid);

  if (result.isNew) {
    await createAuditLog({
      actorUid,
      action: "CREATE_TRANSACTION",
      entityType: "transaction",
      entityId: result.transaction.transactionId,
      result: "SUCCESS",
      metadata: {
        type: input.type,
        amount: input.amount,
        period: input.period,
        categoryId: input.categoryId,
        idempotencyKey: input.idempotencyKey,
      },
      requestId,
    });
  }

  return result;
}

export async function processTransactionApproval(
  transactionId: string,
  input: ApproveTransactionInput,
  approverUid: string,
  requestId: string = crypto.randomUUID()
): Promise<TransactionDocument> {
  const updatedTx = await executeApproveTransaction(
    transactionId,
    approverUid,
    input.action,
    input.rejectionReason
  );

  await createAuditLog({
    actorUid: approverUid,
    action: input.action === "APPROVE" ? "APPROVE_TRANSACTION" : "REJECT_TRANSACTION",
    entityType: "transaction",
    entityId: transactionId,
    result: "SUCCESS",
    metadata: {
      action: input.action,
      rejectionReason: input.rejectionReason,
      amount: updatedTx.amount,
      period: updatedTx.period,
    },
    requestId,
  });

  return updatedTx;
}

export async function processTransactionReversal(
  input: ReversalTransactionInput,
  actorUid: string,
  requestId: string = crypto.randomUUID()
): Promise<{ reversalTransaction: TransactionDocument; originalTransaction: TransactionDocument }> {
  const result = await executeReversalTransaction(
    input.originalTransactionId,
    input.reason,
    actorUid,
    input.idempotencyKey
  );

  await createAuditLog({
    actorUid,
    action: "REVERSE_TRANSACTION",
    entityType: "transaction",
    entityId: input.originalTransactionId,
    result: "SUCCESS",
    metadata: {
      originalTransactionId: input.originalTransactionId,
      reversalTransactionId: result.reversalTransaction.transactionId,
      reason: input.reason,
      amount: result.reversalTransaction.amount,
    },
    requestId,
  });

  return result;
}

export async function fetchTransactions(query: ListTransactionsQuery) {
  return await repoListTransactions(query);
}

export async function fetchTransactionById(transactionId: string) {
  return await repoGetTransactionById(transactionId);
}

export async function calculateFinancialSummary() {
  return await repoGetFinancialSummary();
}
