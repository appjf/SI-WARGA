# Application API Routes (`app/api/`)

Lapisan endpoint HTTP Next.js (`/api/v1/*`) yang bertindak sebagai *Backend for Frontend (BFF)*.

## Endpoint yang Direncanakan (Tahap 5)

- `/api/v1/health` — Pemeriksaan kesehatan layanan web.
- `/api/v1/me` — Profil dan peran akun terautentikasi.
- `/api/v1/households` — Pengelolaan rumah tangga dan unit rumah.
- `/api/v1/admin-requests` — Pengajuan, verifikasi, dan persetujuan surat/layanan administrasi.
- `/api/v1/transactions` — Pencatatan, posting, dan reversal transaksi keuangan.
- `/api/v1/complaints` — Pengaduan warga dan tindak lanjut PIC.
- `/api/v1/announcements` — Pengumuman berdasarkan target audiens.
- `/api/v1/documents` — Sesi unggah dan unduh terotorisasi ke Google Drive.

## Prinsip

Route handler harus tipis: menerima request, memanggil `server/` untuk autentikasi, otorisasi, validasi, dan business logic, lalu mengembalikan amplop respons standar (`data` / `error` + `meta.requestId`).
