# Frontend Services (`services/`)

Lapisan komunikasi HTTP dari browser menuju API aplikasi (`/api/v1`) dan GIS API (`/v1`).

## Tanggung Jawab

- Menyisipkan Firebase ID Token pada header `Authorization: Bearer <token>`.
- Mengirim header korelasi `X-Request-Id` dan `Idempotency-Key` pada operasi tulis kritis.
- Menangani amplop respons error secara aman tanpa mengekspos detail teknis kepada pengguna.
- Menyediakan adapter per domain (`residents`, `administration`, `finance`, `complaints`, `documents`, `gis`).
