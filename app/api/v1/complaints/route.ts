import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import {
  createComplaintSchema,
  listComplaintsQuerySchema,
} from "@/server/validation/complaints";
import {
  submitComplaint,
  fetchComplaints,
  ComplaintValidationError,
} from "@/server/business-logic/complaints";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require complaints:read permission
  const auth = await requirePermission(req, "complaints:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listComplaintsQuerySchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
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

    const result = await fetchComplaints(
      parsedQuery.data,
      auth.user.roles,
      auth.user.uid
    );

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
        error: { code: "FETCH_ERROR", message: error.message || "Failed to retrieve complaints" },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require complaints:write permission
  const auth = await requirePermission(req, "complaints:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createComplaintSchema.safeParse(rawBody);

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

    // Reporter ID is extracted strictly from verified token
    const reporterId = auth.user.uid;

    const complaint = await submitComplaint(
      parseResult.data,
      reporterId,
      requestId
    );

    return NextResponse.json(
      {
        success: true,
        data: complaint,
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ComplaintValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: error.message },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "CREATE_ERROR", message: error.message || "Failed to submit complaint" },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
