import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { reversalTransactionSchema } from "@/server/validation/finance";
import {
  processTransactionReversal,
  InvalidTransactionStateError,
} from "@/server/business-logic/finance";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require finance:write permission
  const auth = await requirePermission(req, "finance:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = reversalTransactionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.issues.map((i) => i.message).join(", "),
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const actorUid = auth.user.uid;

    const result = await processTransactionReversal(
      parseResult.data,
      actorUid,
      requestId
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          reversalTransaction: result.reversalTransaction,
          originalTransaction: result.originalTransaction,
        },
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof InvalidTransactionStateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TRANSACTION_STATE",
            message: error.message,
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REVERSAL_ERROR",
          message: error.message || "Failed to reverse transaction",
        },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
