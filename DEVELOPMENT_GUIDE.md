# Panduan Pengembangan (Development Guide)

Dokumen ini menjadi acuan alur kerja pengembangan GGR-ICMS berdasarkan `03-REPOSITORY-AND-ENGINEERING-STANDARDS.md` dan `09-GitHub-Workflow-Vercel-Deployment.md`.

## Prinsip Kerja

1. **Approval-Gated Execution:** Setiap tahap dikerjakan setelah mendapatkan persetujuan eksplisit dari pemilik proyek.
2. **Source of Truth:** Setiap domain data memiliki satu sumber utama (Firebase Auth untuk akun, Firestore untuk operasional, PostGIS untuk geometri, Google Drive untuk berkas).
3. **Backend as Authority:** Validasi payload, otorisasi role, kepemilikan objek, pembuatan ID, dan timestamp otoritatif wajib berjalan di sisi server.
4. **Synthetic Data Only:** Lingkungan lokal dan development dilarang menggunakan data warga asli (PII).

## Strategi Branch & Pull Request

- `main` — Branch produksi (terlindungi, hanya menerima merge teruji dan disetujui).
- `development` — Branch integrasi fitur.
- `feature/<slug>` — Pengembangan fitur baru.
- `fix/<slug>` — Perbaikan bug.
- `hotfix/<slug>` — Perbaikan mendesak produksi.

Setiap Pull Request wajib mencantumkan tujuan, ringkasan perubahan, dampak keamanan, strategi migrasi data (jika ada), dan hasil pengujian.

## Dependensi Antarmodul

- **Frontend (`app/`, `features/`, `components/`)** berkomunikasi hanya melalui `services/` ke API aplikasi (`/api/v1`) dan GIS API (`/v1`), bukan mengakses database secara langsung.
- **Backend (`server/`)** memverifikasi token Firebase Auth sebelum memanggil Firestore, Google Drive, atau mengaudit aktivitas.
- **Layanan GIS (`gis-service/`)** berjalan terpisah dari runtime Next.js, memverifikasi token Firebase secara independen, dan menjadi satu-satunya jalur akses ke PostGIS.
