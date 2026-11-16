# Inventaris Dependency & Laporan Instalasi (Phase 2)

- **Proyek:** Green Garden Residence – Integrated Community Management System (GGR-ICMS)
- **Package Manager:** `npm` (`10.9.8`)
- **Lockfile Resmi:** `package-lock.json` (1.181 paket terkunci, termasuk dependensi transitif)
- **Tanggal Verifikasi:** 2026-11-15

---

## 1. Inventaris Runtime Dependencies (`dependencies`)

| Paket | Range (`package.json`) | Versi Terkunci | Unpacked Size | Lisensi | Fungsi & Status |
|---|---|---|---:|---|---|
| `@google/genai` | `^2.4.0` | `2.32.0` | — | Apache-2.0 | SDK Gemini server-side (bawaan platform; tidak aktif di Phase 2) |
| `@hookform/resolvers` | `^5.2.1` | `5.9.2` | — | MIT | Adapter validasi schema (`zod`) untuk `react-hook-form` |
| `autoprefixer` | `^10.4.21` | `10.6.2` | — | MIT | Vendor prefix CSS PostCSS |
| `class-variance-authority` | `^0.7.1` | `0.7.1` | — | Apache-2.0 | Utilitas varian kelas komponen UI |
| `clsx` | `^2.1.1` | `2.1.1` | — | MIT | Penggabungan nama kelas kondisional |
| `firebase` | `^13.3.0` | `13.3.0` | 39,76 MB | Apache-2.0 | Firebase Web SDK (dipasang & dikunci; belum diaktifkan hingga Phase 3) |
| `firebase-admin` | `^14.5.1` | `14.5.1` | 1,43 MB | Apache-2.0 | Firebase Admin SDK server-side (dipasang & dikunci; belum diaktifkan hingga Phase 3) |
| `lucide-react` | `^0.553.0` | `0.553.0` | — | ISC | Pustaka ikon standar UI |
| `motion` | `^12.23.24` | `12.43.0` | — | MIT | Pustaka animasi UI React |
| `next` | `^15.4.9` | `15.5.29` | — | MIT | Framework aplikasi web Next.js App Router |
| `postcss` | `^8.5.6` | `8.5.33` | — | MIT | Pipeline pemrosesan CSS |
| `react` | `^19.2.1` | `19.3.1` | — | MIT | Pustaka inti antarmuka React |
| `react-dom` | `^19.2.1` | `19.3.1` | — | MIT | Renderer DOM React |
| `react-hook-form` | `^7.92.0` | `7.92.0` | 1,68 MB | MIT | Pengelolaan state formulir berkinerja ringan |
| `server-only` | `^0.0.1` | `0.0.1` | 611 B | MIT | Penjaga batas kompilasi agar modul `server/` tidak terbawa ke client bundle |
| `tailwind-merge` | `^3.3.1` | `3.7.0` | — | MIT | Resolusi konflik kelas utilitas Tailwind |
| `zod` | `^4.6.7` | `4.6.7` | 6,15 MB | MIT | Validasi skema payload API & formulir berbasis TypeScript |

---

## 2. Inventaris Development Dependencies (`devDependencies`)

| Paket | Range (`package.json`) | Versi Terkunci | Unpacked Size | Lisensi | Fungsi & Status |
|---|---|---|---:|---|---|
| `@tailwindcss/postcss` | `4.1.11` | `4.1.11` | — | MIT | Plugin PostCSS untuk Tailwind CSS v4 |
| `@tailwindcss/typography` | `^0.5.19` | `0.5.20` | — | MIT | Utilitas tipografi konten teks |
| `@types/node` | `^22` | `22.20.5` | — | MIT | Definisi tipe Node.js 22 LTS (diselaraskan dari `^20`) |
| `@types/react` | `^19` | `19.3.0` | — | MIT | Definisi tipe TypeScript untuk React 19 |
| `@types/react-dom` | `^19` | `19.3.0` | — | MIT | Definisi tipe TypeScript untuk React DOM 19 |
| `eslint` | `9.39.1` | `9.39.1` | — | MIT | Linter utama menggunakan Flat Config (`eslint.config.mjs`) |
| `eslint-config-next` | `16.0.8` | `16.0.8` | — | MIT | Aturan lint resmi Next.js + React Hooks + Core Web Vitals |
| `firebase-tools` | `^15.0.0` | `15.36.0` | — | MIT | CLI & emulator Firebase lokal (bawaan workspace) |
| `tailwindcss` | `4.1.11` | `4.1.11` | — | MIT | Framework CSS utilitas v4 |
| `tw-animate-css` | `^1.4.0` | `1.4.0` | — | MIT | Utilitas animasi CSS untuk Tailwind v4 |
| `typescript` | `5.9.3` | `5.9.3` | — | Apache-2.0 | Kompiler & typechecker TypeScript strict mode |
| `vitest` | `^5.1.0` | `5.1.0` | 2,88 MB | MIT | Test runner unit dan integration berbasis ESM/TypeScript |

---

## 3. Paket yang Ditunda ke Tahap Berikutnya

| Kategori | Kandidat Paket | Tahap Target | Alasan Penundaan |
|---|---|---|---|
| GIS Web Map | `leaflet` / `maplibre-gl` | Tahap 7 | Keputusan final renderer & integrasi API GIS dilakukan pada Tahap 7 |
| Google Drive SDK | `googleapis` | Tahap 8 | Ukuran dependensi besar; hanya dibutuhkan saat modul dokumen backend dibangun |
| E2E Browser Testing | `@playwright/test` | Tahap 9 | Binary browser besar; efektif setelah alur UI warga & pengurus tersedia |
| Primitif UI Kompleks | `@radix-ui/*` | Tahap 6 | Dipasang selektif sesuai komponen interaktif yang benar-benar diperlukan |

---

## 4. Ringkasan Verifikasi Instalasi & Build

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Dependency tree | `npm ls --depth=0` | Sukses (seluruh 29 direct dependency terpasang tanpa missing/extraneous error) |
| TypeScript check | `npm run typecheck` | Lulus (0 error) |
| ESLint Flat Config | `npm run lint` | Lulus (0 error, 0 warning) |
| Unit test runner | `npm run test:run` | Lulus (`1 file, 3 tests passed` pada `tests/unit/scaffold.test.ts`, 0 warning Vite ESM setelah `vitest.config.mts`) |
| Production build | `npm run build` | Lulus (`Build succeeded`) |
