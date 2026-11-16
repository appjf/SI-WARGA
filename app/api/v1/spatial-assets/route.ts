import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import {
  createSpatialAssetSchema,
  spatialLayerTypeEnum,
} from "@/server/validation/spatial-assets";
import {
  listSpatialAssets,
  createSpatialAsset,
} from "@/server/business-logic/spatial-assets";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requirePermission(req, "gis:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const layerParam = searchParams.get("layerType");
    const parsedLayer = layerParam
      ? spatialLayerTypeEnum.safeParse(layerParam)
      : null;

    const result = await listSpatialAssets({
      layerType: parsedLayer?.success ? parsedLayer.data : undefined,
      condition: searchParams.get("condition") || undefined,
      search: searchParams.get("search") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: { count: result.count, requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load spatial assets";
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
  const auth = await requirePermission(req, "gis:write");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = createSpatialAssetSchema.safeParse(rawBody);
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

    const asset = await createSpatialAsset(parsed.data, auth.user.uid, requestId);

    return NextResponse.json(
      {
        success: true,
        data: asset,
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create spatial asset";
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
