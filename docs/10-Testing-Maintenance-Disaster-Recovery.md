# 10. TESTING, MAINTENANCE, DAN DISASTER RECOVERY
## Green Garden Residence – Integrated Community Management System

## 1. Tujuan

Dokumen ini menetapkan strategi pengujian, pemeliharaan, backup, pemulihan bencana, dan respons insiden. Fokusnya adalah menjaga integritas data warga, transaksi, dokumen, dan informasi spasial.

## 2. Strategi Pengujian

| Jenis | Cakupan | Bukti |
|---|---|---|
| Unit | Fungsi dan aturan bisnis | Laporan test |
| Component | Komponen UI | Test report |
| Integration | Firebase, Drive, GIS API | Log integrasi |
| E2E | Alur warga/pengurus | Skenario dan hasil |
| Security | Auth, RBAC, akses objek | Laporan temuan |
| GIS QA | CRS, geometri, atribut, topologi | Laporan validasi |
| Performance | API, peta, dashboard | Hasil load test |
| Backup/restore | Pemulihan layanan | Berita acara restore |
| UAT | Kesesuaian kebutuhan | Persetujuan pengguna |

## 3. Skenario Uji Kritis

1. Warga A tidak dapat melihat profil Warga B.
2. Warga tidak dapat membuat atau mengubah transaksi.
3. Pengguna tanpa izin tidak dapat mengunduh dokumen Drive.
4. Token invalid/kedaluwarsa ditolak.
5. Akun nonaktif tidak dapat melakukan operasi privat.
6. Request transaksi berulang tidak membuat transaksi ganda.
7. Transaksi posted hanya dikoreksi melalui reversal.
8. Layer GIS publik tidak memuat PII.
9. Geometri dengan CRS tidak sesuai ditolak atau ditransformasikan secara eksplisit.
10. Data yang dipulihkan sesuai titik backup.
11. Perubahan versi tidak merusak data lama.
12. Akses ekspor dicatat.

## 4. Pengujian GIS

- Validasi geometri kosong dan invalid.
- Validasi SRID.
- Pemeriksaan koordinat di luar area.
- Duplikasi ID.
- Kelengkapan metadata survei.
- Kesesuaian tipe geometri.
- Pemeriksaan gap/overlap bila relevan.
- Uji query bbox dan pagination.
- Perbandingan hasil analisis terhadap sampel yang diperiksa manual.

## 5. User Acceptance Testing

UAT dilakukan oleh perwakilan warga dan pengurus menggunakan data uji yang telah disetujui. Setiap skenario mencatat:
- ID test;
- peran penguji;
- prasyarat;
- langkah;
- hasil yang diharapkan;
- hasil aktual;
- status pass/fail;
- bukti;
- catatan dan persetujuan.

Temuan kritis harus diselesaikan sebelum produksi.

## 6. Pemeliharaan Rutin

| Frekuensi | Kegiatan |
|---|---|
| Harian | Pantau error, kegagalan API, dan aktivitas mencurigakan |
| Mingguan | Periksa tiket tertunda, Drive sync, dan kapasitas |
| Bulanan | Review akun/peran, transaksi, audit, backup, penggunaan |
| Triwulanan | Uji restore, review keamanan, kualitas GIS, kebutuhan warga |
| Tahunan | Evaluasi arsitektur, biaya, retensi, kebijakan, roadmap |

## 7. Backup

### 7.1 Firestore
- Tentukan mekanisme backup/export sesuai kemampuan layanan.
- Jadwalkan backup dan pantau keberhasilannya.
- Simpan salinan terpisah dengan akses terbatas.
- Uji pemulihan ke lingkungan nonproduksi.
- Dokumentasikan indeks, konfigurasi, dan dependensi.

### 7.2 PostGIS
- Gunakan `pg_dump` dan/atau backup fisik/PITR sesuai hosting.
- Simpan salinan terenkripsi di lokasi terpisah.
- Uji restore, ekstensi, role, permission, dan indeks.
- Catat versi PostgreSQL/PostGIS.

### 7.3 Google Drive
- Tetapkan retensi dan versioning.
- Pertimbangkan salinan arsip untuk dokumen kritis.
- Uji pemulihan file dan izin.
- Jangan menganggap sinkronisasi sebagai backup.

### 7.4 Kode dan Konfigurasi
- Kode berada di GitHub.
- Simpan konfigurasi deployment dan dokumentasi.
- Secret dipulihkan melalui secret manager, bukan file repository.
- Dokumentasikan domain, DNS, Firebase project, dan integrasi.

## 8. RPO dan RTO

Target awal untuk disepakati:

| Sistem | RPO awal | RTO awal |
|---|---:|---:|
| Firestore | 24 jam | 8 jam |
| PostGIS | 24 jam | 8 jam |
| Dokumen Drive | 24 jam atau sesuai kemampuan backup/versioning | 12 jam |
| Aplikasi web | Kode tersedia di GitHub; konfigurasi dipulihkan terpisah | 4 jam |

RPO adalah batas kehilangan data yang dapat diterima. RTO adalah target waktu pemulihan. Target bukan jaminan penyedia dan harus dibuktikan melalui latihan restore.

## 9. Disaster Recovery Runbook

1. Deteksi dan klasifikasikan gangguan.
2. Tunjuk incident lead.
3. Catat waktu, dampak, dan sistem yang terdampak.
4. Isolasi komponen bila ada risiko keamanan.
5. Amankan log dan bukti.
6. Pilih titik pemulihan sesuai RPO.
7. Pulihkan pada lingkungan yang aman.
8. Verifikasi integritas data dan konfigurasi.
9. Jalankan smoke test fungsi kritis.
10. Minta persetujuan pemilik proses.
11. Alihkan trafik/layanan.
12. Informasikan status kepada warga sesuai kebutuhan.
13. Dokumentasikan akar masalah dan tindakan pencegahan.

## 10. Respons Insiden Keamanan

- Nonaktifkan akun/token yang disalahgunakan.
- Rotasi secret terdampak.
- Periksa audit dan cakupan akses.
- Identifikasi jenis data dan subjek terdampak.
- Simpan bukti.
- Pulihkan layanan setelah celah dikendalikan.
- Lakukan komunikasi/pemberitahuan sesuai kewajiban hukum.
- Dokumentasikan tindakan korektif dan pencegahan.

## 11. Monitoring

Pantau:
- availability aplikasi dan GIS API;
- error rate dan latency;
- kegagalan autentikasi;
- kegagalan upload/download Drive;
- kapasitas database;
- backup success/failure;
- aktivitas administratif dan finansial kritis;
- anomali akses.

Alert harus mempunyai penerima, tingkat urgensi, dan prosedur tindak lanjut. Hindari alert berlebihan yang tidak ditindaklanjuti.

## 12. Manajemen Perubahan

- Perubahan kebutuhan dicatat.
- Perubahan skema disertai migration plan.
- Backup dilakukan sebelum perubahan berisiko.
- Uji regresi dijalankan.
- Perubahan produksi melalui persetujuan.
- Dokumentasi dan runbook diperbarui.
- Perubahan darurat ditinjau setelah stabil.

## 13. Kriteria Kesiapan Produksi

- Semua alur kritis lulus UAT.
- Temuan keamanan kritis ditutup.
- Backup berjalan dan restore pernah diuji.
- RPO/RTO disetujui.
- Runbook tersedia.
- Pemilik proses dan eskalasi ditetapkan.
- Monitoring aktif.
- Kebijakan privasi, akses, dan retensi disahkan.
