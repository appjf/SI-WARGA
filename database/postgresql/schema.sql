-- ==============================================================================
-- GGR-ICMS PostgreSQL & PostGIS Spatial Database Schema
-- Project: Green Garden Residence – Integrated Community Management System
-- Operational Area: RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, 
--                   Kecamatan Banyuresmi, Kabupaten Garut, Jawa Barat, Indonesia
-- SRS & SAD Baseline: PostGIS Spatial Architecture & Operational Entities
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS ggr_gis;

-- 1. Boundaries (Neighborhood, Block, and RT/RW boundaries)
CREATE TABLE IF NOT EXISTS ggr_gis.boundaries (
  boundary_id TEXT PRIMARY KEY,
  boundary_name TEXT NOT NULL,
  boundary_type TEXT NOT NULL, -- e.g., 'RT', 'RW', 'BLOCK'
  geom GEOMETRY(Polygon, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS boundaries_geom_gix ON ggr_gis.boundaries USING GIST (geom);

-- 2. Houses & Parcels (Persil & Rumah)
CREATE TABLE IF NOT EXISTS ggr_gis.houses (
  house_id TEXT PRIMARY KEY,
  house_code TEXT NOT NULL UNIQUE,
  block_name TEXT,
  address_label TEXT,
  geom GEOMETRY(Point, 4326),
  parcel_geom GEOMETRY(Polygon, 4326),
  position_source TEXT, -- e.g., 'GPS_SURVEY', 'SATELLITE_ESTIMATE'
  accuracy_m NUMERIC(8,2),
  surveyed_at TIMESTAMPTZ,
  surveyed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS houses_geom_gix ON ggr_gis.houses USING GIST (geom);
CREATE INDEX IF NOT EXISTS houses_parcel_geom_gix ON ggr_gis.houses USING GIST (parcel_geom);

-- 3. Roads (Jaringan Jalan)
CREATE TABLE IF NOT EXISTS ggr_gis.roads (
  road_id TEXT PRIMARY KEY,
  road_name TEXT,
  surface_type TEXT, -- e.g., 'PAVED', 'ASPHALT', 'PAVING_BLOCK'
  width_m NUMERIC(8,2),
  condition TEXT, -- e.g., 'GOOD', 'FAIR', 'POOR'
  geom GEOMETRY(MultiLineString, 4326) NOT NULL,
  surveyed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS roads_geom_gix ON ggr_gis.roads USING GIST (geom);

-- 4. Drainage (Saluran Air / Drainase)
CREATE TABLE IF NOT EXISTS ggr_gis.drainage (
  drainage_id TEXT PRIMARY KEY,
  drain_type TEXT, -- e.g., 'OPEN_CONCRETE', 'CLOSED_PIPE'
  material TEXT,
  width_m NUMERIC(8,2),
  depth_m NUMERIC(8,2),
  condition TEXT,
  geom GEOMETRY(MultiLineString, 4326) NOT NULL,
  surveyed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drainage_geom_gix ON ggr_gis.drainage USING GIST (geom);

-- 5. Facilities (Fasilitas Umum & Sosial)
CREATE TABLE IF NOT EXISTS ggr_gis.facilities (
  facility_id TEXT PRIMARY KEY,
  facility_name TEXT NOT NULL,
  facility_type TEXT, -- e.g., 'POS_RONDA', 'MASJID', 'TAMAN', 'LAPANGAN'
  condition TEXT,
  geom GEOMETRY(Point, 4326) NOT NULL,
  surveyed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS facilities_geom_gix ON ggr_gis.facilities USING GIST (geom);

-- 6. Complaints Spatial Mapping (Pengaduan Warga Berbasis Lokasi)
CREATE TABLE IF NOT EXISTS ggr_gis.complaints_spatial (
  complaint_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  geom GEOMETRY(Point, 4326) NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS complaints_spatial_geom_gix ON ggr_gis.complaints_spatial USING GIST (geom);

-- 7. Assets (Aset Prasarana Lingkungan)
CREATE TABLE IF NOT EXISTS ggr_gis.assets (
  asset_id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL, -- e.g., 'STREET_LIGHT', 'GARBAGE_BIN', 'CCTV'
  condition TEXT,
  status TEXT,
  geom GEOMETRY(Point, 4326) NOT NULL,
  last_inspection_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_geom_gix ON ggr_gis.assets USING GIST (geom);
