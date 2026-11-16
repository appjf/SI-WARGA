# Server Business Logic (`server/business-logic/`)

Implementasi aturan bisnis inti per domain GGR-ICMS.

## Cakupan

- **Administrasi:** Validasi transisi status (`draft -> submitted -> under_review -> approved/rejected -> issued/closed`) dan penomoran permohonan server-side.
- **Keuangan:** Penegakan integer IDR positif, idempotency key, immutability transaksi `posted`, dan mekanisme `reversal`.
- **Pengaduan:** Tiket bernomor server-side, transisi status, dan penugasan PIC.
- **Dokumen & Rekonsiliasi:** Penjaminan konsistensi status metadata dokumen (`pending -> available/failed`) dengan Google Drive.
