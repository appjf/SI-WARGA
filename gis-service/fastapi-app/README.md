# FastAPI GIS App (`gis-service/fastapi-app/`)

Direktori aplikasi layanan API GIS berbasis Python FastAPI (diimplementasikan pada Tahap 7).

## Endpoint yang Direncanakan

- `GET /v1/layers` — Daftar layer sesuai hak akses pengguna.
- `GET /v1/layers/{layer_id}/features` — Pengambilan fitur dalam `bbox` dengan pagination cursor.
- `GET /v1/features/{feature_id}` — Detail fitur berdasarkan izin layer.
- `POST /v1/features` & `PATCH /v1/features/{feature_id}` — Pembuatan/pembaruan fitur oleh Koordinator GIS dengan pencatatan audit.
- `POST /v1/analysis/nearest` & `POST /v1/analysis/summary` — Analisis kedekatan dan ringkasan spasial.
