# Server Authorization (`server/authorization/`)

Penegakan kontrol akses berbasis peran (RBAC) dan kepemilikan objek (*object-level authorization*).

## Peran Sistem

`super_admin`, `ketua_rt`, `sekretaris`, `bendahara`, `keamanan`, `koordinator_gis`, `warga`, `auditor`.

## Aturan Wajib

- Prinsip *deny-by-default* dan *least privilege*.
- Dilarang mempercayai klaim `role`, `ownerUid`, `createdBy`, atau `postedBy` dari request body klien.
- Setiap akses dokumen, transaksi, dan permohonan wajib memeriksa relasi kepemilikan atau cakupan peran.
