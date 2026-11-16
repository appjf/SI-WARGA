# 12. Test Plan dan User Acceptance Test

## 1. Jenis pengujian

| Jenis | Sasaran | Bukti |
|---|---|---|
| Unit | Fungsi, validasi, aturan bisnis | Test report |
| Component | Komponen UI | Test report |
| Integration | Firebase, Drive, GIS API | Log dan hasil |
| E2E | Alur warga/pengurus | Skenario dan rekaman hasil |
| Security | Auth, RBAC, object-level access | Laporan temuan |
| GIS QA | CRS, geometri, atribut, topologi | QA report |
| Performance | API, peta, dashboard | Load test report |
| Backup/restore | Pemulihan | Berita acara restore |
| UAT | Kesesuaian kebutuhan | Form persetujuan |

## 2. Skenario kritis

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| T-001 | Warga A meminta profil Warga B | Ditolak; tidak membocorkan data |
| T-002 | Warga mengirim role=admin | Diabaikan/ditolak; role server tetap |
| T-003 | Token expired | HTTP 401 |
| T-004 | Akun disabled dengan token valid | Operasi privat ditolak |
| T-005 | Warga membuat transaksi keuangan | HTTP 403 |
| T-006 | Bendahara mengirim request sama dua kali | Satu transaksi; respons idempotent |
| T-007 | Transaksi posted diedit | Ditolak; gunakan reversal |
| T-008 | Pengguna tak berwenang mengunduh dokumen | Ditolak dan dicatat sesuai kebijakan |
| T-009 | GeoJSON publik memuat PII | Test gagal; field harus dihapus |
| T-010 | Geometri invalid/SRID tidak sesuai | Ditolak atau ditransformasi secara eksplisit |
| T-011 | Backup dipulihkan | Jumlah/cek integritas data sesuai |
| T-012 | Ekspor data dilakukan | Hak akses, cakupan, dan audit sesuai |

## 3. UAT per pemilik proses

- Warga: login, profil, permohonan, status, pengaduan, pengumuman.
- Ketua RT: dashboard, persetujuan, pengumuman, monitoring.
- Sekretaris: master warga/rumah, layanan, surat, arsip.
- Bendahara: transaksi, bukti, rekonsiliasi, laporan, reversal.
- Keamanan: pencatatan kejadian dan akses terbatas.
- Koordinator GIS: layer, atribut, validasi, peta.
- Auditor: penelusuran audit read-only.

## 4. Form hasil UAT

| Kolom | Isian |
|---|---|
| ID test / versi build | |
| Peran penguji | |
| Tanggal dan lingkungan | |
| Langkah uji | |
| Hasil yang diharapkan | |
| Hasil aktual | |
| Status (Pass/Fail/Blocked) | |
| Bukti (tanpa PII) | |
| Catatan dan penanggung jawab | |
| Persetujuan pemilik proses | |

## 5. Exit criteria

Semua skenario P0 lulus; tidak ada defect keamanan kritis/tinggi terbuka; seluruh domain owner menyetujui UAT; backup restore berhasil; dokumentasi dan pelatihan tersedia.
