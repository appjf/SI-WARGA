# Google Drive Integration (`integrations/google-drive/`)

Spesifikasi arsip berkas privat merujuk pada `08-Google-Drive-Integration.md` dan `09-GOOGLE-DRIVE-INTEGRATION.md`.

## Prinsip Inti

- **Private by Default:** Klien tidak menerima kredensial Google Drive atau URL publik permanen.
- **Backend-Mediated:** Unggah dan unduh melalui endpoint terotorisasi dengan validasi ekstensi, deteksi MIME, batas ukuran, dan pencatatan audit.
- **Rekonsiliasi:** Penyelarasan berkala antara koleksi `documents` di Firestore dengan keberadaan berkas di Drive.
