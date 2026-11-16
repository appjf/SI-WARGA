# 09. Google Drive Integration

## 1. Pola akses

Gunakan backend-mediated access. Client tidak menerima kredensial service account dan tidak memperoleh akses folder umum. Backend memeriksa token, role, ownership, klasifikasi dokumen, serta relasi dokumen sebelum upload/download.

## 2. Alur upload

1. Client meminta izin upload dengan metadata minimal.
2. Backend memverifikasi hak akses dan membuat record `pending`.
3. Backend memvalidasi ekstensi, MIME hasil deteksi, ukuran, dan nama file.
4. Backend mengunggah ke folder Drive privat yang ditentukan.
5. Backend menyimpan `driveFileId`, checksum bila tersedia, MIME, ukuran, klasifikasi, owner, dan status.
6. Record menjadi `available` setelah verifikasi.
7. Kegagalan menghasilkan status `failed` dan antrean rekonsiliasi.

## 3. Alur download

1. Client meminta download berdasarkan `documentId`.
2. Backend memuat metadata dan memeriksa akses objek.
3. Backend mencatat audit event.
4. Backend melakukan streaming terotorisasi atau menerbitkan URL singkat sesuai kemampuan provider.
5. URL tidak boleh permanen atau dapat ditebak.

## 4. Metadata wajib

`documentId`, `driveFileId`, `name`, `mimeType`, `sizeBytes`, `classification`, `ownerUid`, `relatedEntityType`, `relatedEntityId`, `status`, `createdAt`, `createdBy`, `checksum` (jika tersedia), `retentionClass`.

## 5. Keamanan dan operasi

- Folder privat secara default.
- Service account diberi akses minimum hanya pada folder yang diperlukan.
- Terapkan allowlist MIME dan batas ukuran.
- Pertimbangkan malware scanning untuk file unggahan.
- Jangan mempercayai nama ekstensi dari browser.
- Audit upload, download, perubahan klasifikasi, dan penghapusan.
- Penghapusan mengikuti retensi dan approval; bukan aksi permanen langsung.
- Rekonsiliasi berkala antara metadata Firestore dan file Drive.
- Uji pemulihan dokumen dan hak akses.
