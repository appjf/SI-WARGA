import type { GeoJsonFeature, SpatialLayerType } from "@/types";

export interface LayerVisualMeta {
  key: SpatialLayerType;
  label: string;
  shortLabel: string;
  stroke: string;
  fill: string;
  geometryHint: string;
}

export const SPATIAL_LAYERS: readonly LayerVisualMeta[] = [
  {
    key: "boundaries",
    label: "Batas Wilayah RT/RW",
    shortLabel: "Batas RT/RW",
    stroke: "#1F5E4A",
    fill: "rgba(31, 94, 74, 0.08)",
    geometryHint: "Polygon",
  },
  {
    key: "houses",
    label: "Peta Rumah & Persil",
    shortLabel: "Rumah & Persil",
    stroke: "#2C7A5B",
    fill: "rgba(44, 122, 91, 0.18)",
    geometryHint: "Polygon / Point",
  },
  {
    key: "roads",
    label: "Jaringan Jalan",
    shortLabel: "Jalan",
    stroke: "#475467",
    fill: "none",
    geometryHint: "LineString",
  },
  {
    key: "drainage",
    label: "Saluran & Drainase",
    shortLabel: "Drainase",
    stroke: "#0E7490",
    fill: "none",
    geometryHint: "LineString",
  },
  {
    key: "facilities",
    label: "Fasilitas Umum",
    shortLabel: "Fasum",
    stroke: "#D9A441",
    fill: "rgba(217, 164, 65, 0.25)",
    geometryHint: "Polygon / Point",
  },
  {
    key: "assets",
    label: "Aset Lingkungan",
    shortLabel: "Aset RT",
    stroke: "#217A45",
    fill: "#217A45",
    geometryHint: "Point",
  },
] as const;

export const RT06_DEFAULT_CENTER: [number, number] = [107.9022, -7.2165];

/**
 * Spatial baseline features for Perum Green Garden Residence RT 06 RW 01,
 * Desa Cipicung, Kec. Banyuresmi, Kab. Garut (EPSG:4326).
 * Rendered when FastAPI GIS service is offline or merged with live GIS BFF layers.
 */
export const RT06_BASELINE_FEATURES: Record<SpatialLayerType, GeoJsonFeature[]> = {
  boundaries: [
    {
      id: "BND-RT06-RW01",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.901, -7.2175],
            [107.9034, -7.2175],
            [107.9034, -7.2155],
            [107.901, -7.2155],
            [107.901, -7.2175],
          ],
        ],
      },
      properties: {
        name: "Batas Wilayah RT 06 RW 01 Green Garden Residence",
        code: "RT06-RW01-CIPICUNG",
        area_m2: 52800,
        source: "baseline",
      },
    },
  ],
  houses: [
    {
      id: "PARCEL-A1",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.9013, -7.2162],
            [107.9016, -7.2162],
            [107.9016, -7.2159],
            [107.9013, -7.2159],
            [107.9013, -7.2162],
          ],
        ],
      },
      properties: { name: "Persil Blok A-01", block: "Blok A", status: "Terisi", source: "baseline" },
    },
    {
      id: "PARCEL-A2",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.9017, -7.2162],
            [107.902, -7.2162],
            [107.902, -7.2159],
            [107.9017, -7.2159],
            [107.9017, -7.2162],
          ],
        ],
      },
      properties: { name: "Persil Blok A-02", block: "Blok A", status: "Terisi", source: "baseline" },
    },
    {
      id: "PARCEL-B1",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.9024, -7.2162],
            [107.9027, -7.2162],
            [107.9027, -7.2159],
            [107.9024, -7.2159],
            [107.9024, -7.2162],
          ],
        ],
      },
      properties: { name: "Persil Blok B-01", block: "Blok B", status: "Terisi", source: "baseline" },
    },
    {
      id: "PARCEL-C1",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.9013, -7.2171],
            [107.9016, -7.2171],
            [107.9016, -7.2168],
            [107.9013, -7.2168],
            [107.9013, -7.2171],
          ],
        ],
      },
      properties: { name: "Persil Blok C-01", block: "Blok C", status: "Terisi", source: "baseline" },
    },
  ],
  roads: [
    {
      id: "ROAD-UTAMA",
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [107.9011, -7.2165],
          [107.9033, -7.2165],
        ],
      },
      properties: { name: "Jl. Utama Green Garden", width_m: 6, surface: "Paving Blok", source: "baseline" },
    },
    {
      id: "ROAD-MELATI",
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [107.9022, -7.2174],
          [107.9022, -7.2156],
        ],
      },
      properties: { name: "Jl. Poros Tengah RT 06", width_m: 5, surface: "Aspal", source: "baseline" },
    },
  ],
  drainage: [
    {
      id: "DRN-UTARA",
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [107.9012, -7.2164],
          [107.9032, -7.2164],
        ],
      },
      properties: { name: "Saluran Drainase Utara", condition: "Baik", material: "U-Ditch Beton", source: "baseline" },
    },
    {
      id: "DRN-SELATAN",
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [107.9012, -7.2166],
          [107.9032, -7.2166],
        ],
      },
      properties: { name: "Saluran Drainase Selatan", condition: "Perlu Pembersihan", material: "Pasangan Batu", source: "baseline" },
    },
  ],
  facilities: [
    {
      id: "FAC-BALAI-RT06",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.9025, -7.2171],
            [107.9029, -7.2171],
            [107.9029, -7.2168],
            [107.9025, -7.2168],
            [107.9025, -7.2171],
          ],
        ],
      },
      properties: { name: "Balai Warga & Posko RT 06", category: "Balai Warga", source: "baseline" },
    },
    {
      id: "FAC-TAMAN-RT06",
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [107.9019, -7.217],
      },
      properties: { name: "Taman Terbuka Hijau RT 06", category: "Ruang Terbuka Hijau", source: "baseline" },
    },
  ],
  assets: [
    {
      id: "AST-POS-01",
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [107.9012, -7.2165],
      },
      properties: { name: "Pos Kamling Gerbang Utama", category: "Keamanan", source: "baseline" },
    },
    {
      id: "AST-PJU-04",
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [107.9028, -7.2165],
      },
      properties: { name: "Tiang PJU Tenaga Surya #04", category: "Penerangan Jalan", source: "baseline" },
    },
  ],
};
