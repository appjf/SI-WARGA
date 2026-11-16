# Backend Services (`server/`)

Lapisan layanan backend server-side untuk GGR-ICMS (hanya berjalan di server, tidak pernah di-bundle ke browser).

## Subdirektori

- `auth/` — Verifikasi Firebase ID token (signature, issuer, audience, expiry) dan status akun aktif.
- `authorization/` — Pemeriksaan RBAC dan *object-level ownership* (deny-by-default).
- `business-logic/` — Aturan domain, state machine permohonan/pengaduan, ledger keuangan, dan idempotency.
- `data-access/` — Repository Firestore dan operasi transaksi atomik/batch.
- `validation/` — Validasi payload dan allowlist field yang dapat diubah.
- `logging/` — Structured logging dengan `requestId`, PII masking, dan penulisan `auditLogs`.
