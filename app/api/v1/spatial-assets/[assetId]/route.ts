import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { updateSpatialAssetSchema } from "@/server/validation/spatial-assets";
import {
  getSpatialAssetById,
  updateSpatialAsset,
} from "@/server/business-logic/spatial-assets";
import { getUserProfile } from "@/lib/firebase/admin-firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { assetId } = await params;

  const auth = await requirePermission(req, "gis:read");
  if (!auth.success) {
    return auth.response;
  }

  const asset = await getSpatialAssetById(assetId);
  if (!asset) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: `Aset spasial [${assetId}] tidak ditemukan.` },
        meta: { requestId },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: asset, meta: { requestId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { assetId } = await params;

  const auth = await requirePermission(req, "gis:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateSpatialAssetSchema.safeParse(rawBody);
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

    const profile = await getUserProfile(auth.user.uid).catch(() => null);
    const actorName = profile?.displayName || auth.user.email || auth.user.uid;

    const updated = await updateSpatialAsset(
      assetId,
      parsed.data,
      auth.user.uid,
      actorName,
      requestId
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: `Aset spasial [${assetId}] tidak ditemukan.` },
          meta: { requestId },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated, meta: { requestId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update spatial asset";
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
