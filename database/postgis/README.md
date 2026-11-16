# PostGIS Spatial Schema (`database/postgis/`)

Dokumentasi skema spasial `ggr_gis` sebagai *source of truth* geometri lingkungan Green Garden Residence.

## Entitas Spasial Inti

- Tabel utama: `houses`, `roads`, `drainage`, `facilities`, `asset_features`.
- Tabel pendukung: `boundaries`, `streetlights`, `waste_points`, `assets`, `inspections`, `incidents`, `survey_sessions`, `attachments`.
- Standar CRS: `EPSG:4326` untuk penyimpanan/pertukaran geografis dan `EPSG:32748` (UTM Zone 48S) untuk kalkulasi luas/jarak metrik di wilayah Garut.
