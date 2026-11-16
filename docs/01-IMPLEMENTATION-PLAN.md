# 01. Implementation Plan

## 1. Prinsip pelaksanaan

Pembangunan dilakukan bertahap, berbasis risiko, dan mengutamakan integritas data. Data keuangan, data pribadi, dan akses dokumen menjadi area dengan kontrol tertinggi. GIS tidak boleh dipublikasikan sebelum sumber, ketelitian, CRS, dan klasifikasi layer diverifikasi.

## 2. Tahapan dan gerbang

| Tahap | Aktivitas | Keluaran | Gerbang |
|---|---|---|---|
| 0. Inisiasi | Penunjukan pemilik proses, inventaris data, keputusan kebijakan | Project charter, decision log | Sponsor menyetujui ruang lingkup |
| 1. Foundation | Repo, CI, dev/staging, Firebase, DB, secret | Lingkungan siap | Pipeline hijau dan akses terkendali |
| 2. Identity & master data | Login, profil, rumah tangga, rumah, RBAC | Modul identitas | Uji isolasi data lulus |
| 3. Administrasi | Permohonan, verifikasi, surat, arsip | Alur administrasi | UAT sekretaris/ketua |
| 4. Finance | Tagihan/iuran, penerimaan, pengeluaran, ledger, laporan | Modul keuangan | Rekonsiliasi dan reversal lulus |
| 5. Communication & complaint | Pengumuman, agenda, aspirasi, pengaduan | Modul komunikasi | UAT warga dan PIC |
| 6. Asset & security | Aset, inspeksi, kejadian, pemeliharaan | Modul operasional | Audit akses dan bukti |
| 7. GIS | Survey, PostGIS, API, peta web | GIS awal | GIS QA dan persetujuan publikasi |
| 8. Hardening | Performance, security, backup restore, accessibility | Release candidate | Semua blocker ditutup |
| 9. Go-live | Migrasi, pelatihan, cutover, monitoring | Produksi | Persetujuan go-live |
| 10. Operasi | Patch, audit, backup, evaluasi | Laporan operasi | Review periodik |

## 3. Urutan MVP yang disarankan

**MVP-1 (fondasi):** autentikasi, akun, rumah tangga, rumah, role, audit dasar, dashboard minimal.

**MVP-2 (layanan):** permohonan administrasi, status, persetujuan, dokumen, pengumuman, pengaduan.

**MVP-3 (keuangan):** pencatatan penerimaan/pengeluaran, bukti, ledger, rekonsiliasi, laporan terbatas.

**MVP-4 (lingkungan):** aset, kejadian keamanan, inspeksi, GIS dasar.

Jangan menunda desain keamanan, audit, dan backup sampai tahap akhir; ketiganya harus tersedia sejak fondasi.

## 4. Estimasi relatif

Estimasi kalender belum dapat dipastikan sebelum jumlah developer, ketersediaan pengurus, kualitas data awal, dan keputusan layanan ditetapkan. Untuk perencanaan awal, gunakan sprint dua minggu dan ukur kapasitas aktual pada sprint pertama. Setiap epic di backlog diestimasi ulang setelah discovery.

## 5. RACI minimum

| Aktivitas | Product Owner/pengurus | Developer lead | Domain owner | QA |
|---|---|---|---|---|
| Prioritas produk | A | C | C | I |
| Arsitektur teknis | C | A/R | C | I |
| Validasi data warga | A | C | R (sekretaris) | C |
| Validasi keuangan | A | C | R (bendahara) | C |
| Validasi GIS | A | C | R (koordinator GIS) | C |
| Release | A | R | C | R |
| UAT | A | C | R | R |

A = accountable; R = responsible; C = consulted; I = informed.

## 6. Kriteria keluar setiap tahap

- Artefak tahap tersedia dan ditinjau.
- Acceptance criteria lulus.
- Tidak ada temuan keamanan kritis/tinggi yang belum dimitigasi.
- Perubahan data dapat ditelusuri.
- Runbook dan pemilik operasi diperbarui.
