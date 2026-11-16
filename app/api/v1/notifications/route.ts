import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAnyRole } from "@/server/auth/guard";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
} from "@/server/validation/notifications";
import {
  sendNotification,
  getUserNotifications,
} from "@/server/business-logic/notifications";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listNotificationsQuerySchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      unreadOnly: searchParams.get("unreadOnly") || undefined,
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

    const result = await getUserNotifications(auth.user.uid, parsedQuery.data);

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
        error: { code: "NOTIFICATION_FETCH_ERROR", message: error.message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: only community officials can dispatch notifications
  const auth = await requireAnyRole(req, [
    "SUPER_ADMIN",
    "ADMIN_RW",
    "KETUA_RT",
    "SEKRETARIS_RT",
    "BENDAHARA_RT",
  ]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createNotificationSchema.safeParse(rawBody);

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

    const notification = await sendNotification(
      parseResult.data,
      auth.user.uid,
      requestId
    );

    return NextResponse.json(
      {
        success: true,
        data: notification,
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOTIFICATION_CREATE_ERROR", message: error.message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
