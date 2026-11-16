import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/server/auth/guard";
import { updateHouseholdSchema } from "@/server/validation/households";
import { getHouseholdById, updateHousehold } from "@/server/business-logic/households";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  const isStaff = auth.user.roles.some((r) =>
    ["SUPER_ADMIN", "ADMIN_RW", "KETUA_RT", "SEKRETARIS_RT", "BENDAHARA_RT", "PENGURUS"].includes(r)
  );
  if (!isStaff && auth.user.houseId !== id) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Akses rumah tangga dibatasi untuk unit milik sendiri." },
        meta: { requestId },
      },
      { status: 403 }
    );
  }

  const household = await getHouseholdById(id);
  if (!household) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: `Rumah tangga [${id}] tidak ditemukan.` },
        meta: { requestId },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: household, meta: { requestId } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  const auth = await requirePermission(req, "households:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateHouseholdSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid household update",
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const updated = await updateHousehold(id, parsed.data, auth.user.uid, requestId);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: `Rumah tangga [${id}] tidak ditemukan.` },
          meta: { requestId },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated, meta: { requestId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update household";
    return NextResponse.json(
      {
        success: false,
        error: { code: "UPDATE_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
