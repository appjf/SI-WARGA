# Green Garden Residence – Integrated Community Management System (GGR-ICMS)

Sistem Informasi Pengelolaan Lingkungan Perumahan untuk wilayah **RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut**.

## Status Proyek

- **Tahap Aktif:** Node.js Runtime Standardization — Waiting for Final Approval *(Laporan Verifikasi: [NODE24-RUNTIME-VERIFICATION-REPORT.md](./docs/reports/NODE24-RUNTIME-VERIFICATION-REPORT.md))*
- **Target Runtime Resmi:** Node.js 24 LTS (`>=24.12.0 <25.0.0`, `.nvmrc`: `24.15.0`) untuk GitHub Actions CI, Vercel, dan lingkungan development eksternal (lihat [ADR-004](./docs/architecture/ADR-004-nodejs-runtime-standardization.md))
- **Baseline Acuan:** GGR-ICMS Implementation Package v1.0
- **Status Implementasi & Verifikasi:** Konfigurasi runtime Node.js 24 LTS (`engines.node`, `.nvmrc`, `@types/node@^24`, `package-lock.json`, dan `.github/workflows/web-ci.yml`) sinkron pada commit `c435698`. Eksekusi GitHub Actions CI pada runner Node.js 24 berstatus `NOT VERIFIED` karena remote repository GitHub dan akses CLI belum tersedia di workspace. Integrasi aktif Firebase, database, GIS, dan fitur bisnis belum dimulai.

## Arsitektur Inti (Baseline)

| Domain | Teknologi | Peran |
|---|---|---|
| Frontend Web | Next.js + TypeScript + React | Antarmuka warga, pengurus, dan BFF |
| Autentikasi | Firebase Authentication | Identitas dan penerbitan ID token |
| Database Operasional | Cloud Firestore | Profil warga, rumah tangga, layanan, transaksi, pengaduan, audit |
| Database Spasial | PostgreSQL + PostGIS | Penyimpanan geometri dan indeks spasial |
| Layanan GIS | Python + FastAPI + GeoPandas + Leafmap | API spasial dan analisis geospasial |
| Peta Interaktif Browser | Leaflet / MapLibre | Visualisasi layer peta web |
| Manajemen Dokumen | Google Drive API | Penyimpanan berkas privat (akses dimediasi backend) |
| CI/CD & Hosting | GitHub Actions, Vercel, Hosting GIS | Otomatisasi verifikasi dan deployment |

## Navigasi Direktori Utama

- `app/` — Next.js App Router (halaman publik, warga, pengurus, dan API BFF)
- `components/`, `layouts/`, `features/`, `hooks/`, `services/`, `types/`, `lib/`, `styles/` — Lapisan antarmuka, utilitas bersama, dan modul fitur frontend
- `public/assets/` — Aset statis publik dan arsip dokumen referensi (`public/assets/aistudio/`)
- `server/` — Lapisan layanan backend (autentikasi, otorisasi, business logic, data access, validasi, logging)
- `database/` — Dokumentasi skema Firestore, PostgreSQL/PostGIS, migrasi, dan seed data sintetis
- `gis-service/` — Layanan FastAPI GIS, pemrosesan spasial, GeoPandas, Leafmap, dan dokumentasi GIS
- `integrations/` — Spesifikasi integrasi Firebase, Google Drive, dan layanan eksternal
- `devops/` & `.github/workflows/` — Pipeline CI/CD, panduan deployment, template environment, dan monitoring
- `tests/` — Strategi dan skenario pengujian (unit, integration, E2E, security, GIS QA, UAT)
- `docs/` — Pusat dokumentasi teknis, ADR, kebutuhan, keamanan, operasi, dan panduan pengguna

## Dokumen Root

- [ROADMAP.md](./ROADMAP.md) — Tahapan pembangunan (Tahap 0–10) dan urutan MVP
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) — Panduan pengembangan dan alur kerja tim
- [ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md) — Standar penamaan, kualitas kode, dan keamanan
- [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md) — Tata kelola environment dan secret
- [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) — Standar pesan commit dan strategi branch Git
