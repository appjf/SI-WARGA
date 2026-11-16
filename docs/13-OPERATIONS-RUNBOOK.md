# 13. Operations Runbook

## 1. Rutinitas operasi

**Harian:** periksa health check, error rate, job gagal, kapasitas, alert keamanan, dan status integrasi Drive.

**Mingguan:** tinjau akun pending/nonaktif, anomali transaksi, antrean gagal, kapasitas database, dan hasil backup.

**Bulanan:** review akses dan role, patch dependency, uji sampel restore, review biaya, serta laporan insiden.

**Triwulanan/berdasarkan risiko:** restore drill penuh, review retensi, audit akses, dan evaluasi RPO/RTO.

## 2. Backup

Backup harus meliputi:
- Firestore melalui mekanisme export/backup yang sesuai.
- PostgreSQL melalui backup terkelola atau `pg_dump`/PITR.
- File Drive dan metadata, termasuk strategi pemulihan file yang terhapus.
- Konfigurasi infrastruktur dan migration.
- Kunci enkripsi/credential dikelola terpisah dan aman.

Tetapkan RPO (kehilangan data maksimum yang dapat diterima) dan RTO (waktu pemulihan maksimum) oleh pengurus sebelum produksi. Jangan mengarang target sebelum analisis dampak.

## 3. Restore procedure

1. Deklarasikan insiden dan tunjuk Incident Commander.
2. Tentukan titik pemulihan dan cakupan layanan.
3. Isolasi sistem yang terdampak bila diperlukan.
4. Pulihkan database ke lingkungan terisolasi.
5. Validasi jumlah record, integritas referensi, saldo/rekonsiliasi, dan audit.
6. Pulihkan dokumen dan verifikasi permission.
7. Jalankan smoke test serta uji akses per role.
8. Dapatkan persetujuan pemilik proses sebelum cutover.
9. Catat waktu, data hilang, keputusan, dan tindakan pencegahan.

## 4. Respons insiden keamanan

- Identifikasi dan klasifikasikan insiden.
- Batasi dampak: nonaktifkan akun/token, cabut akses, atau isolasi layanan.
- Simpan bukti log secara aman.
- Nilai data/subjek yang terdampak.
- Eskalasi kepada penanggung jawab dan pihak terkait sesuai kebijakan serta ketentuan yang berlaku.
- Pulihkan layanan dari kondisi tepercaya.
- Lakukan post-incident review tanpa menyalahkan individu.

## 5. Rekonsiliasi integrasi

Karena Firestore, Drive, dan PostGIS tidak berada dalam satu transaksi atomik, sediakan job untuk mendeteksi:
- metadata file tanpa file Drive;
- file Drive tanpa metadata yang sah;
- transaksi berstatus pending terlalu lama;
- fitur GIS tanpa referensi aset yang valid;
- retry yang gagal berulang.

Setiap tindakan koreksi harus idempotent dan tercatat.
