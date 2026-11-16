# 03. DATABASE DESIGN – FIRESTORE DAN POSTGIS
## Green Garden Residence – Integrated Community Management System

## 1. Tujuan dan Prinsip

Dokumen ini merinci struktur data operasional dan spasial. Prinsip utama: Firestore menjadi sumber utama data operasional tahap awal; PostGIS menjadi sumber utama geometri; Google Drive menyimpan berkas; metadata dan referensi berkas berada di Firestore.

## 2. Domain dan Kepemilikan Data

| Domain | Penyimpanan | Pemilik proses |
|---|---|---|
| Akun | Firebase Authentication | Administrator |
| Profil warga | Firestore | Sekretaris/pengelola data |
| Rumah tangga | Firestore | Sekretaris |
| Administrasi | Firestore | Sekretaris/ketua |
| Keuangan | Firestore tahap awal | Bendahara |
| Pengaduan | Firestore | Pengurus/PIC |
| Arsip berkas | Google Drive | Pemilik proses terkait |
| Geometri | PostGIS | Koordinator GIS |
| Audit | Firestore/penyimpanan audit | Administrator/auditor |

## 3. Konvensi Data

- ID dibuat server, unik, stabil, dan tidak memuat data pribadi.
- Timestamp disimpan konsisten dalam UTC.
- Zona tampilan: `Asia/Jakarta`.
- Uang disimpan sebagai integer rupiah.
- Koordinat menyertakan CRS.
- Soft delete hanya bila ada kebutuhan retensi; data finansial tidak dihapus secara fisik.
- Field sensitif diberi klasifikasi dan aturan akses.
- Hindari menyimpan salinan atribut yang dapat berubah di banyak koleksi.

## 4. Model Firestore

### 4.1 `users/{uid}`

| Field | Tipe | Keterangan |
|---|---|---|
| `uid` | string | Sama dengan Firebase UID |
| `displayName` | string | Nama tampilan |
| `email` | string/null | Email bila digunakan |
| `phone` | string/null | Nomor kontak; terbatas |
| `status` | enum | active, disabled, pending |
| `roles` | array/map | Peran yang ditetapkan server |
| `createdAt` | timestamp | Waktu pembuatan |
| `updatedAt` | timestamp | Waktu pembaruan |

### 4.2 `residents/{residentId}`

| Field | Tipe | Keterangan |
|---|---|---|
| `residentId` | string | ID profil |
| `uid` | string/null | UID akun bila ada |
| `houseId` | string | Referensi rumah tangga |
| `fullName` | string | PII; akses terbatas |
| `contact` | map | Kontak; akses terbatas |
| `verificationStatus` | enum | pending, verified, rejected |
| `createdAt` | timestamp | Waktu pembuatan |
| `updatedAt` | timestamp | Waktu perubahan |

Jangan mengumpulkan NIK/nomor KK kecuali ada tujuan, dasar, dan kebijakan yang telah disahkan serta pengamanan yang memadai.

### 4.3 `households/{houseId}`

| Field | Tipe | Keterangan |
|---|---|---|
| `houseId` | string | Kunci stabil |
| `houseCode` | string | Kode unit unik |
| `addressLabel` | string | Label internal alamat |
| `headResidentId` | string | Referensi kepala rumah tangga |
| `memberIds` | array | ID anggota |
| `status` | enum | active, inactive, verification |
| `createdAt` | timestamp | Waktu pembuatan |
| `updatedAt` | timestamp | Waktu perubahan |

### 4.4 Koleksi lain

| Koleksi | Kunci dan field utama |
|---|---|
| `adminRequests` | `requestId`, `residentId`, `type`, `payload`, `status`, `assignedTo`, `history`, `createdAt` |
| `documents` | `documentId`, `driveFileId`, `name`, `mimeType`, `classification`, `ownerId`, `relatedEntity` |
| `transactions` | `transactionId`, `type`, `amount`, `categoryId`, `status`, `period`, `proofFileId`, `createdBy`, `postedAt`, `reversalOf` |
| `financeCategories` | `categoryId`, `name`, `type`, `active` |
| `complaints` | `ticketId`, `reporterId`, `category`, `description`, `status`, `priority`, `assignedTo`, `spatialId` |
| `announcements` | `announcementId`, `title`, `body`, `audience`, `publishedAt`, `expiresAt` |
| `events` | `eventId`, `title`, `startAt`, `locationLabel`, `registrationEnabled` |
| `assets` | `assetId`, `assetType`, `spatialId`, `condition`, `status`, `lastInspectionAt` |
| `notifications` | `notificationId`, `uid`, `type`, `readAt`, `createdAt` |
| `auditLogs` | `eventId`, `actorUid`, `action`, `entityType`, `entityId`, `timestamp`, `requestId`, `result` |

## 5. Contoh Dokumen

### 5.1 Household

```json
{
  "houseId": "H-006-001",
  "houseCode": "GG-RT06-001",
  "addressLabel": "Blok A, Unit 01",
  "headResidentId": "R-0001",
  "memberIds": ["R-0001", "R-0002"],
  "status": "active"
}
```

### 5.2 Transaction

```json
{
  "transactionId": "TX-2026-000001",
  "type": "income",
  "amount": 100000,
  "currency": "IDR",
  "categoryId": "CAT-IURAN",
  "period": "2026-11",
  "status": "posted",
  "proofFileId": "drive-file-id",
  "createdBy": "firebase-uid",
  "createdAt": "serverTimestamp",
  "postedAt": "serverTimestamp"
}
```

Data contoh bukan data aktual.

## 6. Relasi dan Integritas

- `residents.houseId` → `households.houseId`.
- `households.houseId` ↔ `ggr_gis.houses.house_id`.
- `documents.driveFileId` → file Google Drive.
- `complaints.spatialId` → fitur lokasi PostGIS.
- `assets.spatialId` → fitur aset PostGIS.

Karena Firestore tidak menyediakan foreign key relasional, integritas lintas dokumen dijaga melalui validasi backend, transaksi/batch, pemeriksaan referensi, dan proses rekonsiliasi berkala.

## 7. Strategi Keuangan

- Gunakan integer rupiah.
- Status `posted` menandakan transaksi masuk ledger.
- Saldo = total penerimaan posted dikurangi total pengeluaran posted, sesuai aturan periode.
- Transaksi posted tidak diubah langsung.
- Reversal membuat transaksi lawan yang mereferensikan transaksi awal.
- Terapkan idempotency key agar request ulang tidak menggandakan transaksi.
- Pisahkan hak input dan persetujuan jika kapasitas organisasi memungkinkan.
- Rekonsiliasi laporan dengan bukti transaksi dan saldo kas/bank aktual.

Jika kebutuhan akuntansi dan konsistensi transaksi meningkat, evaluasi ledger relasional di PostgreSQL.

## 8. Rancangan PostGIS

### 8.1 Tabel Inti

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS ggr_gis;

CREATE TABLE ggr_gis.houses (
  house_id text PRIMARY KEY,
  house_code text NOT NULL UNIQUE,
  block_name text,
  address_label text,
  geom geometry(Point, 4326),
  position_source text,
  accuracy_m numeric(8,2),
  surveyed_at timestamptz,
  surveyed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX houses_geom_gix
  ON ggr_gis.houses USING GIST (geom);

CREATE TABLE ggr_gis.roads (
  road_id text PRIMARY KEY,
  road_name text,
  surface_type text,
  width_m numeric(8,2),
  condition text,
  geom geometry(MultiLineString, 4326),
  surveyed_at timestamptz
);
CREATE INDEX roads_geom_gix
  ON ggr_gis.roads USING GIST (geom);

CREATE TABLE ggr_gis.drainage (
  drainage_id text PRIMARY KEY,
  drain_type text,
  material text,
  width_m numeric(8,2),
  depth_m numeric(8,2),
  condition text,
  geom geometry(MultiLineString, 4326),
  surveyed_at timestamptz
);
CREATE INDEX drainage_geom_gix
  ON ggr_gis.drainage USING GIST (geom);

CREATE TABLE ggr_gis.facilities (
  facility_id text PRIMARY KEY,
  facility_name text NOT NULL,
  facility_type text,
  condition text,
  geom geometry(Point, 4326),
  surveyed_at timestamptz
);
CREATE INDEX facilities_geom_gix
  ON ggr_gis.facilities USING GIST (geom);
```

### 8.2 Tabel Pendukung yang Disarankan

- `boundaries`: batas lingkungan dan blok.
- `streetlights`: lampu jalan.
- `waste_points`: titik pengumpulan sampah.
- `assets`: aset spasial.
- `inspections`: inspeksi berkala.
- `incidents`: titik kejadian.
- `survey_sessions`: metadata kegiatan survei.
- `attachments`: referensi berkas pendukung.

Gunakan foreign key, check constraint, not-null, unique constraint, dan validasi geometri sesuai model final.

## 9. CRS dan Pengukuran

- EPSG:4326 untuk pertukaran data geografis.
- EPSG:32748 untuk pengukuran metrik di wilayah Garut yang berada di UTM Zone 48S; validasi zona/datum terhadap sumber data.
- Transformasikan geometri sebelum menghitung luas/jarak.
- Jangan menghitung luas meter persegi dari koordinat derajat.
- Catat sumber, metode, tanggal, dan akurasi pengukuran.

Contoh:

```sql
SELECT ST_Area(ST_Transform(geom, 32748)) AS area_m2
FROM ggr_gis.boundaries;
```

## 10. Indeks, Query, dan Kinerja

- Gunakan GiST pada kolom geometri.
- Gunakan B-tree pada ID, status, tanggal, dan foreign key.
- Terapkan bounding box untuk pengambilan fitur peta.
- Batasi jumlah fitur per request dan gunakan pagination.
- Pilih atribut yang diperlukan saja.
- Pertimbangkan vector tiles untuk layer besar.
- Periksa query plan dengan `EXPLAIN ANALYZE`.

## 11. Keamanan Basis Data

- Database tidak diekspos langsung ke browser.
- Gunakan akun layanan terpisah dengan hak minimum.
- Pisahkan role read-only dan editor bila diperlukan.
- Gunakan TLS dan secret manager.
- Batasi jaringan/IP bila didukung penyedia.
- Audit operasi tulis dan perubahan skema.
- Enkripsi backup dan uji restore.

## 12. Migrasi dan Rekonsiliasi

1. Tetapkan kamus data dan ID unik.
2. Bersihkan duplikasi.
3. Validasi data wajib.
4. Impor ke staging.
5. Bandingkan jumlah dan sampel atribut.
6. Verifikasi hubungan Firestore–PostGIS.
7. Setujui migrasi produksi.
8. Simpan log migrasi dan prosedur rollback.

## 13. Data Dictionary dan Retensi

Kamus data final harus memuat nama field, tipe, definisi, satuan, domain nilai, kewajiban, klasifikasi, sumber, dan retensi. Retensi ditetapkan berdasarkan tujuan, kebutuhan organisasi, serta ketentuan hukum yang berlaku.
