# Deployment Documentation (`devops/deployment/`)

Panduan arsitektur deployment terpisah:
- **Next.js Web + BFF:** Vercel (branch `main` untuk produksi, preview deployment untuk PR dengan proteksi akses; target runtime Node.js 24 LTS via `package.json` `engines.node`).
- **GIS Service (FastAPI):** Platform container yang mendukung dependensi geospasial (GDAL/PROJ) dan koneksi privat TLS ke PostgreSQL + PostGIS.
- **Prosedur Cutover & Rollback:** Checklist rilis, migrasi berurutan, dan rollback teruji.
- **Standarisasi Runtime Node.js 24 LTS:** Lihat [RUNTIME-CONFIGURATION-AND-COMPATIBILITY.md](./RUNTIME-CONFIGURATION-AND-COMPATIBILITY.md) untuk matriks kompatibilitas paket, laporan lingkungan, konfigurasi GitHub Actions (`node-version: "24"`), dan konfigurasi target Vercel.
