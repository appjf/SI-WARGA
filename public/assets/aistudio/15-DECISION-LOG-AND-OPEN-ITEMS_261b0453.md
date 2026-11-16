# 15. Decision Log dan Open Items

## 1. Keputusan yang wajib disahkan sebelum produksi

| ID | Keputusan | Penanggung jawab yang disarankan | Status |
|---|---|---|---|
| D-01 | Daftar rumah, kode unit, dan struktur blok resmi | Ketua RT/Sekretaris | OPEN |
| D-02 | Proses verifikasi identitas dan aktivasi akun | Pengurus | OPEN |
| D-03 | Metode login dan kebutuhan MFA | Admin/Pengurus | OPEN |
| D-04 | Matriks kewenangan dan approval per layanan | Ketua RT | OPEN |
| D-05 | Kategori iuran, nominal, periode, denda (jika ada) | Bendahara/Pengurus | OPEN |
| D-06 | Kebijakan pencatatan, penutupan periode, reversal | Bendahara | OPEN |
| D-07 | Klasifikasi data dan field yang boleh dipublikasikan | Pemilik data | OPEN |
| D-08 | Retensi dokumen, transaksi, audit, dan data warga | Pengurus | OPEN |
| D-09 | Struktur folder Drive dan kepemilikan akun | Admin/Pengurus | OPEN |
| D-10 | Batas lingkungan dan CRS/sumber data GIS | Koordinator GIS | OPEN |
| D-11 | Layer publik/internal/restricted | Koordinator GIS/Pengurus | OPEN |
| D-12 | Target RPO/RTO dan jadwal backup | Pengurus/Operator | OPEN |
| D-13 | Domain, hosting GIS, project cloud, dan anggaran | Sponsor/Admin | OPEN |
| D-14 | Prosedur pengaduan dan SLA tindak lanjut | Pengurus | OPEN |
| D-15 | Kontak insiden dan mekanisme eskalasi | Ketua RT/Admin | OPEN |

## 2. Template Architecture Decision Record

```text
ADR-ID:
Judul:
Tanggal:
Status: Proposed / Accepted / Rejected / Superseded
Konteks:
Opsi yang dipertimbangkan:
Keputusan:
Alasan:
Konsekuensi positif:
Konsekuensi negatif/risiko:
Pemilik keputusan:
Tanggal review:
```

## 3. Risiko awal

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data awal tidak akurat | Layanan dan laporan salah | Data cleansing dan sign-off |
| Role salah konfigurasi | Kebocoran/penyalahgunaan | Deny-by-default, test per role |
| Transaksi ganda | Saldo tidak akurat | Idempotency, ledger, rekonsiliasi |
| File Drive terbuka | Paparan dokumen | Backend-mediated access |
| Geometri/CRS salah | Peta menyesatkan | Survey metadata dan GIS QA |
| Ketergantungan layanan cloud | Gangguan operasional | Backup, export, runbook |
| Tidak ada pemilik operasi | Sistem tidak terpelihara | Penetapan operator dan anggaran |

## 4. Asumsi yang tidak boleh dianggap fakta

- Nominal iuran dan aturan denda.
- Jumlah rumah, penghuni, dan struktur blok.
- Koordinat dan batas legal lingkungan.
- SLA layanan dan jam operasional.
- Klasifikasi dokumen dan masa retensi.
- Anggaran, paket cloud, dan kapasitas pengguna.
