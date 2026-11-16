# 08. GIS Service Starter — FastAPI dan PostGIS

## 1. Struktur

```text
services/gis-api/
├── app/
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── routers/features.py
│   └── schemas.py
├── tests/
├── requirements.txt
└── Dockerfile
```

## 2. Dependensi awal

```text
fastapi
uvicorn[standard]
sqlalchemy
psycopg[binary]
geoalchemy2
firebase-admin
pydantic
```

Kunci versi dependency melalui lockfile dan lakukan vulnerability scan.

## 3. Endpoint GeoJSON konseptual

```python
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

app = FastAPI(title="GGR GIS API", version="1.0.0")

def verified_principal():
    # TODO: verify Firebase ID token using Firebase Admin SDK.
    # Return uid, active status and trusted roles.
    raise HTTPException(status_code=401, detail="Authentication required")

@app.get("/v1/features")
def list_features(
    bbox: str | None = Query(default=None),
    layer: str = Query(min_length=1, max_length=80),
    principal=Depends(verified_principal),
):
    # TODO:
    # 1. validate bbox order/range and layer allowlist
    # 2. apply role and feature visibility policy
    # 3. query PostGIS with parameterized SQL and ST_Intersects
    # 4. return only allowlisted properties
    # 5. enforce limit, pagination and rate limit
    return JSONResponse({
        "type": "FeatureCollection",
        "features": [],
        "meta": {"layer": layer, "count": 0}
    })
```

Kode di atas sengaja belum mengakses database dan belum dapat dianggap production-ready.

## 4. Kontrol GIS

- Tetapkan CRS sumber setiap survei; simpan SRID secara eksplisit.
- Validasi geometri (`ST_IsValid`) dan rentang koordinat.
- Gunakan parameterized query, connection pool, statement timeout.
- Batasi bbox, jumlah fitur, atribut, dan ukuran respons.
- Pisahkan layer publik, internal, dan restricted.
- Jangan publikasikan nama penghuni, nomor telepon, identitas, atau informasi keamanan.
- Simpan metadata sumber, metode akuisisi, tanggal survei, akurasi, pemeriksa, dan status verifikasi.
- Leafmap digunakan untuk analisis/eksplorasi; peta web memakai Leaflet/MapLibre sesuai keputusan UI.
- Peta bukan dasar penetapan batas kadaster atau pengukuran legal tanpa survei dan otoritas yang sesuai.

## 5. GIS quality assurance

Checklist minimum: CRS, SRID, validitas geometri, duplikasi ID, geometri di luar area, kelengkapan atribut, topologi bila relevan, sumber data, akurasi, dan persetujuan publikasi.
