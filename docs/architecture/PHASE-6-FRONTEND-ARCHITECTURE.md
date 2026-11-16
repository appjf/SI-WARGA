# Phase 6 — Frontend UI/UX & BFF Integration Architecture

**Project:** Green Garden Residence – Integrated Community Management System (GGR-ICMS)  
**Operational Area:** RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut, Jawa Barat, Indonesia.  
**Status:** Implemented & Verified (Phase 6)

---

## 1. Architectural Principles

1. **Zero Direct Database Access from Browser:** Seluruh komunikasi data kependudukan, rumah tangga, keuangan, pengaduan, notifikasi, pengumuman, analitik, dan aset spasial melalui **Next.js BFF (`/api/v1/*`)**. Browser tidak pernah mengimpor `firebase-admin` maupun terhubung langsung ke PostgreSQL/PostGIS.
2. **Server-Authoritative RBAC:** Navigasi UI (`lib/rbac/navigation.ts`) dan visibilitas aksi (`useAuth().can()`) disinkronkan dengan `lib/rbac/matrix.ts` untuk kenyamanan UX, namun seluruh penegakan otorisasi dan PII masking tetap dieksekusi di server melalui `requireAuth`, `requirePermission`, dan `requireAnyRole`.
3. **Human-Centered Civic Ledger Design System:** Menggunakan palet hijau botani (`#1F5E4A`), latar kanvas hangat (`#F7F8F6`), tipografi `Plus Jakarta Sans` + `DM Sans` + `JetBrains Mono` (`tabular-nums`), status ikon+teks unboxed (`StatusText`), serta kepatuhan penuh terhadap aksesibilitas (`WCAG 2.2`, keyboard navigation, focus ring, dan tampilan tabel alternatif untuk peta GIS).

---

## 2. Frontend Module Structure

| Work Package | Directory / Route | Responsibility |
|---|---|---|
| **WP-6A** | `app/globals.css`, `app/layout.tsx`, `components/ui/*`, `layouts/PublicShell.tsx`, `layouts/AppShell.tsx` | Design tokens, shell responsif (desktop sidebar + mobile bottom bar), tabel data, modal konfirmasi, toast, chart, dan error boundary. |
| **WP-6B** | `components/providers/AuthProvider.tsx`, `app/login/page.tsx`, `app/unauthorized/page.tsx`, `app/(workspace)/profile/page.tsx` | Autentikasi Firebase (Google & Email/Password), sinkronisasi token ke `/api/v1/auth/verify` & `/api/v1/me`, profil & hak akses. |
| **WP-6C** | `features/residents/ResidentsWorkspace.tsx`, `app/(workspace)/residents/page.tsx` | Direktori warga & rumah tangga, registrasi, verifikasi, detail & PII masking sesuai peran. |
| **WP-6D** | `features/finance/FinanceWorkspace.tsx`, `app/(workspace)/finance/page.tsx` | Buku kas integer IDR, pencatatan idempoten, workflow approval berjenjang (SoD), reversal ledger. |
| **WP-6E** | `features/complaints/ComplaintsWorkspace.tsx`, `app/(workspace)/complaints/page.tsx` | Pengajuan aduan, detail & riwayat transisi status, penugasan petugas, penyelesaian. |
| **WP-6F** | `features/gis/InteractiveGisMap.tsx`, `features/gis/GisWorkspace.tsx`, `app/(workspace)/gis/page.tsx` | Peta vektor interaktif 6 layer (`boundaries`, `houses`, `roads`, `drainage`, `facilities`, `assets`), query buffer radius, validator geometri, & manajemen 12 atribut aset spasial (`EPSG:4326` & `EPSG:32748` UTM Zone 48S). |
| **WP-6G** | `features/notifications/NotificationsWorkspace.tsx`, `app/(workspace)/notifications/page.tsx` | Pusat notifikasi pribadi/siaran, mark-as-read, dan papan pengumuman resmi RT 06. |
| **WP-6H** | `features/dashboard/role-config.ts`, `features/dashboard/DashboardWorkspace.tsx`, `app/(workspace)/admin/users/page.tsx` | Dashboard adaptif untuk 7 peran (`SUPER_ADMIN`, `ADMIN_RW`, `KETUA_RT`, `SEKRETARIS_RT`, `BENDAHARA_RT`, `PENGURUS`, `WARGA`) & manajemen peran pengguna. |
| **WP-6I** | `features/reports/ReportsWorkspace.tsx`, `app/(workspace)/reports/page.tsx` | Visualisasi analitik kependudukan, keuangan (terproteksi `finance:read`), pengaduan, aset, dan ekspor CSV/JSON dengan audit log. |
| **WP-6J** | `tests/unit/phase6-frontend.test.ts`, `tests/integration/phase6-bff-routes.test.ts` | Pengujian unit RBAC UI, kalkulasi geodetik UTM 48S, validasi skema, serta integrasi route BFF baru. |
