# App Router (`app/`)

Direktori Next.js App Router untuk seluruh rute halaman web dan API BFF aplikasi.

## Rencana Struktur Route Groups (Tahap Implementasi)

- `(public)/` — Halaman informasi publik lingkungan dan pengumuman umum.
- `(auth)/` — Halaman login, aktivasi akun, dan pemulihan akses.
- `(resident)/` — Portal warga: beranda, profil & rumah tangga, permohonan administrasi, iuran, pengaduan, peta lingkungan, dan agenda.
- `(management)/` — Portal pengurus (Ketua RT, Sekretaris, Bendahara, Keamanan, Koordinator GIS, Auditor, Super Admin).
- `api/v1/` — Route Handlers Next.js (BFF) yang meneruskan operasi ke lapisan `server/`.

## Aturan

- File route hanya menangani routing, layout composition, dan pemanggilan modul fitur/server.
- Penentuan hak akses di antarmuka hanya untuk UX; otorisasi wajib ditegakkan pada `server/`.
