import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import {
  fetchGisLayer,
  executeSpatialQuery,
  executeValidateGeometry,
  GisServiceError,
} from "@/server/integrations/gis-client";
import { spatialQuerySchema, geometryValidationSchema } from "@/server/validation/gis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const requestId = crypto.randomUUID();
  const { path } = await params;
  const subPath = path.join("/");

  // Guard: require gis:read permission
  const auth = await requirePermission(req, "gis:read");
  if (!auth.success) {
    return auth.response;
  }

  const validLayers = [
    "boundaries",
    "houses",
    "facilities",
    "roads",
    "drainage",
    "assets",
  ] as const;
  const layer = validLayers.find((l) => l === subPath || subPath.endsWith(l));

  if (!layer) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: `Unknown GIS resource [${subPath}]` },
        meta: { requestId },
      },
      { status: 404 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const data = await fetchGisLayer(layer, queryParams);

    return NextResponse.json({
      success: true,
      data,
      meta: { layer, requestId },
    });
  } catch (error: any) {
    const statusCode = error instanceof GisServiceError ? error.statusCode : 503;
    const errorCode = error instanceof GisServiceError ? error.code : "GIS_SERVICE_UNAVAILABLE";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: error.message || "Failed to fetch spatial data from GIS service",
        },
        meta: { requestId },
      },
      { status: statusCode }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const requestId = crypto.randomUUID();
  const { path } = await params;
  const subPath = path.join("/");

  // Guard: require gis:read or gis:write depending on action
  const auth = await requirePermission(req, "gis:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));

    if (subPath === "spatial-query" || subPath.endsWith("spatial-query")) {
      const parsed = spatialQuerySchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message },
            meta: { requestId },
          },
          { status: 400 }
        );
      }

      const result = await executeSpatialQuery(parsed.data);
      return NextResponse.json({
        success: true,
        data: result,
        meta: { requestId },
      });
    }

    if (subPath === "validate-geometry" || subPath.endsWith("validate-geometry")) {
      // Geometry validation requires gis:write permission
      const writeAuth = await requirePermission(req, "gis:write");
      if (!writeAuth.success) {
        return writeAuth.response;
      }

      const parsed = geometryValidationSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message },
            meta: { requestId },
          },
          { status: 400 }
        );
      }

      const result = await executeValidateGeometry(parsed.data);
      return NextResponse.json({
        success: true,
        data: result,
        meta: { requestId },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: `Unsupported GIS action [${subPath}]` },
        meta: { requestId },
      },
      { status: 404 }
    );
  } catch (error: any) {
    const statusCode = error instanceof GisServiceError ? error.statusCode : 503;
    const errorCode = error instanceof GisServiceError ? error.code : "GIS_SERVICE_UNAVAILABLE";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: error.message || "Failed to process GIS spatial request",
        },
        meta: { requestId },
      },
      { status: statusCode }
    );
  }
}
