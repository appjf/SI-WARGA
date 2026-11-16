# ADR-002: Standarisasi Package Manager (`npm`), ESLint 9 Flat Config, dan Evaluasi Dependency (Phase 2)

- **Tanggal:** 2026-11-15
- **Status:** Accepted *(Catatan: bagian target runtime & `@types/node` diperbarui oleh [ADR-004](./ADR-004-nodejs-runtime-standardization.md) ke Node.js 24 LTS)*
- **Terkait:** [ADR-001](./ADR-001-phase1-stack-and-repo-structure.md), [ADR-004](./ADR-004-nodejs-runtime-standardization.md)

---

## 1. Konteks

Pada awal Phase 2 ditemukan beberapa ketidakselarasan lingkungan:
1. Repository memiliki `bun.lock` bawaan template, sedangkan standar CI (`web-ci.yml`) dan blueprint proyek menetapkan `npm` dan `package-lock.json`.
2. Repository memiliki dua konfigurasi ESLint (`.eslintrc.json` legacy dan `eslint.config.mjs` ESLint 9 Flat Config).
3. `@types/node` terpasang pada `^20` sedangkan runtime Node.js aktual adalah `v22.23.2` (LTS) dan `vitest@5.1.0` mensyaratkan `@types/node@^22.0.0 || >=24.0.0`.
4. Diperlukan evaluasi selektif terhadap 12 kategori dependency agar hanya paket yang dibutuhkan secara teknis yang dikunci pada Phase 2, tanpa mengaktifkan layanan Firebase, GIS, maupun integrasi eksternal.

## 2. Keputusan

### A. Package Manager & Lockfile
- Menetapkan **`npm` (`10.9.8`)** sebagai satu-satunya package manager resmi dan **`package-lock.json`** (1.181 paket terkunci) sebagai lockfile tunggal.
- Menghapus `bun.lock` untuk mencegah konflik resolusi versi antara pengembangan lokal dan GitHub Actions (`npm ci`).

### B. Linting & TypeScript
- Menggunakan **ESLint `9.39.1`** dengan **Flat Config** (`eslint.config.mjs`) dan menghapus file legacy `.eslintrc.json` yang tidak terpakai oleh ESLint 9.
- Menjaga TypeScript `5.9.3` dengan `strict: true` dan memperbarui `@types/node` ke `22.20.5` (`^22`) agar selaras dengan runtime Node.js `v22.23.2`.

### C. Seleksi Dependency Phase 2 (Dipasang vs Ditunda)

| Kategori | Keputusan Phase 2 | Paket & Versi Terkunci | Alasan Teknis |
|---|---|---|---|
| Next.js & React | Dipertahankan | `next@15.5.29`, `react@19.3.1`, `react-dom@19.3.1` | Runtime utama aplikasi App Router |
| TypeScript | Dipertahankan + Diselaraskan | `typescript@5.9.3`, `@types/node@22.20.5`, `@types/react@19.3.0`, `@types/react-dom@19.3.0` | Strict mode & selaras Node 22 LTS |
| Code Quality & Lint | Dipertahankan + Dibersihkan | `eslint@9.39.1`, `eslint-config-next@16.0.8` | Flat Config ESLint 9 aktif |
| Schema Validation | **Dipasang** | `zod@4.6.7` | Validasi payload API & kontrak skema; kompatibel dengan `@hookform/resolvers@5.9.2` |
| Form Management | **Dipasang** | `react-hook-form@7.92.0` | Memenuhi peer dependency `@hookform/resolvers` & siap untuk formulir Tahap 5–6 |
| Firebase SDK & Admin | **Dipasang (Non-Aktif)** | `firebase@13.3.0`, `firebase-admin@14.5.1`, `server-only@0.0.1` | Mengunci versi & audit keamanan sebelum aktivasi di Phase 3; `server-only` mencegah kebocoran Admin SDK ke client bundle |
| UI Component System | Dipertahankan (Minimal) | `tailwindcss@4.1.11`, `lucide-react@0.553.0`, `class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@3.7.0`, `motion@12.43.0` | Primitif Radix/shadcn ditunda ke Phase 6 sesuai kebutuhan UI nyata |
| Data Fetching | Tidak perlu paket baru | Native `fetch` + Server Components | Sesuai pola `07-APPLICATION-STARTER.md` tanpa overhead bundle |
| Unit & Integration Testing | **Dipasang** | `vitest@5.1.0` | Test runner ringan ESM/TypeScript untuk skrip `npm test` di CI |
| GIS Visualization | **Ditunda (Phase 7)** | `leaflet` / `maplibre-gl` | Pilihan final Leaflet vs MapLibre menunggu kesiapan layer & keputusan Phase 7 |
| End-to-End Testing | **Ditunda (Phase 9)** | `@playwright/test` | Menghindari unduhan binary browser >300MB sebelum rute MVP tersedia |
| Google Drive Integration | **Ditunda (Phase 8)** | `googleapis` | Ukuran paket besar; baru dibutuhkan saat implementasi upload/download Phase 8 |

## 3. Konsekuensi & Risiko

- **Positif:** `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:run`, dan `npm run build` berjalan deterministik dan hijau pada Node 22 LTS.
- **Catatan Risiko:** Sub-paket `firebase@13.3.0` (`@firebase/app@0.16.6`, dll.) mendeklarasikan `engines.node >= 24.12.0` sehingga memunculkan `npm warn EBADENGINE` pada Node `v22.23.2`. Peninjauan upgrade runtime ke Node 24 LTS atau evaluasi sebelum aktivasi Phase 3 dicatat sebagai tindak lanjut terbuka.
