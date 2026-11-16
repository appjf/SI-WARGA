import "server-only";
import { SpatialQueryInput, GeometryValidationInput } from "@/server/validation/gis";

export class GisServiceError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 502, code: string = "GIS_SERVICE_ERROR") {
    super(message);
    this.name = "GisServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getGisBaseUrl(): string {
  const url = process.env.GIS_API_BASE_URL || process.env.GIS_SERVICE_URL || "http://localhost:8000/v1";
  return url.replace(/\/+$/, "");
}

/**
 * Server-side client for interacting with the FastAPI GIS Spatial Microservice.
 * Strictly server-only; includes timeout controls and resilience.
 */
export async function fetchGisLayer(
  layerName: "boundaries" | "houses" | "facilities" | "roads" | "drainage" | "assets",
  queryParams?: Record<string, string>
) {
  const baseUrl = getGisBaseUrl();
  const searchParams = queryParams ? new URLSearchParams(queryParams).toString() : "";
  const url = `${baseUrl}/gis/${layerName}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000), // 5-second timeout
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new GisServiceError(
        `FastAPI GIS returned HTTP ${response.status}: ${errText.slice(0, 100)}`,
        response.status >= 500 ? 502 : response.status,
        "GIS_UPSTREAM_ERROR"
      );
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof GisServiceError) throw error;
    if (error.name === "TimeoutError") {
      throw new GisServiceError("FastAPI GIS request timed out after 5000ms", 504, "GIS_GATEWAY_TIMEOUT");
    }
    throw new GisServiceError(
      "Unable to connect to FastAPI GIS service. Ensure service is operational on port 8000.",
      503,
      "GIS_SERVICE_UNAVAILABLE"
    );
  }
}

export async function executeSpatialQuery(payload: SpatialQueryInput) {
  const baseUrl = getGisBaseUrl();
  const url = `${baseUrl}/gis/spatial-query`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new GisServiceError(`FastAPI GIS query failed with HTTP ${response.status}`, 502);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof GisServiceError) throw error;
    throw new GisServiceError("FastAPI GIS spatial query failed", 503, "GIS_SERVICE_UNAVAILABLE");
  }
}

export async function executeValidateGeometry(payload: GeometryValidationInput) {
  const baseUrl = getGisBaseUrl();
  const url = `${baseUrl}/gis/validate-geometry`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new GisServiceError(`FastAPI GIS geometry validation failed with HTTP ${response.status}`, 502);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof GisServiceError) throw error;
    throw new GisServiceError("FastAPI GIS validate geometry failed", 503, "GIS_SERVICE_UNAVAILABLE");
  }
}
