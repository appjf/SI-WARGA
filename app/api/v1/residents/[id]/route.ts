import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { updateResidentSchema } from "@/server/validation/residents";
import {
  fetchResidentById,
  modifyResident,
  ResidentValidationError,
  ResidentForbiddenError,
} from "@/server/business-logic/residents";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  const auth = await requirePermission(req, "residents:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const resident = await fetchResidentById(
      id,
      auth.user.roles,
      auth.user.uid,
      auth.user.residentId
    );

    if (!resident) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: `Resident [${id}] not found` },
          meta: { requestId },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resident,
      meta: { requestId },
    });
  } catch (error: any) {
    if (error instanceof ResidentForbiddenError) {
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  const auth = await requirePermission(req, "residents:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = updateResidentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: parseResult.error.issues[0]?.message },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const updated = await modifyResident(
      id,
      parseResult.data,
      auth.user.uid,
      auth.user.roles,
      requestId
    );

    return NextResponse.json({
      success: true,
      data: updated,
      meta: { requestId },
    });
  } catch (error: any) {
    if (error instanceof ResidentValidationError) {
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
        error: { code: "UPDATE_ERROR", message: error.message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
