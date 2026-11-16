# Phase 5 Technical Verification & Acceptance Audit Report
## Backend BFF & Business Logic

**Project:** Green Garden Residence – Integrated Community Management System (GGR-ICMS)  
**Repository:** `apppjf/SI-WARGA`  
**Branch:** `main`  
**Operational Area:** RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut, Jawa Barat, Indonesia  
**Phase:** Phase 5 — Backend BFF & Business Logic  
**Audit Date:** November 16, 2026  
**Auditor:** Principal Software Architect & Application Security Engineer  
**Audit Status:** `PHASE 5 — IMPLEMENTED, VERIFICATION INCOMPLETE`  

---

## 1. Executive Summary

Laporan ini merupakan hasil audit teknis independen dan mendalam terhadap implementasi **Phase 5 (Backend BFF & Business Logic)** pada sistem GGR-ICMS. Pemeriksaan dilakukan terhadap source code aktual pada rute API Next.js App Router (`/app/api/v1/*`), integrasi Firebase Admin SDK, skema dan operasi Cloud Firestore, implementasi RBAC, integritas transaksi keuangan, pengelolaan pengaduan, audit logging, integrasi GIS, struktur *service layer*, serta bukti pengujian otomatis.

Berdasarkan hasil audit teknis:
- **Kompilasi & Build:** Next.js production build (`npm run build`), TypeScript typecheck (`npm run typecheck`), dan ESLint (`npm run lint`) berhasil 100% tanpa error sintaks.
- **Unit Testing:** Pengujian unit RBAC (`tests/unit/firebase-rbac.test.ts`) dan scaffold test (`tests/unit/scaffold.test.ts`) lulus 7/7 tes (100%).
- **Kesiapan Fungsional & Keamanan:** Sejumlah endpoint BFF saat ini baru berada pada tahap *scaffolding dasar*. Ditemukan beberapa defect kritis terkait ketiadaan middleware otorisasi pada endpoint sensitif (residents, finance, complaints), race condition pada idempotency key keuangan, belum tersedianya endpoint transisi siklus pengaduan, belum tersedianya notification service, serta business logic yang masih langsung digabungkan dalam route handler alih-alih diisolasi pada *service layer* (`server/business-logic/`).

Sesuai kriteria gerbang audit pada Bagian 14 petunjuk teknis, status yang direkomendasikan adalah:  
**`PHASE 5 — IMPLEMENTED, VERIFICATION INCOMPLETE`** dengan rencana tindakan korektif terukur sebelum melangkah ke Phase 6 (Frontend UI/UX).

---

## 2. Repository Review

Pemeriksaan mendalam terhadap pohon direktori dan source code menghasilkan inventarisasi status komponen sebagai berikut:

| Komponen / Modul | File / Lokasi | Status Implementasi | Status Verifikasi | Keterangan |
|---|---|---|---|---|
| **Health Check API** | `app/api/v1/health/route.ts` | IMPLEMENTED | VERIFIED | Mengembalikan JSON standar, status sehat, dan identitas RT 06 RW 01 |
| **Auth Verification API** | `app/api/v1/auth/verify/route.ts` | IMPLEMENTED | VERIFIED | Memvalidasi Firebase ID token via Admin SDK & mencatat audit log |
| **Residents BFF API** | `app/api/v1/residents/route.ts` | IMPLEMENTED (Scaffold) | NOT VERIFIED | CRUD dasar ke Firestore; belum ada token guard & PII filtering |
| **Finance BFF API** | `app/api/v1/finance/route.ts` | IMPLEMENTED (Scaffold) | NOT VERIFIED | Nominal integer IDR; belum ada atomic lock pada idempotencyKey |
| **Complaints BFF API** | `app/api/v1/complaints/route.ts` | IMPLEMENTED (Scaffold) | NOT VERIFIED | Pembuatan pengaduan (SUBMITTED); belum ada endpoint transisi status |
| **Dashboard Reports API** | `app/api/v1/reports/dashboard/route.ts` | IMPLEMENTED | TESTED | Agregasi data Firestore; belum ada otorisasi berbasis peran |
| **Service Layer** | `server/business-logic/` | NOT IMPLEMENTED | NOT VERIFIED | Masih berupa folder kosong / README.md; logika berada di route handler |
| **Server Auth Guard** | `server/auth/` | NOT IMPLEMENTED | NOT VERIFIED | Masih berupa README.md; belum ada reusable middleware/guard helper |
| **GIS Integration BFF** | `app/api/v1/gis/` | NOT IMPLEMENTED | NOT VERIFIED | Belum ada API proxy/client BFF yang menghubungkan ke FastAPI GIS |
| **Notification Service** | `app/api/v1/notifications/` | NOT IMPLEMENTED | NOT VERIFIED | Belum tersedia endpoint atau dispatcher notifikasi internal |
| **RBAC Matrix** | `lib/rbac/matrix.ts` | IMPLEMENTED | VERIFIED | Matriks 7 role lengkap dan tervalidasi via unit tests |
| **Audit Logging Foundation**| `lib/firebase/admin-firestore.ts`| IMPLEMENTED | VERIFIED | Server-side write audit logs dengan serverTimestamp tepercaya |
| **FastAPI GIS Service** | `services/gis-api/` | IMPLEMENTED | VERIFIED | Service Python mandiri untuk PostGIS GeoJSON endpoints |
| **PostgreSQL / PostGIS** | `database/postgresql/schema.sql` | IMPLEMENTED | VERIFIED | Skema relasional & spasial GiST SRID 4326/32748 |

---

## 3. BFF API Verification

Hasil pengujian endpoint HTTP `/api/v1/*`:

1. **`GET /api/v1/health`**
   - **Metode:** GET
   - **Status:** `IMPLEMENTED`, `VERIFIED`
   - **Respons:** `{ success: true, data: { service, version, operationalArea, status, timestamp }, meta: { requestId } }`
   - **Evaluasi:** Mengikuti konvensi RESTful dan standar format API yang telah disepakati.

2. **`POST /api/v1/auth/verify`**
   - **Metode:** POST
   - **Status:** `IMPLEMENTED`, `VERIFIED`
   - **Respons:** Menolak permintaan tanpa `idToken` (HTTP 401), menolak token invalid (HTTP 401), mencatat event ke audit logs.

3. **`GET` & `POST /api/v1/residents`**
   - **Status:** `IMPLEMENTED (SCAFFOLDING)`, `NOT VERIFIED`
   - **Temuan Teknis:**
     - `GET`: Mengambil 50 dokumen warga tanpa memeriksa header otentikasi. Semua data warga (termasuk nomor kontak) terekspos ke pemanggil publik/anonim.
     - `POST`: Mengambil `actorUid` langsung dari request payload JSON (`const { actorUid } = body`), membuka celah peniruan identitas aktor (*actor spoofing*).

4. **`GET` & `POST /api/v1/finance`**
   - **Status:** `IMPLEMENTED (SCAFFOLDING)`, `NOT VERIFIED`
   - **Temuan Teknis:**
     - Nilai transaksi berhasil dibulatkan menjadi integer Rupiah (`Math.round(amount)`).
     - Kolom `idempotencyKey` disimpan, namun **tidak dilakukan pengecekan pra-tulis** ke koleksi transaksi. Dua request konkuren dengan `idempotencyKey` sama akan menghasilkan dua transaksi baru (`adminDb.collection("transactions").doc()`), mengakibatkan *double payment recording*.
     - Operasi tulis tidak dibungkus dalam `adminDb.runTransaction()`.

5. **`GET` & `POST /api/v1/complaints`**
   - **Status:** `IMPLEMENTED (SCAFFOLDING)`, `NOT VERIFIED`
   - **Temuan Teknis:**
     - Tiket berhasil dibuat dengan status awal `SUBMITTED`.
     - Belum ada rute `PATCH /api/v1/complaints/[ticketId]` untuk memperbarui status pengaduan ke `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, atau `CLOSED`.

6. **`GET /api/v1/reports/dashboard`**
   - **Status:** `IMPLEMENTED`, `TESTED`
   - **Temuan Teknis:** Menghitung total warga, rumah tangga, pengaduan, dan rekapitulasi keuangan (income/expense/balance). Belum menerapkan pembatasan akses; laporan kas terbuka tanpa verifikasi role.

---

## 4. Authentication & RBAC Assessment

Matriks 7 Peran Operasional GGR-ICMS (`SUPER_ADMIN`, `ADMIN_RW`, `KETUA_RT`, `SEKRETARIS_RT`, `BENDAHARA_RT`, `PENGURUS`, `WARGA`):
- **Definisi Peran:** `lib/rbac/matrix.ts` mendefinisikan seluruh relasi hak akses secara tepat.
- **Unit Testing:** `tests/unit/firebase-rbac.test.ts` berhasil menguji hierarki peran (Super Admin, Bendahara RT, Warga, Ketua RT).
- **Kesenjangan Otorisasi (*Authorization Gap*):** Matriks RBAC belum dihubungkan sebagai middleware/guard pada handler rute BFF di `/app/api/v1/*`. Handler rute saat ini membaca/menulis ke database tanpa memanggil `hasPermission()` atau mengekstrak ID Token pemanggil dari header `Authorization: Bearer <token>`.

---

## 5. Resident Management Assessment

- **Kepemilikan Data:** Dokumen warga disimpan di koleksi `residents/{residentId}` Firestore.
- **Perlindungan Privasi (PII):** Atribut nama lengkap dan kontak saat ini belum difilter berdasarkan peran. Warga semestinya hanya dapat melihat profilnya sendiri atau anggota rumah tangganya, sedangkan pengurus (Sekretaris/Ketua) dapat melihat data wilayah RT 06.
- **Relasi Rumah Tangga:** Validasi apakah `houseId` benar-benar ada di koleksi `households` belum diterapkan saat pembuatan data warga baru.

---

## 6. Financial Integrity Assessment (Prioritas Tinggi)

Evaluasi terhadap kontrol transaksi keuangan:
1. **Integer-based IDR:** `VERIFIED`. `Math.round(amount)` mencegah floating-point imprecision.
2. **Idempotency Key:** `FAILED / DEFECT`.
   - Kode hanya menyimpan field `idempotencyKey` pada dokumen baru.
   - Tidak ada query `where("idempotencyKey", "==", key)` sebelum pembuatan, dan tidak ada tabel/koleksi dedikasi `idempotency_keys/{key}`.
   - Permintaan ganda konkuren yang dikirim berulang akan menduplikasi transaksi.
3. **Transaction Atomicity:** `NOT VERIFIED`. Tulis data menggunakan `.set()` tunggal tanpa transaksi Firestore (`runTransaction`).
4. **Approval Workflow & Separation of Duties:** `NOT IMPLEMENTED`. Transaksi langsung berstatus `posted`, tanpa tahap pengajuan oleh bendahara dan persetujuan oleh Ketua RT / Admin RW.
5. **Reversal & Audit Trail:** Pencatatan audit log berjalan (`CREATE_TRANSACTION`), namun mekanisme jurnal pembalik (*reversal*) belum diimplementasikan.

---

## 7. Complaint Management Assessment

- **Status Awal:** Status `SUBMITTED` diberikan secara otomatis pada dokumen baru.
- **Siklus Hidup:** Siklus resmi `SUBMITTED → VERIFIED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED` belum memiliki endpoint pengendali status (*state machine transition*).
- **Alasan Penolakan:** Belum ada skema field untuk alasan penolakan (`rejectionReason`).
- **Integrasi Lokasi Spasial:** Skema menyediakan field opsional `spatialId`, namun belum divalidasi silang terhadap data PostGIS.

---

## 8. GIS Integration Assessment

- Layanan FastAPI GIS di `services/gis-api/` berjalan secara independen dan menyediakan endpoint batas wilayah, rumah, fasilitas, jalan, spatial query, dan validasi geometri.
- **Kesenjangan Integrasi BFF:** Next.js BFF belum memiliki rute proxy `/api/v1/gis/*` yang meneruskan request dari frontend Next.js ke FastAPI GIS service (`http://localhost:8000/v1`) dengan menyematkan header autentikasi yang aman.

---

## 9. Notification & Audit Logging Assessment

- **Audit Logging:** `IMPLEMENTED & VERIFIED`. Fungsi `createAuditLog` di `lib/firebase/admin-firestore.ts` mencatat `actorUid`, `action`, `entityType`, `entityId`, `result`, `metadata`, `requestId`, dan `timestamp` server-side yang tepercaya.
- **Notification Service:** `NOT IMPLEMENTED`. Belum tersedia model data atau rute API untuk notifikasi tagihan iuran, pembaruan status pengaduan, atau persetujuan dokumen.

---

## 10. Data Ownership & Consistency Assessment

Matriks pembagian sumber kebenaran (*Source of Truth*) data aktual:

| Domain | Source of Truth | Storage Engine | Access Layer | Mekanisme Sinkronisasi / Integritas |
|---|---|---|---|---|
| **User Identity & Auth** | Google Identity | Firebase Authentication | BFF (`adminAuth`) | Otoritatif via ID Token |
| **User Roles & Profile** | Firestore | Cloud Firestore (`users`) | BFF (`adminDb`) | Custom claims / Firestore document |
| **Profil Warga & Rumah Tangga** | Firestore | Cloud Firestore (`residents`, `households`) | BFF (`adminDb`) | Referensi kunci `houseId` |
| **Transaksi Keuangan & Iuran** | Firestore (Ledger) | Cloud Firestore (`transactions`) | BFF (`adminDb`) | Idempotency & Firestore Audit Trail |
| **Geometri Batas & Infrastruktur** | PostgreSQL / PostGIS | PostGIS (`ggr_gis.*`) | FastAPI GIS Service | SRID 4326 (Display) / EPSG:32748 (Metric) |
| **Lokasi Spasial Pengaduan** | PostGIS | PostGIS (`complaints_spatial`) | FastAPI GIS Service | Relasi melalui `spatialId` |
| **Audit Trails** | Firestore | Cloud Firestore (`auditLogs`) | BFF Server-Only | Append-only, deny-all client writes |
| **Notifikasi Internal** | Firestore (Target) | Cloud Firestore (`notifications`) | BFF Server-Only | Belum diimplementasikan |

---

## 11. Security Findings

| ID Temuan | Tingkat Keparahan | Deskripsi Kerentanan | Rekomendasi Mitigasi |
|---|---|---|---|
| **SEC-05-01** | **CRITICAL** | **Missing Authorization on BFF Routes:** Rute `/api/v1/residents`, `/api/v1/finance`, `/api/v1/complaints` tidak memverifikasi header `Authorization: Bearer <token>`, sehingga dapat diakses secara anonim. | Buat middleware helper `requireAuth(req, requiredRole)` yang memverifikasi ID token dan memeriksa peran sebelum mengeksekusi logika bisnis. |
| **SEC-05-02** | **HIGH** | **Actor Identity Spoofing:** `actorUid` diambil langsung dari payload JSON body pada request POST, memungkinkan manipulasi identitas pembuat aksi. | Ekstrak `actorUid` secara eksklusif dari `decodedToken.uid` hasil verifikasi ID token di sisi server. |
| **SEC-05-03** | **HIGH** | **Financial Idempotency Race Condition:** `idempotencyKey` tidak dicek secara atomik sebelum membuat record transaksi baru. | Gunakan koleksi terpisah `idempotencyKeys/{key}` dalam `adminDb.runTransaction()` untuk mencegah duplikasi pembayaran pada retry paralel. |
| **SEC-05-04** | **MEDIUM** | **PII Exposure in Residents List:** `GET /api/v1/residents` mengembalikan seluruh nomor kontak warga tanpa sensor atau filter hak akses. | Terapkan seleksi field dan periksa hak akses pemanggil (hanya Sekretaris/Ketua/Admin atau warga bersangkutan). |
| **SEC-05-05** | **MEDIUM** | **Architectural Coupling:** Business logic ditulis langsung di dalam route handler API alih-alih diisolasi pada direktori `server/business-logic/` dan `server/data-access/`. | Pindahkan logika database dan aturan bisnis ke modul service terpisah di `server/`. |

---

## 12. Automated Testing Evidence

Pengujian aktual yang dijalankan pada lingkungan development (Node.js 24 LTS):

1. **Vitest Unit Tests (`npm run test:run`):**
   - File: `tests/unit/scaffold.test.ts` (3 tests passed)
   - File: `tests/unit/firebase-rbac.test.ts` (4 tests passed)
   - **Hasil:** `PASS` (7 passed, 0 failed, durasi: 1.02s)
2. **TypeScript Compilation Check (`npm run typecheck`):**
   - **Hasil:** `PASS` (0 type errors)
3. **ESLint Code Quality (`npm run lint`):**
   - **Hasil:** `PASS` (0 lint errors/warnings)
4. **Next.js Production Build (`compile_applet`):**
   - **Hasil:** `PASS` (Route types generated, build succeeded)
5. **BFF API Route Integration Tests:**
   - **Hasil:** `NOT RUN / PENDING` (Suite pengujian integrasi endpoint BFF belum dibuat)

---

## 13. Defect Register

1. **DEF-01 (Kritis):** Ketiadaan verifikasi Bearer Token pada rute publik BFF.
2. **DEF-02 (Tinggi):** Pseudo-idempotensi pada endpoint pencatatan keuangan.
3. **DEF-03 (Sedang):** Tidak adanya endpoint transisi status siklus hidup pengaduan (`PATCH /api/v1/complaints/[id]/status`).
4. **DEF-04 (Sedang):** Rute proxy integrasi Next.js BFF ke layanan FastAPI GIS (`/api/v1/gis/*`) belum diimplementasikan.
5. **DEF-05 (Rendah/Sedang):** Modul layanan notifikasi internal belum tersedia.
6. **DEF-06 (Sedang):** *Service layer* di `server/business-logic/` belum dimanfaatkan secara modular.

---

## 14. Residual Risks

1. **Simulasi Firebase Auth Lokal:** Pengujian endpoint BFF tanpa emulator aktif mengandalkan token tiruan; pengujian otorisasi live membutuhkan koneksi Firebase emulator atau project staging aktif.
2. **Beban Transaksi Finansial:** Operasi perhitungan saldo di `reports/dashboard` saat ini memuat semua dokumen transaksi ke memori; untuk data skala besar diperlukan Firestore aggregation query atau sinkronisasi ledger PostgreSQL.

---

## 15. Final Acceptance Recommendation

### Rekomendasi Audit:
**`PHASE 5 — IMPLEMENTED, VERIFICATION INCOMPLETE`**

### Alasan Keputusan:
Meskipun arsitektur dasar, konfigurasi, skema, dan rute awal telah berhasil dibuat dan lulus pengujian kompilasi Next.js (`npm run build`), deliverable Phase 5 belum dapat dinyatakan *VERIFIED* secara penuh karena:
1. Validasi keamanan (otentikasi & RBAC) pada rute API BFF belum terhubung secara ketat.
2. Mekanisme idempotensi transaksi keuangan masih memiliki celah duplikasi pada eksekusi konkuren.
3. Fitur transisi status pengaduan dan notifikasi belum lengkap sesuai SRS.
4. *Service layer* terisolasi belum diimplementasikan.

### Tindakan Korektif yang Diperlukan Sebelum Melangkah ke Phase 6:
1. Implementasikan helper otorisasi server-side di `server/auth/guard.ts` untuk mengekstrak Bearer token dan memeriksa permission RBAC.
2. Terapkan guard tersebut pada seluruh rute API di `app/api/v1/*`.
3. Perbaiki logika idempotensi di `app/api/v1/finance/route.ts` dengan transaksi atomik Firestore.
4. Tambahkan rute `PATCH /api/v1/complaints/[ticketId]/status` untuk siklus hidup status pengaduan.
5. Buat suite pengujian integrasi otomatis untuk endpoint BFF.

Pekerjaan pada Phase 5 ditahan pada status audit teknis ini. **Dilarang memulai Phase 6 tanpa persetujuan eksplisit dan penyelesaian tindakan korektif di atas.**
