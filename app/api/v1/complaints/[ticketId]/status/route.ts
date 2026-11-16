import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { updateComplaintStatusSchema } from "@/server/validation/complaints";
import {
  transitionComplaintStatus,
  fetchComplaintById,
  InvalidStateTransitionError,
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
      data: {
        ticketId: complaint.ticketId,
        status: complaint.status,
        statusHistory: complaint.statusHistory || [],
        assignedTo: complaint.assignedTo || null,
        rejectionReason: complaint.rejectionReason || null,
        resolvedAt: complaint.resolvedAt || null,
        closedAt: complaint.closedAt || null,
      },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { ticketId } = await params;

  // Authentication check
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = updateComplaintStatusSchema.safeParse(rawBody);

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

    const actorUid = auth.user.uid;

    const updatedComplaint = await transitionComplaintStatus(
      ticketId,
      parseResult.data,
      actorUid,
      auth.user.roles,
      requestId
    );

    return NextResponse.json({
      success: true,
      data: updatedComplaint,
      meta: {
        requestId,
        newStatus: updatedComplaint.status,
      },
    });
  } catch (error: any) {
    if (error instanceof InvalidStateTransitionError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE_TRANSITION",
            message: error.message,
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    if (error instanceof UnauthorizedTransitionError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
          meta: { requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TRANSITION_ERROR",
          message: error.message || "Failed to update complaint status",
        },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
