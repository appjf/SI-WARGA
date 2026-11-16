# GGR-ICMS Project Roadmap

Dokumen ini merangkum tahapan pembangunan bertahap dengan sistem gerbang persetujuan (*approval-gated delivery*) sesuai Implementation Package v1.0.

## Tahapan Pembangunan

| Tahap | Pekerjaan | Status | Gerbang Persetujuan |
|---:|---|---|---|
| 0 | Analisis dokumen & perancangan struktur direktori | Disetujui | Persetujuan struktur & open items |
| 1 | Inisialisasi repository, aplikasi, & CI dasar | Disetujui | Pipeline dasar & struktur terverifikasi |
| 2 | Instalasi dependencies terkunci | Selesai (Diselaraskan) | Audit lisensi & kerentanan awal |
| 2b | Standarisasi runtime resmi Node.js 24 LTS (`>=24.12.0 <25.0.0`) | Menunggu persetujuan akhir *(CI Node 24: `NOT VERIFIED`)* | Konfigurasi sinkron; CI Node 24 menunggu koneksi remote GitHub |
| 3 | Setup Firebase (Auth, Firestore, Rules baseline) | Menunggu perintah | Project terpisah per environment & verifikasi CI Node 24 |
| 4 | Setup database (Firestore indexes & PostgreSQL/PostGIS) | Menunggu perintah | Skema & migrasi staging lulus |
| 5 | Pengembangan backend (BFF, RBAC, audit, business logic) | Menunggu perintah | Uji isolasi data & idempotency lulus |
| 6 | Pengembangan frontend (UI/UX warga & pengurus) | Menunggu perintah | Uji responsif & aksesibilitas lulus |
| 7 | Integrasi GIS (FastAPI, PostGIS, Leaflet/MapLibre, Leafmap) | Menunggu perintah | GIS QA & persetujuan layer publik |
| 8 | Integrasi Google Drive (upload/download aman & rekonsiliasi) | Menunggu perintah | Uji otorisasi dokumen privat lulus |
| 9 | Testing, security audit, backup/restore drill, & UAT | Menunggu perintah | Semua temuan kritis tertutup & UAT ditandatangani |
| 10 | Deployment production & serah terima operasional | Menunggu perintah | Go-live checklist terpenuhi |

## Urutan MVP yang Disarankan

1. **MVP-1 (Fondasi):** Autentikasi, aktivasi akun, rumah tangga, kode unit rumah, RBAC server-side, audit dasar, dashboard minimal.
2. **MVP-2 (Layanan Warga):** Permohonan administrasi, verifikasi berjenjang, penerbitan arsip surat, pengumuman, dan pengaduan.
3. **MVP-3 (Keuangan):** Pencatatan penerimaan/pengeluaran (integer IDR), bukti transaksi privat, ledger, idempotency, reversal, dan laporan terbatas.
4. **MVP-4 (Lingkungan & GIS):** Inventarisasi aset, pencatatan kejadian keamanan, inspeksi prasarana, dan peta lingkungan berbasis izin layer.
