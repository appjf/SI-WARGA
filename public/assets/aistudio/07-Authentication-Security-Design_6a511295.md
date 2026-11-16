# 07. AUTHENTICATION DAN SECURITY DESIGN
## Green Garden Residence – Integrated Community Management System

## 1. Tujuan

Dokumen ini menetapkan desain identitas, autentikasi, otorisasi, privasi, audit, pengelolaan secret, dan respons insiden. Keamanan diterapkan pada aplikasi, API, basis data, GIS, dan arsip dokumen.

## 2. Prinsip Keamanan

- Deny-by-default.
- Least privilege.
- Defense in depth.
- Verifikasi di server.
- Minimasi data pribadi.
- Pemisahan tugas.
- Auditability.
- Secure configuration.
- Patch dan review berkala.

## 3. Firebase Authentication

Firebase Authentication menjadi penyedia identitas. Metode login ditentukan berdasarkan kebutuhan warga dan kemampuan dukungan. Akun pengurus perlu perlindungan lebih kuat; aktifkan MFA jika tersedia dan sesuai.

Alur:
1. Pengguna login.
2. Firebase menerbitkan ID token.
3. Frontend mengirim token melalui HTTPS.
4. Backend memverifikasi token.
5. Backend memeriksa status akun dan role.
6. Backend memeriksa izin terhadap objek yang diminta.
7. Operasi dijalankan dan dicatat bila kritis.

Jangan mengandalkan data role dari local storage, request body, atau state browser.

## 4. RBAC

| Peran | Ruang lingkup |
|---|---|
| Super Admin | Konfigurasi teknis dan akun; akses data sensitif hanya bila dibutuhkan |
| Ketua RT | Monitoring dan persetujuan sesuai kewenangan |
| Sekretaris | Data warga dan administrasi |
| Bendahara | Ledger, bukti, rekonsiliasi |
| Keamanan | Kejadian dan patroli |
| Koordinator GIS | Inventaris dan layer spasial |
| Warga | Data sendiri dan informasi publik |
| Auditor | Read-only sesuai mandat |

RBAC dilengkapi pemeriksaan atribut/relasi: misalnya warga hanya dapat mengakses permohonannya sendiri. Ini mencegah role umum membuka data milik orang lain.

## 5. Firestore Security Rules

Rules bersifat deny-by-default. Contoh konseptual:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    match /announcements/{id} {
      allow read: if signedIn();
      allow write: if false;
    }

    match /users/{uid} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    match /transactions/{id} {
      allow read: if signedIn() &&
        request.auth.token.finance_reader == true;
      allow write: if false;
    }
  }
}
```

Contoh harus dikembangkan dan diuji sesuai skema. Admin SDK melewati Rules; backend wajib mengimplementasikan otorisasi sendiri.

## 6. Pengamanan API

- Verifikasi token pada setiap endpoint privat.
- Periksa role dan kepemilikan objek.
- Validasi semua input.
- Rate limiting.
- CORS terbatas.
- CSRF protection bila memakai cookie session.
- Security headers.
- Batas ukuran request dan unggahan.
- Pesan error tidak mengungkap detail internal.
- Gunakan idempotency untuk transaksi.

## 7. Pengelolaan Secret

Secret meliputi Firebase Admin credentials, kredensial Drive, password PostGIS, token, dan kunci layanan.
- Simpan di secret manager/environment server.
- Jangan commit ke GitHub.
- Jangan beri prefix `NEXT_PUBLIC_` pada secret.
- Batasi akses berdasarkan lingkungan dan fungsi.
- Rotasi bila terindikasi bocor atau sesuai jadwal.
- Hindari menampilkan secret pada log.
- Gunakan identitas layanan dengan izin minimum.

## 8. Perlindungan Data

Klasifikasi:
- Publik: pengumuman dan informasi umum.
- Internal: agenda dan data operasional non-sensitif.
- Terbatas: profil warga, transaksi rinci, pengaduan.
- Sangat terbatas: dokumen identitas dan dokumen pribadi yang benar-benar diperlukan.

Kontrol:
- Kumpulkan data sesuai tujuan.
- Jelaskan tujuan dan penggunaan kepada warga.
- Batasi akses dan masa retensi.
- Sediakan koreksi data.
- Publikasikan laporan agregat.
- Jangan menaruh PII pada layer peta publik.
- Gunakan data sintetis untuk pengembangan dan demonstrasi.

Telaah UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi dan ketentuan pelaksana yang berlaku bersama pihak yang berwenang. Dokumen ini bukan pendapat hukum.

## 9. Audit Log

Field minimum:
`eventId`, `actorUid`, `actorRole`, `action`, `entityType`, `entityId`, `timestamp`, `requestId`, `result`, `reason`.

Audit:
- append-only untuk pengguna operasional;
- tidak memuat token/password;
- akses baca terbatas;
- perubahan role, transaksi, surat, ekspor, dan perubahan GIS dicatat;
- waktu disimpan konsisten;
- diekspor/diarsipkan sesuai kebijakan.

## 10. Keamanan Google Drive dan GIS

- Berkas privat secara default.
- Backend memeriksa izin sebelum unduh.
- Jangan gunakan public link sebagai kontrol akses.
- GIS API memverifikasi token dan izin per layer.
- Database tidak diakses langsung oleh browser.
- Peta hanya menerima atribut minimum.
- Ekspor spasial dicatat dan dibatasi.

## 11. Pengujian Keamanan

Kasus minimum:
1. Warga A mencoba membaca profil Warga B.
2. Warga mencoba membuat transaksi.
3. Petugas keamanan mencoba mengakses dokumen keluarga.
4. Token kedaluwarsa atau signature salah.
5. Akun dinonaktifkan.
6. Manipulasi role di browser.
7. ID objek diganti untuk akses lintas pengguna.
8. Unggah file berbahaya/tidak sesuai tipe.
9. Percobaan brute force dan rate limit.
10. PII muncul dalam GeoJSON/log.
11. Secret terdeteksi pada repository.
12. Reversal transaksi tanpa kewenangan.

## 12. Respons Insiden

1. Deteksi dan klasifikasikan insiden.
2. Tunjuk penanggung jawab.
3. Batasi akses atau isolasi komponen.
4. Simpan bukti dan log.
5. Rotasi kredensial bila diperlukan.
6. Identifikasi data dan pengguna terdampak.
7. Pulihkan layanan dengan aman.
8. Lakukan komunikasi/pemberitahuan sesuai ketentuan.
9. Perbaiki akar masalah.
10. Dokumentasikan pembelajaran.

## 13. Review Berkala

Review akses minimal setiap pergantian pengurus dan secara berkala. Cabut akun yang tidak lagi membutuhkan akses. Periksa dependensi, konfigurasi, backup, log, dan temuan keamanan.
