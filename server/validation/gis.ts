import { z } from "zod";

export const spatialQuerySchema = z.object({
  layer_type: z.enum(["boundaries", "houses", "facilities", "roads", "drainage", "assets"]),
  coordinates: z.array(z.number()).length(2).describe("[longitude, latitude]"),
  buffer_meters: z.number().positive().max(1000).default(50),
});

export const geometryValidationSchema = z.object({
  geometry: z.record(z.string(), z.any()),
  expected_srid: z.number().int().default(4326),
});

export type SpatialQueryInput = z.infer<typeof spatialQuerySchema>;
export type GeometryValidationInput = z.infer<typeof geometryValidationSchema>;
