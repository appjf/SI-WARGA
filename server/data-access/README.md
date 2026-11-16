# Server Data Access (`server/data-access/`)

Lapisan repository untuk membaca dan menulis data operasional ke Cloud Firestore melalui Firebase Admin SDK, serta manajemen `idempotencyKeys` dan cursor pagination.

## Catatan Keamanan

Karena Firebase Admin SDK melewati Firestore Security Rules, seluruh pemeriksaan akses wajib diselesaikan di `server/authorization/` sebelum memanggil repository di direktori ini.
