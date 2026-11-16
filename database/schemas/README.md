# Database Schemas & Data Dictionary (`database/schemas/`)

Kamus data terpadu, klasifikasi data (`public`, `internal`, `restricted`, `highly_restricted`), kebijakan retensi, dan pemetaan relasi kunci lintas platform:
- `users.uid` (Firebase Auth) ↔ `residents.uid` (Firestore)
- `households.houseId` (Firestore) ↔ `ggr_gis.houses.house_id` (PostGIS)
- `documents.driveFileId` (Firestore) ↔ Google Drive File ID
- `complaints.spatialId` & `assets.spatialId` (Firestore) ↔ fitur PostGIS
