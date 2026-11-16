# Architecture Documentation (`docs/architecture/`)

Menyimpan System Architecture Document (SAD), diagram konteks/C4, serta catatan Architecture Decision Records (ADR) untuk setiap keputusan teknis signifikan (Firestore vs PostGIS, Leaflet/MapLibre vs Leafmap, Drive backend-mediated, pemisahan FastAPI).

## Daftar Architecture Decision Records (ADR)

- [ADR-001](./ADR-001-phase1-stack-and-repo-structure.md) — Standarisasi Stack Awal & Struktur Direktori Repository (Phase 1)
- [ADR-002](./ADR-002-phase2-package-manager-and-dependencies.md) — Standarisasi Package Manager (`npm`), ESLint 9 Flat Config, dan Evaluasi Dependency (Phase 2)
- [ADR-003](./ADR-003-community-identity-rw01.md) — Penetapan Perubahan Identitas Wilayah Resmi (`RW 06 → RW 01`)
- [ADR-004](./ADR-004-nodejs-runtime-standardization.md) — Standarisasi Runtime Resmi Node.js 24 LTS (`>=24.12.0 <25.0.0`)
