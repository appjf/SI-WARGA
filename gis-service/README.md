# GIS Service (`gis-service/`)

Layanan geospasial terpisah (Python + FastAPI + PostGIS) untuk inventarisasi aset lingkungan, pemrosesan spasial, dan penyajian GeoJSON terotorisasi.

## Subdirektori

- `fastapi-app/` — Layanan API HTTP FastAPI (`/v1/layers`, `/v1/features`, `/v1/analysis/*`) dengan verifikasi token Firebase.
- `spatial-processing/` — Validasi geometri (`ST_IsValid`), pengecekan CRS/SRID, query *bounding box*, dan pemeriksaan topologi.
- `geopandas/` — Pipeline pemrosesan data vektor dengan GeoPandas & Shapely.
- `leafmap/` — Modul eksplorasi interaktif, peta tematik, dan generasi laporan spasial berbasis Python.
- `map-visualization/` — Kontrak layer, legenda, dan styling untuk peta browser (Leaflet / MapLibre).
- `spatial-data/` — Direktori dataset spasial tervalidasi (GeoJSON / GeoPackage) & data survei lapangan sintetis.
- `docs/` — Dokumentasi teknis GIS, SOP survei lapangan, dan GIS QA checklist.

## Catatan Arsitektur

- Leafmap berjalan di ekosistem Python untuk analisis/pelaporan, sedangkan peta browser di Next.js menggunakan Leaflet atau MapLibre.
- Layer publik dilarang memuat data pribadi (PII) atau detail keamanan sensitif.
