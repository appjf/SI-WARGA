import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import {
  fetchComplaintById,
  UnauthorizedTransitionError,
} from "@/server/business-logic/complaints";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { ticketId } = await params;

  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const complaint = await fetchComplaintById(
      ticketId,
      auth.user.roles,
      auth.user.uid
    );

    if (!complaint) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: `Complaint ticket [${ticketId}] not found` },
          meta: { requestId },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: complaint,
      meta: { requestId },
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedTransitionError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: error.message },
          meta: { requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "FETCH_ERROR", message: error.message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
