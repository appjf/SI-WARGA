# 02. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Green Garden Residence – Integrated Community Management System

**Versi:** 1.0 | **Status:** Draft untuk validasi pengguna

## 1. Tujuan

SRS menetapkan kebutuhan fungsional, nonfungsional, aturan bisnis, antarmuka, data, serta kriteria penerimaan GGR-ICMS. Dokumen ini menjadi dasar estimasi, desain rinci, pengembangan, pengujian, dan penerimaan sistem.

## 2. Ruang Lingkup Produk

Sistem mendukung:
- Akun, profil warga, dan rumah tangga.
- Layanan administrasi dan surat.
- Iuran, transaksi, kas, bukti, dan laporan.
- Pengumuman dan agenda.
- Pengaduan dan aspirasi.
- Keamanan dan pencatatan kejadian.
- Inventaris aset dan pemeliharaan.
- GIS lingkungan.
- Arsip Google Drive.
- Audit, notifikasi, dan dashboard.

Tidak termasuk penerbitan dokumen kependudukan pemerintah, penetapan batas kadaster, layanan perbankan, atau sistem akuntansi perusahaan penuh.

## 3. Pengguna dan Karakteristik

| Pengguna | Kebutuhan |
|---|---|
| Warga | Alur sederhana, mobile-first, status layanan jelas |
| Ketua RT | Ringkasan dan persetujuan |
| Sekretaris | Data warga dan layanan administrasi |
| Bendahara | Transaksi akurat, bukti, rekonsiliasi |
| Keamanan | Input kejadian cepat dan akses minimum |
| Koordinator prasarana | Data aset, inspeksi, peta |
| Administrator | Pengelolaan akun dan konfigurasi |
| Auditor | Catatan baca-saja sesuai mandat |

## 4. Asumsi dan Ketergantungan

- Pengurus menetapkan daftar rumah dan kode unit.
- Pengguna memiliki perangkat dan akses internet pada saat menggunakan sistem.
- Firebase, Google Drive, Vercel, dan hosting GIS tersedia sesuai paket yang dipilih.
- Penggunaan Google Drive API memerlukan konfigurasi izin dan kredensial yang sah.
- Data spasial awal harus dikumpulkan dan diverifikasi.
- Persetujuan dan kebijakan organisasi disahkan sebelum data nyata dimasukkan.

## 5. Kebutuhan Fungsional

Prioritas: Must = wajib MVP; Should = penting; Could = pengembangan berikutnya.

| ID | Kebutuhan | Prioritas | Kriteria ringkas |
|---|---|---|---|
| FR-001 | Login/logout | Must | Akun terdaftar dapat login; token invalid ditolak |
| FR-002 | Pengelolaan peran | Must | Admin berwenang dapat mengubah role dan status |
| FR-003 | Profil warga | Must | Pengurus dapat membuat/memutakhirkan profil |
| FR-004 | Rumah tangga | Must | Setiap unit mempunyai ID unik |
| FR-005 | Koreksi data mandiri | Should | Warga mengajukan koreksi untuk diverifikasi |
| FR-006 | Permohonan administrasi | Must | Warga membuat permohonan dan memperoleh nomor |
| FR-007 | Verifikasi/persetujuan | Must | Status dan pelaksana tercatat |
| FR-008 | Penerbitan surat | Must | Dokumen final diarsipkan dan dapat diakses sesuai izin |
| FR-009 | Pencatatan penerimaan | Must | Bendahara mencatat nominal, kategori, tanggal, bukti |
| FR-010 | Pencatatan pengeluaran | Must | Bendahara mencatat tujuan, penerima/keterangan, bukti |
| FR-011 | Ledger dan laporan | Must | Saldo dihitung dari transaksi posted |
| FR-012 | Reversal | Must | Koreksi transaksi mempertahankan jejak asal |
| FR-013 | Pengaduan | Must | Tiket mempunyai kategori, uraian, waktu, status |
| FR-014 | Penugasan PIC | Must | Pengurus menetapkan penanggung jawab |
| FR-015 | Pengumuman | Must | Pengurus menerbitkan informasi berdasarkan audience |
| FR-016 | Notifikasi | Should | Peristiwa relevan menghasilkan notifikasi |
| FR-017 | Kejadian keamanan | Should | Petugas mencatat kejadian sesuai peran |
| FR-018 | Inventaris aset | Should | Aset memiliki ID, jenis, kondisi, status |
| FR-019 | Peta lingkungan | Should | Pengguna melihat layer yang diizinkan |
| FR-020 | Edit data GIS | Should | Editor berwenang mengubah fitur dengan audit |
| FR-021 | Arsip Drive | Must | Metadata dan file ID tercatat |
| FR-022 | Audit log | Must | Operasi kritis mencatat actor, action, waktu, objek |
| FR-023 | Laporan | Must | Laporan sesuai peran dan periode |
| FR-024 | Kegiatan warga | Could | Agenda dan pendaftaran kegiatan |
| FR-025 | Jajak pendapat | Could | Satu akun satu respons bila aturan disepakati |

## 6. Aturan Bisnis

1. `houseId` unik, stabil, dan tidak digunakan ulang.
2. Status akun dan status verifikasi warga merupakan dua hal berbeda.
3. Warga hanya dapat melihat data pribadi/permohonannya dan informasi yang dipublikasikan.
4. Surat yang telah diterbitkan memiliki versi dan riwayat.
5. Transaksi posted tidak dihapus melalui UI.
6. Pembetulan transaksi memakai reversal atau jurnal koreksi yang saling mereferensikan.
7. Nominal uang menggunakan integer rupiah.
8. Pengaduan mempunyai nomor tiket dan riwayat status.
9. Lokasi pengaduan bersifat opsional dan tidak memuat PII pada layer publik.
10. Pengumuman harus memiliki audience, tanggal publikasi, dan masa berlaku bila diperlukan.
11. Dokumen memiliki klasifikasi akses.
12. Perubahan role dan tindakan keuangan dicatat pada audit log.

## 7. Alur Status

### 7.1 Permohonan

`draft → submitted → under_review → approved/rejected → issued/closed`

`needs_revision` dapat mengembalikan permohonan kepada pemohon. Setiap transisi harus divalidasi backend.

### 7.2 Pengaduan

`submitted → triaged → assigned → in_progress → resolved → closed`

Tiket dapat dibuka kembali bila hasil belum memadai. Perubahan status mencatat pelaku, waktu, dan catatan.

### 7.3 Transaksi

`draft → pending_review → posted`

Jika dibatalkan sebelum posting: `voided`. Transaksi posted dikoreksi dengan reversal, bukan dihapus.

## 8. Kebutuhan Nonfungsional

| ID | Kebutuhan | Target/ketentuan |
|---|---|---|
| NFR-001 | Keamanan | HTTPS, token verification, RBAC, deny-by-default |
| NFR-002 | Privasi | Minimisasi data dan pembatasan PII |
| NFR-003 | Kinerja | Sasaran P95 API ringan < 1 detik pada beban uji |
| NFR-004 | Ketersediaan | Sasaran awal 99,5% per bulan |
| NFR-005 | Responsif | Ponsel, tablet, desktop |
| NFR-006 | Aksesibilitas | Keyboard, label, fokus, kontras, status tidak hanya warna |
| NFR-007 | Audit | Operasi kritis dapat ditelusuri |
| NFR-008 | Backup | Jadwal dan restore test terdokumentasi |
| NFR-009 | Portabilitas | Ekspor data terpilih dalam format terbuka |
| NFR-010 | Maintainability | Lint, type check, test, dokumentasi, review |

Target harus dikonfirmasi berdasarkan beban, biaya, dan kemampuan layanan yang dipilih.

## 9. Antarmuka Eksternal

- Firebase Authentication untuk identitas.
- Firestore untuk data operasional.
- Google Drive API untuk berkas privat.
- FCM untuk notifikasi.
- GIS API berbasis FastAPI untuk data spasial.
- Leaflet/MapLibre untuk peta web.
- GitHub Actions/CI dan Vercel untuk proses rilis.

## 10. Kebutuhan Data

Entitas utama: User, Resident, Household, AdminRequest, Document, Transaction, FinanceCategory, Complaint, Announcement, Event, Asset, GISFeature, AuditEvent.

Setiap entitas memiliki ID stabil, waktu pembuatan/perubahan, status bila relevan, serta identitas pembuat/perubah untuk data kritis.

## 11. Validasi dan Penanganan Kesalahan

- Backend memvalidasi seluruh input.
- Pesan kesalahan pengguna harus jelas dan tidak membocorkan detail internal.
- Kegagalan eksternal harus mempunyai status retry/failed yang eksplisit.
- Operasi tulis yang dapat dikirim ulang menggunakan idempotency.
- Sistem mencegah akses lintas pengguna dan lintas rumah yang tidak berwenang.

## 12. Kriteria UAT

UAT melibatkan perwakilan warga dan pengurus. Skenario minimum:
1. Login dan pemulihan akses.
2. Warga mengajukan surat.
3. Sekretaris memverifikasi dan pejabat menyetujui.
4. Bendahara mencatat penerimaan dan pengeluaran.
5. Laporan kas cocok dengan ledger uji.
6. Warga mengirim pengaduan dan memantau status.
7. Pengurus menerbitkan pengumuman.
8. Dokumen privat tidak dapat diakses akun yang tidak berhak.
9. Layer GIS hanya menampilkan atribut yang diizinkan.
10. Audit log tersedia untuk tindakan kritis.

## 13. Traceability

Setiap kebutuhan diberi ID dan dihubungkan dengan:
- modul/komponen desain;
- endpoint atau operasi data;
- test case;
- status implementasi;
- bukti penerimaan.

## 14. Hal yang Harus Diputuskan

Daftar layanan surat, kebijakan iuran, alur persetujuan, peran final, kategori pengaduan, audience pengumuman, masa retensi, batas layer publik, dan target RPO/RTO harus ditetapkan oleh organisasi.
