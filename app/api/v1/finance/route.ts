import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
} from "@/server/validation/finance";
import {
  recordTransaction,
  fetchTransactions,
  IdempotencyConflictError,
  FinanceValidationError,
} from "@/server/business-logic/finance";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require finance:read permission (Bendahara RT, Ketua RT, Admin)
  const auth = await requirePermission(req, "finance:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listTransactionsQuerySchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      period: searchParams.get("period") || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: parsedQuery.error.issues[0]?.message },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const result = await fetchTransactions(parsedQuery.data);

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: {
        count: result.count,
        limit: parsedQuery.data.limit,
        requestId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FETCH_ERROR", message: error.message || "Failed to retrieve transactions" },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require finance:write permission
  const auth = await requirePermission(req, "finance:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createTransactionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    // Actor UID extracted strictly from verified token
    const actorUid = auth.user.uid;

    const { transaction, isNew } = await recordTransaction(
      parseResult.data,
      actorUid,
      requestId
    );

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        meta: {
          requestId,
          idempotentReplay: !isNew,
        },
      },
      { status: isNew ? 201 : 200 }
    );
  } catch (error: any) {
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "IDEMPOTENCY_CONFLICT",
            message: error.message,
          },
          meta: { requestId },
        },
        { status: 409 }
      );
    }

    if (error instanceof FinanceValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
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
          code: "TRANSACTION_ERROR",
          message: error.message || "Internal transaction recording error",
        },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
