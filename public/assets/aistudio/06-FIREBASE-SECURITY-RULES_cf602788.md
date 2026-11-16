# 06. Firebase Security Rules — Baseline

## 1. Prinsip

Rules berikut adalah baseline konservatif. Untuk sistem yang seluruh akses data dilakukan melalui backend Admin SDK, pertimbangkan menolak seluruh akses client langsung dan menjadikan API sebagai satu-satunya jalur. Firebase Admin SDK melewati Firestore Rules; karena itu backend wajib memeriksa role, ownership, status akun, dan validasi input sendiri.

## 2. Pilihan arsitektur akses

**Pilihan A — Backend-mediated (direkomendasikan untuk domain sensitif):** client tidak membaca/menulis koleksi sensitif secara langsung. API memverifikasi token dan otorisasi objek. Rules menolak akses client.

**Pilihan B — Direct client access terbatas:** hanya untuk koleksi yang telah dianalisis risikonya, dengan rules per dokumen dan pengujian emulator. Jangan gunakan custom claims sebagai satu-satunya kontrol ownership.

## 3. Rules deny-by-default

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // All privileged operations are performed through trusted backend.
    // Admin SDK bypasses these rules; server authorization is mandatory.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Rules ini sengaja menolak seluruh akses browser. Jika aplikasi memerlukan direct read, buat pengecualian eksplisit setelah threat modeling; jangan melonggarkan aturan global.

## 4. Contoh pengujian yang wajib

- Anonymous user tidak dapat membaca/menulis koleksi.
- Warga A tidak dapat membaca dokumen Warga B.
- Warga tidak dapat menetapkan role sendiri.
- Bendahara dapat menjalankan fungsi keuangan sesuai kewenangan tetapi tidak mengubah role.
- Sekretaris tidak dapat mengakses secret atau mengubah transaksi posted.
- Akun disabled ditolak backend walaupun token belum kedaluwarsa.
- Auditor hanya dapat membaca lingkup audit yang ditetapkan.

## 5. Backend authorization checklist

1. Verifikasi signature, issuer, audience, expiry Firebase ID token.
2. Ambil status dan role dari sumber tepercaya server-side.
3. Periksa authorization pada objek/record yang diminta.
4. Validasi field yang boleh diubah (allowlist).
5. Terapkan idempotency dan rate limit untuk operasi tulis.
6. Tulis audit event untuk operasi kritis.
7. Jangan menerima `role`, `ownerUid`, `createdBy`, `postedBy` dari client sebagai nilai otoritatif.
