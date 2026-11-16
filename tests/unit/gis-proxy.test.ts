import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchGisLayer,
  executeSpatialQuery,
  executeValidateGeometry,
  GisServiceError,
} from "@/server/integrations/gis-client";

describe("Work Package F — GIS BFF Integration Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully fetches boundaries GeoJSON layer from FastAPI GIS", async () => {
    const mockGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          id: "B-RT06-RW01",
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: { boundary_name: "RT 06 RW 01" },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGeoJson,
    } as any);

    const result = await fetchGisLayer("boundaries");
    expect(result.type).toBe("FeatureCollection");
    expect(result.features[0].id).toBe("B-RT06-RW01");
  });

  it("handles upstream HTTP error gracefully with GisServiceError", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal PostGIS connection pool exhausted",
    } as any);

    await expect(fetchGisLayer("houses")).rejects.toThrow(GisServiceError);
  });

  it("handles network failure or connection refused gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("fetch failed: ECONNREFUSED 127.0.0.1:8000"));

    await expect(fetchGisLayer("roads")).rejects.toThrow(GisServiceError);
  });
});
