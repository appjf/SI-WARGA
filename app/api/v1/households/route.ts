import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/server/auth/guard";
import { createHouseholdSchema } from "@/server/validation/households";
import {
  listHouseholds,
  createHousehold,
  HouseholdError,
} from "@/server/business-logic/households";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const result = await listHouseholds(auth.user.roles, auth.user.houseId, search);

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: { count: result.count, requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load households";
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
  const auth = await requirePermission(req, "households:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = createHouseholdSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const household = await createHousehold(parsed.data, auth.user.uid, requestId);

    return NextResponse.json(
      {
        success: true,
        data: household,
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof HouseholdError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
          meta: { requestId },
        },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create household";
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
