# 08. GOOGLE DRIVE INTEGRATION
## Green Garden Residence – Integrated Community Management System

## 1. Tujuan

Google Drive digunakan sebagai repositori berkas dan dokumen. Firestore menyimpan metadata dan referensi file, bukan konten berkas. Akses dokumen harus melalui proses otorisasi GGR-ICMS.

## 2. Ruang Lingkup Berkas

- Surat masuk dan keluar.
- Bukti penerimaan/pengeluaran.
- Notulen rapat.
- Laporan periodik.
- Foto aset dan inspeksi.
- Dokumen survei dan GIS.
- Materi kegiatan warga.

## 3. Prinsip Integrasi

1. Private by default.
2. Backend-mediated access.
3. Least privilege untuk akun layanan.
4. Metadata konsisten.
5. Audit upload/download/delete.
6. Validasi tipe, ukuran, dan konteks file.
7. Retry dan rekonsiliasi untuk kegagalan.
8. Retensi dan pemulihan ditetapkan.

## 4. Struktur Folder Awal

```text
Green-Garden-Residence/
├── 01-Administrasi/
│   ├── Surat-Masuk/
│   └── Surat-Keluar/
├── 02-Keuangan/
│   ├── Bukti-Penerimaan/
│   ├── Bukti-Pengeluaran/
│   └── Laporan-Periodik/
├── 03-Kegiatan-Warga/
├── 04-Aset-dan-Pemeliharaan/
├── 05-GIS-dan-Survei/
├── 06-Rapat-dan-Notulen/
└── 99-Arsip-Terbatas/
```

Struktur folder final mengikuti klasifikasi akses. Hindari nama folder yang mengekspos data pribadi.

## 5. Metadata Firestore

Koleksi `documents`:

| Field | Definisi |
|---|---|
| `documentId` | ID internal |
| `driveFileId` | ID file Google Drive |
| `name` | Nama berkas |
| `mimeType` | Tipe konten |
| `sizeBytes` | Ukuran |
| `classification` | public/internal/restricted/highly_restricted |
| `ownerUid` | Pengunggah/pemilik proses |
| `relatedEntityType` | Jenis entitas terkait |
| `relatedEntityId` | ID entitas terkait |
| `folderRef` | Referensi folder internal |
| `status` | pending/available/failed/archived |
| `createdAt` | Waktu unggah |
| `createdBy` | UID pelaku |

Jangan menyimpan URL publik sebagai mekanisme akses. Simpan Drive file ID dan gunakan backend.

## 6. Model Identitas Google

Pilih autentikasi berdasarkan kepemilikan akun Google dan kebijakan organisasi:
- OAuth untuk akses atas nama pengguna, bila memang diperlukan.
- Service account untuk integrasi server-ke-server dengan sumber daya yang dibagikan kepadanya.
- Delegated access pada Google Workspace hanya bila disetujui administrator dan diperlukan.

Service account tidak otomatis memiliki akses ke seluruh Drive pribadi. Pastikan folder/Shared Drive dibagikan dengan identitas yang benar dan izin dibatasi.

## 7. Alur Unggah

1. Pengguna memilih file.
2. Frontend mengirim permintaan upload session ke backend.
3. Backend memverifikasi token dan role.
4. Backend memeriksa ukuran, ekstensi, MIME, dan konteks dokumen.
5. Backend mengunggah menggunakan Drive API.
6. Backend menyimpan metadata dan `driveFileId`.
7. Audit log dibuat.
8. Status dokumen menjadi `available` setelah verifikasi sukses.

Jika unggah gagal, status harus `failed` atau `pending_retry`, bukan `available`.

## 8. Alur Unduh

1. Pengguna meminta `documentId`.
2. Backend mengambil metadata.
3. Backend memeriksa hak akses terhadap dokumen dan entitas terkait.
4. Backend mengambil konten dari Drive.
5. Backend mengirim stream atau mekanisme akses sementara yang aman.
6. Aktivitas dicatat.

Jangan mengembalikan file ID sebagai satu-satunya pemeriksaan keamanan. Izin harus dinilai pada setiap unduhan.

## 9. Validasi File

- Daftar tipe yang diizinkan.
- Batas ukuran per kategori.
- Periksa MIME berdasarkan konten bila tersedia.
- Nama file dinormalisasi.
- Tolak ekstensi berbahaya.
- Pertimbangkan pemindaian malware sesuai kemampuan.
- Simpan checksum untuk verifikasi integritas bila relevan.
- Jangan menjalankan file unggahan.

## 10. Retry dan Konsistensi

- Gunakan retry exponential backoff untuk error sementara.
- Deduplikasi berdasarkan idempotency key dan metadata.
- Hindari upload ganda saat pengguna mengulang request.
- Sediakan rekonsiliasi antara dokumen Firestore dan file Drive.
- Tangani file yang terhapus/akses dicabut.
- Catat hasil operasi dan request ID.

## 11. Retensi dan Backup

Tentukan:
- masa simpan per kategori;
- pihak yang berwenang menghapus;
- proses persetujuan penghapusan;
- versioning;
- salinan arsip untuk dokumen penting;
- prosedur pemulihan.

Sinkronisasi bukan backup yang cukup. Uji pemulihan dokumen dan akses secara berkala.

## 12. Keamanan Operasional

- Credential hanya pada server.
- Folder privat.
- Tidak ada link publik untuk dokumen sensitif.
- Rotasi credential.
- Audit akses.
- Pemisahan folder development dan production.
- Batasi akses administrator Drive.
- Review izin saat pergantian pengurus.

## 13. Kriteria Penerimaan

- Pengguna tidak berwenang tidak dapat mengunduh dokumen.
- Upload gagal tidak menghasilkan metadata available.
- Metadata file tersimpan benar.
- File dapat diunduh oleh pemilik/pejabat yang berwenang.
- Retry tidak menggandakan file.
- Aktivitas kritis tercatat.
- Prosedur pemulihan dan retensi terdokumentasi.
