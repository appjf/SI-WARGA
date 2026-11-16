# Utilities (`lib/`)

Fungsi utilitas lintas aplikasi yang tidak terikat pada satu fitur tertentu.

## Rencana Sub-modul (Tahap Implementasi)

- `utils.ts` — Helper umum (bawaan workspace).
- `firebase/` — Inisialisasi Firebase Client SDK (hanya konfigurasi publik) dan konfigurasi Firebase Admin SDK (server-only).
- `validation/` — Skema validasi input bersama dan helper sanitasi.
- `formatting/` — Format mata uang IDR (`integer`) dan konversi tampilan waktu UTC ke `Asia/Jakarta`.
- `idempotency/` — Generator `Idempotency-Key` dan `X-Request-Id` di sisi klien.
