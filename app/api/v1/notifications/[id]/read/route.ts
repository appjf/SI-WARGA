import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { readNotification } from "@/server/business-logic/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const updated = await readNotification(id, auth.user.uid);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: `Notification [${id}] not found` },
          meta: { requestId },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      meta: { requestId },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_NOTIFICATION_ACCESS") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Forbidden: You are not the recipient of this notification" },
          meta: { requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "UPDATE_ERROR", message: error.message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
