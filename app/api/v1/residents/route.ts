import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import {
  createResidentSchema,
  listResidentsQuerySchema,
} from "@/server/validation/residents";
import {
  registerNewResident,
  fetchResidents,
  ResidentValidationError,
} from "@/server/business-logic/residents";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require residents:read permission
  const auth = await requirePermission(req, "residents:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listResidentsQuerySchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      houseId: searchParams.get("houseId") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: parsedQuery.error.issues[0]?.message || "Invalid query parameters" },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const result = await fetchResidents(
      parsedQuery.data,
      auth.user.roles,
      auth.user.uid,
      auth.user.residentId
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
        error: { code: "FETCH_ERROR", message: error.message || "Failed to retrieve resident directory" },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require residents:write permission
  const auth = await requirePermission(req, "residents:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createResidentSchema.safeParse(rawBody);

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

    // Actor UID is taken EXCLUSIVELY from the verified auth token, preventing spoofing
    const actorUid = auth.user.uid;

    const newResident = await registerNewResident(parseResult.data, actorUid, requestId);

    return NextResponse.json(
      {
        success: true,
        data: newResident,
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ResidentValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "HOUSEHOLD_NOT_FOUND", message: error.message },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "CREATE_ERROR", message: error.message || "Failed to register resident" },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
