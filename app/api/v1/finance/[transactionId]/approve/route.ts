import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { approveTransactionSchema } from "@/server/validation/finance";
import {
  processTransactionApproval,
  SeparationOfDutiesError,
  InvalidTransactionStateError,
} from "@/server/business-logic/finance";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { transactionId } = await params;

  // Guard: require finance:approve permission (Ketua RT, Super Admin, Bendahara RT)
  const auth = await requirePermission(req, "finance:approve");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = approveTransactionSchema.safeParse(rawBody);

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

    const approverUid = auth.user.uid;

    const updatedTransaction = await processTransactionApproval(
      transactionId,
      parseResult.data,
      approverUid,
      requestId
    );

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      meta: {
        requestId,
        status: updatedTransaction.status,
      },
    });
  } catch (error: any) {
    if (error instanceof SeparationOfDutiesError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SEPARATION_OF_DUTIES_VIOLATION",
            message: error.message,
          },
          meta: { requestId },
        },
        { status: 403 }
      );
    }

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
          code: "APPROVAL_ERROR",
          message: error.message || "Failed to process transaction approval",
        },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
