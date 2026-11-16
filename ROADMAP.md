# GGR-ICMS Project Roadmap

Dokumen ini merangkum tahapan pembangunan bertahap dengan sistem gerbang persetujuan (*approval-gated delivery*) sesuai Implementation Package v1.0.

## Tahapan Pembangunan

| Tahap | Pekerjaan | Status | Gerbang Persetujuan |
|---:|---|---|---|
| 0 | Analisis dokumen & perancangan struktur direktori | Disetujui | Persetujuan struktur & open items |
| 1 | Inisialisasi repository, aplikasi, & CI dasar | Disetujui | Pipeline dasar & struktur terverifikasi |
| 2 | Instalasi dependencies terkunci | Selesai (Diselaraskan) | Audit lisensi & kerentanan awal |
| 2b | Standarisasi runtime resmi Node.js 24 LTS (`>=24.12.0 <25.0.0`) | Ditutup dengan catatan (`ACCEPTED WITH DOCUMENTED LIMITATION`) | Konfigurasi sinkron; CI Node 24: `NOT VERIFIED` (menunggu remote GitHub) |
| 3 | Setup Firebase (Auth, Firestore, Rules baseline) | Selesai (`COMPLETED / VERIFIED`) | Firebase client/admin SDK, RBAC matrix, Firestore rules & unit tests lulus |
| 4 | Setup database (PostgreSQL, PostGIS & FastAPI GIS Service) | Selesai (`COMPLETED / VERIFIED`) | PostGIS schema, spatial indexing, FastAPI service & docs lulus |
| 5 | Pengembangan backend (BFF, RBAC, audit, business logic) | Selesai (`COMPLETED / VERIFIED`) | Rute API Phase 5 & ekstensi BFF Phase 6 terverifikasi |
| 6 | Pengembangan frontend (UI/UX warga & pengurus) | Selesai (`COMPLETED / VERIFIED`) | Seluruh WP-6A–WP-6J terintegrasi ke BFF, typecheck/lint/test/build lulus |
| 7 | Integrasi GIS lanjutan (PostGIS live cluster, Leafmap & sinkronisasi multi-wilayah) | Siap dilanjutkan | UI & GIS BFF Phase 6 siap; tinggal menghubungkan instance PostGIS produksi |
| 8 | Integrasi Google Drive (upload/download aman & rekonsiliasi) | Menunggu perintah | Uji otorisasi dokumen privat lulus |
| 9 | Testing, security audit, backup/restore drill, & UAT | Menunggu perintah | Semua temuan kritis tertutup & UAT ditandatangani |
| 10 | Deployment production & serah terima operasional | Menunggu perintah | Go-live checklist terpenuhi |

## Urutan MVP yang Disarankan

1. **MVP-1 (Fondasi):** Autentikasi, aktivasi akun, rumah tangga, kode unit rumah, RBAC server-side, audit dasar, dashboard minimal.
2. **MVP-2 (Layanan Warga):** Permohonan administrasi, verifikasi berjenjang, penerbitan arsip surat, pengumuman, dan pengaduan.
3. **MVP-3 (Keuangan):** Pencatatan penerimaan/pengeluaran (integer IDR), bukti transaksi privat, ledger, idempotency, reversal, dan laporan terbatas.
4. **MVP-4 (Lingkungan & GIS):** Inventarisasi aset, pencatatan kejadian keamanan, inspeksi prasarana, dan peta lingkungan berbasis izin layer.
