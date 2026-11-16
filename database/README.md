# Database Architecture & Artifacts (`database/`)

Direktori pengelolaan desain basis data operasional dan spasial untuk GGR-ICMS.

## Subdirektori

- `firestore/` — Desain koleksi, composite indexes, dan kebijakan Firestore Security Rules.
- `postgresql/` — Konfigurasi PostgreSQL, peran akses (read-only vs editor), TLS, dan backup.
- `postgis/` — Skema spasial `ggr_gis`, indeks GiST, validasi CRS/SRID, dan transformasi metrik.
- `schemas/` — Kamus data (*data dictionary*) dan pemetaan kunci penghubung lintas domain.
- `migrations/` — Skrip migrasi skema bernomor urut (hanya dibuat pada Tahap 4).
- `seeds/` — Data uji sintetis untuk lingkungan local/development/staging (tanpa PII).
