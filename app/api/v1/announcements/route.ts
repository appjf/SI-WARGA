import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAnyRole } from "@/server/auth/guard";
import { createAnnouncementSchema } from "@/server/validation/announcements";
import {
  listAnnouncements,
  publishAnnouncement,
} from "@/server/business-logic/announcements";
import { getUserProfile } from "@/lib/firebase/admin-firestore";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const result = await listAnnouncements(auth.user.roles, category);

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: { count: result.count, requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load announcements";
    return NextResponse.json(
      {
        success: false,
        error: { code: "FETCH_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
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
    const parsed = createAnnouncementSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((i) => i.message).join(", "),
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const profile = await getUserProfile(auth.user.uid).catch(() => null);
    const actorName =
      profile?.displayName || auth.user.email || "Pengurus RT 06";

    const created = await publishAnnouncement(
      parsed.data,
      auth.user.uid,
      actorName,
      requestId
    );

    return NextResponse.json(
      {
        success: true,
        data: created,
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish announcement";
    return NextResponse.json(
      {
        success: false,
        error: { code: "CREATE_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
