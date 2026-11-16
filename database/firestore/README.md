# Cloud Firestore (`database/firestore/`)

Dokumentasi model dokumen, composite indexes, dan Security Rules (baseline *deny-by-default*) untuk data operasional GGR-ICMS.

## Koleksi Utama (Mengacu Dokumen 03 & 04)

`users`, `residents` / `residentProfiles`, `households`, `houses`, `adminRequests` / `serviceRequests`, `documents`, `transactions` / `financeTransactions`, `financeCategories`, `financePeriods`, `complaints`, `announcements`, `events`, `assets`, `notifications`, `auditLogs` / `auditEvents`, dan `idempotencyKeys`.

*Catatan: Penamaan final koleksi perlu diselaraskan pada keputusan pra-implementasi.*
