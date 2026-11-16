import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import {
  CreateTransactionInput,
  ListTransactionsQuery,
} from "@/server/validation/finance";

export interface TransactionDocument {
  transactionId: string;
  type: "income" | "expense";
  amount: number;
  currency: "IDR";
  categoryId: string;
  period: string;
  description: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "POSTED" | "REVERSED";
  idempotencyKey: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  postedAt?: any;
  approvedBy?: string;
  approvedAt?: any;
  rejectedBy?: string;
  rejectedAt?: any;
  rejectionReason?: string;
  isReversal?: boolean;
  originalTransactionId?: string;
  reversalTransactionId?: string;
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: any;
}

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class SeparationOfDutiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeparationOfDutiesError";
  }
}

export class InvalidTransactionStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionStateError";
  }
}

function computePayloadHash(payload: {
  type: string;
  amount: number;
  categoryId: string;
  period: string;
}): string {
  const canonical = `${payload.type}:${payload.amount}:${payload.categoryId}:${payload.period}`;
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export async function getTransactionById(transactionId: string): Promise<TransactionDocument | null> {
  const doc = await adminDb.collection("transactions").doc(transactionId).get();
  if (!doc.exists) return null;
  return { transactionId: doc.id, ...doc.data() } as TransactionDocument;
}

export async function listTransactions(
  params: ListTransactionsQuery
): Promise<{ items: TransactionDocument[]; count: number }> {
  let query = adminDb.collection("transactions").orderBy("createdAt", "desc");

  if (params.type) {
    query = query.where("type", "==", params.type);
  }

  if (params.status) {
    query = query.where("status", "==", params.status);
  }

  if (params.period) {
    query = query.where("period", "==", params.period);
  }

  query = query.limit(params.limit || 20);

  if (params.cursor) {
    const cursorDoc = await adminDb.collection("transactions").doc(params.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const items = snapshot.docs.map((doc) => ({
    transactionId: doc.id,
    ...doc.data(),
  })) as TransactionDocument[];

  return {
    items,
    count: items.length,
  };
}

/**
 * Executes transaction creation with atomic idempotency check using Firestore runTransaction.
 * - If same idempotencyKey is used with same payload: returns existing transaction (no duplicate).
 * - If same idempotencyKey is used with different payload: throws IdempotencyConflictError (409).
 * - If key is new: creates transaction with status PENDING_APPROVAL and records idempotency key.
 */
export async function executeIdempotentTransaction(
  input: CreateTransactionInput,
  actorUid: string
): Promise<{ transaction: TransactionDocument; isNew: boolean }> {
  const idempotencyKey = input.idempotencyKey || `auto-${crypto.randomUUID()}`;
  const payloadHash = computePayloadHash({
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    period: input.period,
  });

  const keyRef = adminDb.collection("idempotencyKeys").doc(idempotencyKey);
  const txRef = adminDb.collection("transactions").doc();

  return await adminDb.runTransaction(async (transaction) => {
    const existingKeyDoc = await transaction.get(keyRef);

    if (existingKeyDoc.exists) {
      const keyData = existingKeyDoc.data()!;
      if (keyData.payloadHash !== payloadHash) {
        throw new IdempotencyConflictError(
          `Idempotency key [${idempotencyKey}] was already used with a different transaction payload.`
        );
      }

      // Read existing transaction
      const existingTxRef = adminDb.collection("transactions").doc(keyData.transactionId);
      const existingTxDoc = await transaction.get(existingTxRef);

      if (existingTxDoc.exists) {
        return {
          transaction: { transactionId: existingTxDoc.id, ...existingTxDoc.data() } as TransactionDocument,
          isNew: false,
        };
      }
    }

    // New transaction
    const newTx: TransactionDocument = {
      transactionId: txRef.id,
      type: input.type,
      amount: input.amount,
      currency: "IDR",
      categoryId: input.categoryId,
      period: input.period,
      description: input.description || "",
      status: "PENDING_APPROVAL",
      idempotencyKey,
      createdBy: actorUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.set(txRef, newTx);
    transaction.set(keyRef, {
      idempotencyKey,
      payloadHash,
      transactionId: txRef.id,
      createdBy: actorUid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      transaction: newTx,
      isNew: true,
    };
  });
}

/**
 * Enforces Separation of Duties:
 * - Transaction creator (createdBy) cannot approve or reject their own transaction.
 * - Approves or rejects a transaction in PENDING_APPROVAL status.
 */
export async function executeApproveTransaction(
  transactionId: string,
  approverUid: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
): Promise<TransactionDocument> {
  const txRef = adminDb.collection("transactions").doc(transactionId);

  return await adminDb.runTransaction(async (transaction) => {
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists) {
      throw new InvalidTransactionStateError(`Transaction [${transactionId}] not found.`);
    }

    const txData = txDoc.data() as TransactionDocument;

    // Separation of Duties check
    if (txData.createdBy === approverUid) {
      throw new SeparationOfDutiesError(
        "Separation of duties violation: The transaction creator cannot approve or reject their own transaction."
      );
    }

    // Valid state check
    if (txData.status !== "PENDING_APPROVAL") {
      throw new InvalidTransactionStateError(
        `Cannot ${action.toLowerCase()} transaction in state [${txData.status}]. Must be PENDING_APPROVAL.`
      );
    }

    const updates: Partial<TransactionDocument> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (action === "APPROVE") {
      updates.status = "POSTED";
      updates.approvedBy = approverUid;
      updates.approvedAt = FieldValue.serverTimestamp();
      updates.postedAt = FieldValue.serverTimestamp();
    } else {
      updates.status = "REJECTED";
      updates.rejectedBy = approverUid;
      updates.rejectedAt = FieldValue.serverTimestamp();
      updates.rejectionReason = rejectionReason || "Rejected by authorized reviewer";
    }

    transaction.update(txRef, updates);

    return {
      ...txData,
      ...updates,
    };
  });
}

/**
 * Reverses a posted transaction by creating an atomic reversal record
 * and marking the original transaction as REVERSED.
 */
export async function executeReversalTransaction(
  originalTransactionId: string,
  reason: string,
  actorUid: string,
  idempotencyKey?: string
): Promise<{ reversalTransaction: TransactionDocument; originalTransaction: TransactionDocument }> {
  const originalTxRef = adminDb.collection("transactions").doc(originalTransactionId);
  const reversalTxRef = adminDb.collection("transactions").doc();
  const revIdempotencyKey = idempotencyKey || `rev-${crypto.randomUUID()}`;
  const keyRef = adminDb.collection("idempotencyKeys").doc(revIdempotencyKey);

  return await adminDb.runTransaction(async (transaction) => {
    const originalDoc = await transaction.get(originalTxRef);
    if (!originalDoc.exists) {
      throw new InvalidTransactionStateError(`Original transaction [${originalTransactionId}] not found.`);
    }

    const origData = originalDoc.data() as TransactionDocument;

    if (origData.status !== "POSTED") {
      throw new InvalidTransactionStateError(
        `Cannot reverse transaction with status [${origData.status}]. Only POSTED transactions can be reversed.`
      );
    }

    if (origData.reversedAt) {
      throw new InvalidTransactionStateError(
        `Transaction [${originalTransactionId}] has already been reversed.`
      );
    }

    // Create offsetting reversal transaction
    const reversalType = origData.type === "income" ? "expense" : "income";
    const reversalTx: TransactionDocument = {
      transactionId: reversalTxRef.id,
      type: reversalType,
      amount: origData.amount,
      currency: "IDR",
      categoryId: origData.categoryId,
      period: origData.period,
      description: `Reversal for [${originalTransactionId}]: ${reason}`,
      status: "POSTED",
      isReversal: true,
      originalTransactionId,
      idempotencyKey: revIdempotencyKey,
      createdBy: actorUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      postedAt: FieldValue.serverTimestamp(),
    };

    transaction.set(reversalTxRef, reversalTx);

    // Update original transaction
    transaction.update(originalTxRef, {
      status: "REVERSED",
      reversedBy: actorUid,
      reversedAt: FieldValue.serverTimestamp(),
      reversalTransactionId: reversalTxRef.id,
      reversalReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(keyRef, {
      idempotencyKey: revIdempotencyKey,
      payloadHash: `reversal:${originalTransactionId}`,
      transactionId: reversalTxRef.id,
      createdBy: actorUid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      reversalTransaction: reversalTx,
      originalTransaction: {
        ...origData,
        status: "REVERSED",
        reversalTransactionId: reversalTxRef.id,
      },
    };
  });
}

/**
 * Calculates current settled financial balance. Only POSTED transactions count.
 * REVERSED transactions and offsetting reversal transactions are accounted for.
 */
export async function getFinancialSummary(): Promise<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: string;
  postedCount: number;
}> {
  const snapshot = await adminDb.collection("transactions").where("status", "==", "POSTED").get();

  let totalIncome = 0;
  let totalExpense = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as TransactionDocument;
    if (data.type === "income") {
      totalIncome += data.amount || 0;
    } else if (data.type === "expense") {
      totalExpense += data.amount || 0;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    currency: "IDR",
    postedCount: snapshot.size,
  };
}
