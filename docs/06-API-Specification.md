# 06. API SPECIFICATION
## Green Garden Residence – Integrated Community Management System

## 1. Tujuan

Spesifikasi ini menetapkan konvensi endpoint, autentikasi, format payload, validasi, respons, idempotensi, dan operasi API aplikasi serta GIS. Detail skema OpenAPI final harus disinkronkan dengan implementasi.

## 2. Konvensi Umum

- API aplikasi: `/api/v1`.
- GIS API: `/v1`.
- HTTPS wajib.
- JSON UTF-8 untuk payload standar.
- Timestamp disimpan UTC dalam ISO 8601.
- Mata uang: integer IDR.
- ID dibuat server.
- Pagination cursor.
- Semua endpoint privat memerlukan token dan otorisasi.
- Jangan mengirim secret atau PII dalam URL.

## 3. Autentikasi Request

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
X-Request-Id: <unique-request-id>
Idempotency-Key: <unique-write-key>
```

Backend memverifikasi Firebase ID token: signature, issuer, audience, masa berlaku, dan status pengguna. Setelah autentikasi, backend tetap memeriksa role dan hak akses objek.

## 4. Format Respons

Sukses:

```json
{
  "data": {"id": "resource-id"},
  "meta": {"requestId": "req-123"}
}
```

Gagal:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dimasukkan.",
    "details": [{"field": "amount", "reason": "must_be_positive"}]
  },
  "meta": {"requestId": "req-123"}
}
```

Kode HTTP yang digunakan:
- `200` berhasil membaca/memperbarui.
- `201` berhasil membuat.
- `202` diterima untuk diproses asinkron.
- `204` berhasil tanpa body.
- `400` request tidak valid.
- `401` belum terautentikasi.
- `403` tidak memiliki izin.
- `404` objek tidak ditemukan atau tidak boleh diungkap keberadaannya.
- `409` konflik/idempotensi.
- `413` payload terlalu besar.
- `422` validasi semantik gagal.
- `429` rate limit.
- `500/502/503` kegagalan server/ketergantungan.

## 5. Endpoint Aplikasi

| Method | Path | Fungsi | Peran |
|---|---|---|---|
| GET | `/api/v1/me` | Profil akun aktif | Semua akun |
| GET | `/api/v1/households/{id}` | Detail rumah tangga | Warga terkait/pengurus |
| POST | `/api/v1/admin-requests` | Ajukan permohonan | Warga |
| GET | `/api/v1/admin-requests` | Daftar sesuai cakupan | Warga/pengurus |
| GET | `/api/v1/admin-requests/{id}` | Detail permohonan | Pihak berwenang |
| PATCH | `/api/v1/admin-requests/{id}` | Status/tindak lanjut | Pengurus |
| POST | `/api/v1/transactions` | Buat transaksi draft | Bendahara |
| POST | `/api/v1/transactions/{id}/post` | Posting transaksi | Bendahara/approver |
| POST | `/api/v1/transactions/{id}/reverse` | Reversal | Bendahara/approver |
| GET | `/api/v1/transactions` | Daftar transaksi | Sesuai izin |
| POST | `/api/v1/complaints` | Buat pengaduan | Warga |
| PATCH | `/api/v1/complaints/{id}` | Update tiket | Pengurus/PIC |
| GET | `/api/v1/announcements` | Daftar pengumuman | Sesuai audience |
| POST | `/api/v1/documents/upload-session` | Memulai unggah | Sesuai peran |
| GET | `/api/v1/documents/{id}/download` | Unduh berotorisasi | Sesuai izin |

## 6. Contoh Payload

### 6.1 Permohonan

```json
{
  "type": "domicile_letter",
  "subject": "Permohonan surat keterangan",
  "notes": "Keperluan administrasi",
  "attachmentIds": []
}
```

### 6.2 Transaksi

```json
{
  "type": "income",
  "amount": 100000,
  "currency": "IDR",
  "categoryId": "CAT-IURAN",
  "period": "2026-11",
  "description": "Iuran lingkungan",
  "proofFileId": "drive-file-id"
}
```

Nominal harus integer positif. Backend menentukan pembuat, waktu, dan status; jangan menerima `createdBy` dari klien sebagai sumber tepercaya.

### 6.3 Pengaduan

```json
{
  "category": "drainage",
  "title": "Saluran tersumbat",
  "description": "Terdapat endapan pada saluran.",
  "location": {
    "longitude": 107.0,
    "latitude": -7.2,
    "crs": "EPSG:4326"
  },
  "attachmentIds": []
}
```

Koordinat hanya ilustrasi format, bukan koordinat lokasi perumahan.

## 7. GIS API

| Method | Path | Fungsi |
|---|---|---|
| GET | `/v1/layers` | Daftar layer yang boleh diakses |
| GET | `/v1/layers/{layer_id}/features` | Ambil fitur dalam bbox |
| GET | `/v1/features/{feature_id}` | Detail fitur |
| POST | `/v1/features` | Buat fitur |
| PATCH | `/v1/features/{feature_id}` | Ubah fitur |
| POST | `/v1/analysis/nearest` | Analisis kedekatan |
| POST | `/v1/analysis/summary` | Ringkasan spasial |

Parameter pengambilan fitur: `bbox`, `limit`, `cursor`, `fields`, `updatedSince`. Validasi urutan bbox, CRS, jumlah hasil, dan hak akses layer.

## 8. Idempotensi dan Konkurensi

- Endpoint transaksi wajib mendukung idempotency key.
- Simpan hasil request untuk key yang sama dalam jangka waktu kebijakan.
- Key yang sama dengan payload berbeda harus menghasilkan konflik.
- Gunakan transaksi atomik Firestore untuk perubahan yang saling terkait.
- Terapkan optimistic concurrency/version field untuk pembaruan yang berpotensi bersamaan.

## 9. Validasi dan Keamanan

- Schema validation di backend.
- Rate limit pada autentikasi, pencarian, unggah, dan write.
- Batas ukuran payload dan file.
- Validasi MIME berdasarkan konten bila memungkinkan.
- CORS hanya untuk origin resmi.
- Jangan mencatat token, kata sandi, nomor identitas, atau isi dokumen.
- Gunakan request ID untuk korelasi.
- Terapkan output encoding dan proteksi terhadap injection.

## 10. Google Drive API Flow

Frontend tidak menerima credential Drive. Backend membuat sesi unggah, memvalidasi pengguna, mengirim berkas ke Drive, menyimpan metadata dan `driveFileId`, lalu mencatat audit. Unduh dilakukan melalui endpoint yang memeriksa izin sebelum mengambil file.

## 11. Dokumentasi OpenAPI

Setiap endpoint harus mempunyai:
- ringkasan dan tujuan;
- skema request/response;
- autentikasi;
- role dan izin;
- status code;
- contoh;
- batas ukuran/rate;
- idempotensi;
- efek samping;
- test case.

Spesifikasi OpenAPI harus berada dalam repository dan diperbarui melalui pull request. Perubahan breaking diberi versi atau strategi kompatibilitas.

## 12. Kriteria Penerimaan API

- Token invalid ditolak.
- Akses lintas pengguna ditolak.
- Input tidak valid menghasilkan error terstruktur.
- Write penting idempotent.
- Log tidak menyimpan secret/PII yang tidak perlu.
- Pagination dan batas hasil berfungsi.
- Kontrak OpenAPI sesuai implementasi.
