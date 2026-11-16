# Testing & Quality Assurance (`tests/`)

Strategi dan artefak pengujian GGR-ICMS berdasarkan `10-Testing-Maintenance-Disaster-Recovery.md` dan `12-TEST-PLAN-AND-UAT.md`.

## Subdirektori

- `unit/` — Pengujian fungsi, aturan bisnis, validasi input, dan kalkulasi keuangan integer.
- `integration/` — Pengujian integrasi Firebase Auth/Firestore, Google Drive, dan GIS FastAPI + PostGIS.
- `e2e/` — Pengujian alur kritis warga dan pengurus end-to-end.
- `security/` — Pengujian RBAC, object-level authorization (`T-001` s.d. `T-012`), idempotency, dan deteksi PII/secret.
- `gis/` — GIS QA (validitas geometri, SRID/CRS, bounding box, atribut publik bebas PII).
- `uat/` — Template, skenario, dan berita acara User Acceptance Testing per pemilik proses.
- `fixtures/` — Data uji sintetis tanpa data pribadi (PII) warga nyata.
