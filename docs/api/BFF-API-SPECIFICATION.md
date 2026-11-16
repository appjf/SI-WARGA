# BFF API Specification — GGR-ICMS

**Project:** GGR-ICMS (`RT 06 RW 01, Perum Green Garden Residence, Garut`)  
**Phase:** Phase 5 & Phase 6 Extensions  

---

## 1. Authentication & Session
- `GET /api/v1/health`: BFF health check publik.
- `POST /api/v1/auth/verify`: Verifikasi Firebase ID token (revocation-checked) & resolusi role server-side.
- `GET /api/v1/me`: Profil sesi terverifikasi beserta daftar `permissions` efektif.
- `PATCH /api/v1/me`: Pembaruan `displayName` milik sendiri (tidak menerima perubahan `roles` atau `status` dari klien).

## 2. Residents & Households (WP-6C)
- `GET /api/v1/residents`: Daftar warga (PII masking otomatis oleh server untuk peran non-administratif/non-pengurus inti).
- `POST /api/v1/residents`: Registrasi warga baru dengan validasi keberadaan `houseId`.
- `GET /api/v1/residents/[id]` & `PUT /api/v1/residents/[id]`: Detail & pembaruan profil warga.
- `GET /api/v1/households` & `POST /api/v1/households`: Daftar rumah tangga ter-scope & registrasi unit rumah baru (`households:write`).
- `GET /api/v1/households/[id]` & `PUT /api/v1/households/[id]`: Detail & pembaruan status hunian rumah tangga.

## 3. Finance Ledger (WP-6D)
- `GET /api/v1/finance`: Daftar transaksi kas RT (integer IDR, butuh `finance:read`).
- `POST /api/v1/finance`: Pencatatan pemasukan/pengeluaran idempoten (`finance:write`).
- `POST /api/v1/finance/[transactionId]/approve`: Persetujuan atau penolakan dengan penegakan *Separation of Duties* (`finance:approve`).
- `POST /api/v1/finance/reversal`: Pembatalan akuntansi via jurnal balik (*reversal ledger*).

## 4. Complaints Management (WP-6E)
- `GET /api/v1/complaints` & `POST /api/v1/complaints`: Daftar tiket (ter-scope untuk `WARGA`) & pembuatan tiket baru.
- `GET /api/v1/complaints/[ticketId]`: Detail tiket dan `statusHistory`.
- `PATCH /api/v1/complaints/[ticketId]/status`: Transisi status state-machine, penugasan petugas, dan catatan penyelesaian (`complaints:manage`).

## 5. GIS Proxy & 12-Attribute Spatial Assets (WP-6F)
- `GET /api/v1/gis/{boundaries|houses|roads|drainage|facilities|assets}`: Proxy BFF ke FastAPI GIS / PostGIS (`gis:read`).
- `POST /api/v1/gis/spatial-query`: Proxy BFF query radius buffer spasial (`gis:read`).
- `POST /api/v1/gis/validate-geometry`: Proxy BFF validasi topologi GeoJSON & SRID (`gis:write`).
- `GET /api/v1/spatial-assets` & `POST /api/v1/spatial-assets`: Manajemen repositori 12 atribut aset spasial dengan proyeksi otomatis `EPSG:4326` → `EPSG:32748` (UTM Zone 48S) dan nilai aset integer IDR.
- `GET /api/v1/spatial-assets/[assetId]` & `PATCH /api/v1/spatial-assets/[assetId]`: Detail aset, pencatatan inspeksi lapangan, dan histori perubahan.

## 6. Notifications, Announcements & Reporting (WP-6G, WP-6H, WP-6I)
- `GET /api/v1/notifications`, `POST /api/v1/notifications`, `PATCH /api/v1/notifications/[id]/read`: Notifikasi pengguna & siaran RT.
- `GET /api/v1/announcements` & `POST /api/v1/announcements`: Pengumuman resmi warga/pengurus (ter-scope audiens).
- `GET /api/v1/reports/dashboard`: Ringkasan metrik dashboard adaptif peran.
- `GET /api/v1/reports/analytics`: Laporan analitik multi-modul (keuangan terkunci bila tanpa `finance:read`); `?export=csv|json` mencatat log audit ekspor.
- `GET /api/v1/admin/users` & `PATCH /api/v1/admin/users/[uid]`: Manajemen daftar akun (`users:read`) dan penetapan peran RBAC (`users:manage_roles`).
