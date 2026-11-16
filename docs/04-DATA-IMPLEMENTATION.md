# 04. Data Implementation — Firestore dan PostGIS

## 1. Prinsip

Firestore menjadi sumber data operasional tahap awal; PostGIS menjadi sumber geometri spasial; Drive menyimpan file; Firestore menyimpan metadata dan referensi file. Sumber data, kepemilikan, retensi, dan hak akses harus ditetapkan per domain.

## 2. Koleksi Firestore yang disarankan

| Koleksi | Dokumen | Catatan |
|---|---|---|
| `users` | `{uid}` | Profil akun minimal; role ditetapkan backend |
| `households` | `{householdId}` | Data rumah tangga |
| `houses` | `{houseId}` | Kode unit unik |
| `residentProfiles` | `{residentId}` | Data warga dengan akses terbatas |
| `serviceRequests` | `{requestId}` | Permohonan dan status |
| `financeTransactions` | `{transactionId}` | Transaksi immutable setelah posted |
| `financePeriods` | `{periodId}` | Periode dan status penutupan |
| `complaints` | `{complaintId}` | Tiket dan tindak lanjut |
| `announcements` | `{announcementId}` | Draft/review/published |
| `assets` | `{assetId}` | Metadata aset non-geometri |
| `documents` | `{documentId}` | Metadata Drive dan klasifikasi |
| `auditEvents` | `{eventId}` | Event append-only melalui backend |
| `idempotencyKeys` | `{key}` | Hasil operasi write idempotent |

Semua dokumen perlu `createdAt`, `createdBy`, `updatedAt`, `updatedBy` sesuai konteks. Jangan menyimpan NIK atau data identitas sensitif jika tidak benar-benar diperlukan. Bila wajib, tetapkan kontrol field-level dan dasar pemrosesan.

## 3. Contoh struktur dokumen transaksi

```json
{
  "transactionId": "server-generated",
  "type": "receipt",
  "status": "posted",
  "amountIdr": 150000,
  "currency": "IDR",
  "occurredAt": "Firestore Timestamp",
  "periodId": "2026-11",
  "houseId": "server-validated-house-id",
  "description": "Iuran lingkungan",
  "evidenceDocumentId": "optional-document-id",
  "idempotencyKey": "client-generated-unique-key",
  "createdAt": "Firestore Timestamp",
  "createdBy": "verified-uid",
  "postedAt": "Firestore Timestamp",
  "postedBy": "verified-uid"
}
```

Contoh ini bukan penetapan tarif iuran. Tarif, kategori, periode, dan otorisasi harus disahkan bendahara/pengurus.

## 4. Indeks Firestore

Buat composite indexes berdasarkan query aktual, misalnya:
- `serviceRequests`: `ownerUid ASC, createdAt DESC`
- `serviceRequests`: `status ASC, createdAt DESC`
- `financeTransactions`: `periodId ASC, occurredAt DESC`
- `complaints`: `status ASC, updatedAt DESC`
- `documents`: `relatedEntityType ASC, relatedEntityId ASC, createdAt DESC`

Indeks final harus berasal dari query yang dipakai dan diuji pada staging.

## 5. SQL migration PostGIS — starter

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS ggr_gis;

CREATE TABLE IF NOT EXISTS ggr_gis.asset_features (
  feature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE,
  feature_type TEXT NOT NULL,
  name TEXT NOT NULL,
  condition_status TEXT,
  source_name TEXT,
  surveyed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('public','internal','restricted')),
  geom geometry(Geometry, 4326) NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS asset_features_geom_gix
  ON ggr_gis.asset_features USING GIST (geom);
CREATE INDEX IF NOT EXISTS asset_features_type_idx
  ON ggr_gis.asset_features (feature_type);
CREATE INDEX IF NOT EXISTS asset_features_visibility_idx
  ON ggr_gis.asset_features (visibility);

ALTER TABLE ggr_gis.asset_features
  ADD CONSTRAINT asset_features_geom_valid
  CHECK (ST_IsValid(geom));
```

Catatan: `gen_random_uuid()` memerlukan dukungan PostgreSQL yang sesuai; validasi pada versi target. SRID 4326 hanya contoh penyimpanan longitude/latitude; untuk pengukuran jarak/luas gunakan proyeksi/metode geodesik yang tepat dan dokumentasikan.

## 6. Aturan transaksi data

- Posted finance transaction tidak dihapus atau diedit langsung; gunakan reversal dan referensi transaksi asal.
- ID dibuat server, stabil, dan tidak mengandung PII.
- Gunakan transaksi Firestore/batch sesuai batasan layanan; jangan menganggap operasi lintas Firestore–Drive–PostGIS atomik.
- Proses lintas layanan memakai status, retry, idempotency, dan rekonsiliasi.
- Soft delete hanya sesuai retensi; transaksi dan audit tidak dihapus fisik tanpa otorisasi dan dasar yang sah.
- Backup mencakup Firestore, PostgreSQL, dan file Drive/metadata dengan prosedur pemulihan terpisah.

## 7. Migrasi dan rollback

Gunakan migration bernomor, misalnya `001_create_asset_features.sql`. Migration yang sudah diterapkan tidak diedit; buat migration baru untuk perubahan. Untuk data yang tidak aman di-rollback, gunakan forward-fix dan backup terverifikasi. Jalankan migration pada staging dengan snapshot sebelum produksi.
