# Spatial Processing (`gis-service/spatial-processing/`)

Modul validasi dan pengolahan spasial:
- Validasi SRID (`EPSG:4326` input/output, `EPSG:32748` untuk kalkulasi jarak/luas metrik wilayah Garut).
- Pemeriksaan validitas geometri (`ST_IsValid`), koordinat di luar batas area kerja, serta pemeriksaan *gap/overlap* dan konektivitas jaringan jalan/drainase.
- Pembatasan ukuran respons, timeout query PostGIS, dan generalisasi geometri pada level zoom rendah.
