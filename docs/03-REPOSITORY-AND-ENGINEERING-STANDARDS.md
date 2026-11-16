# 03. Repository dan Engineering Standards

## 1. Struktur repository

```text
green-garden-icms/
├── apps/
│   └── web/                    # Next.js + TypeScript
├── services/
│   └── gis-api/                # FastAPI + PostGIS
├── packages/
│   └── contracts/              # schema/kontrak bersama bila diperlukan
├── database/
│   ├── firestore/
│   └── postgis/
│       └── migrations/
├── infra/
│   ├── github/
│   └── deployment/
├── docs/
├── tests/
│   ├── e2e/
│   ├── security/
│   └── fixtures/
├── .env.example
├── .gitignore
└── README.md
```

## 2. Teknologi dan versi

Gunakan versi stabil yang masih didukung pada saat proyek dimulai. Kunci versi dependency melalui lockfile. Catat versi Node.js, Python, PostgreSQL, PostGIS, Firebase SDK, dan framework dalam `docs/adr/`.

## 3. Standar kode

- TypeScript strict mode; hindari `any` tanpa alasan terdokumentasi.
- Validasi payload pada batas sistem menggunakan schema validator.
- Backend menjadi otoritas untuk identitas, role, ownership, dan aturan bisnis.
- Semua operasi tulis penting memiliki actor, timestamp, request ID, dan audit event.
- Gunakan pagination cursor untuk koleksi besar.
- Uang menggunakan integer rupiah, bukan floating point.
- Timestamp disimpan UTC dan ditampilkan `Asia/Jakarta`.
- Geometri menyertakan SRID; jangan mengasumsikan CRS dari angka koordinat.
- Error tidak mengembalikan stack trace, token, secret, atau data pribadi.

## 4. Branch dan pull request

- `main`: produksi; protected.
- `development`: integrasi.
- `feature/<slug>`, `fix/<slug>`, `hotfix/<slug>`.
- PR wajib review minimal satu reviewer selain penulis.
- Wajib lint, typecheck, test, build, dependency/security scan yang disepakati.
- PR database wajib menyertakan migration dan strategi kompatibilitas.
- Screenshot UI harus menggunakan data sintetis.

## 5. Commit convention

Contoh: `feat(residents): add household member flow`, `fix(finance): enforce idempotency`, `docs(gis): clarify SRID policy`.

## 6. Pengelolaan perubahan

Perubahan arsitektur signifikan dicatat sebagai Architecture Decision Record (ADR): konteks, opsi, keputusan, konsekuensi, tanggal, dan approver. Perubahan skema harus backward-compatible selama masa deployment bertahap.
