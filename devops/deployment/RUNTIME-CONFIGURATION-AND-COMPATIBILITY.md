# Runtime Configuration & Compatibility Report (Node.js 24 LTS)

Dokumen ini merupakan acuan operasional untuk **GGR-ICMS (RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut)** sesuai [ADR-004](../../docs/architecture/ADR-004-nodejs-runtime-standardization.md).

---

## 1. Runtime Compatibility Matrix

Audit dilakukan terhadap seluruh **1.181 paket terkunci** di `package-lock.json` menggunakan `semver.satisfies` terhadap target minimum `24.12.0` dan versi pin `.nvmrc` `24.15.0`.

| Paket | Kategori | Versi Terkunci | Deklarasi `engines.node` | Kompatibilitas `24.12.0` | Kompatibilitas `24.15.0` | Batasan Runtime / Catatan |
|---|---|---|---|---|---|---|
| `next` | Framework Web & BFF | `15.5.29` | `^18.18.0 \|\| ^19.8.0 \|\| >= 20.0.0` | Kompatibel | Kompatibel | App Router + `output: 'standalone'` |
| `react` / `react-dom` | UI Runtime | `19.3.1` | `>=0.10.0` / `—` | Kompatibel | Kompatibel | React 19 |
| `firebase` | Client SDK (Non-aktif) | `13.3.0` (`@firebase/*`) | `>=24.12.0` (sub-paket `@firebase/*`) | Kompatibel | Kompatibel | Khusus client/browser (`lib/firebase/client.ts` pada Phase 3) |
| `firebase-admin` | Admin SDK (Non-aktif) | `14.5.1` | `>=22` | Kompatibel | Kompatibel | Khusus server **Node.js runtime**; wajib diimpor bersama `server-only` (bukan Edge) |
| `server-only` | Boundary Guard | `0.0.1` | `—` | Kompatibel | Kompatibel | Mencegah kebocoran modul server ke client bundle |
| `zod` | Schema Validation | `4.6.7` | `—` | Kompatibel | Kompatibel | Runtime-agnostic (server & client) |
| `react-hook-form` | Form Management | `7.92.0` | `>=18.0.0` | Kompatibel | Kompatibel | Client components |
| `@hookform/resolvers` | Resolver Zod | `5.9.2` | `—` | Kompatibel | Kompatibel | Client components |
| `typescript` | Compiler / Typecheck | `5.9.3` | `>=14.17` | Kompatibel | Kompatibel | `strict: true` |
| `@types/node` | Node.js Type Defs | `24.19.2` (`^24`) | `—` | Kompatibel | Kompatibel | Diselaraskan dari `^22` ke seri 24 |
| `vitest` | Test Runner | `5.1.0` | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` | Kompatibel | Kompatibel | ESM via `vitest.config.mts` |
| `eslint` / `eslint-config-next` | Linter | `9.39.1` / `16.0.8` | `^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0` | Kompatibel | Kompatibel | ESLint 9 Flat Config (`eslint.config.mjs`) |
| `tailwindcss` | CSS Engine | `4.1.11` | `—` | Kompatibel | Kompatibel | Tailwind CSS v4 |
| `firebase-tools` | Dev CLI (Non-aktif) | `15.36.0` | `>=20.0.0 \|\| >=22.0.0 \|\| >=24.0.0` | Catatan transitif | Kompatibel | 6 sub-paket transitif mensyaratkan `^24.15.0` (lihat di bawah) |

### Temuan Dependensi Transitif (`24.12.0` vs `24.15.0`)

Pada evaluasi persis `24.12.0`, terdapat 6 paket transitif di bawah `firebase-tools@15.36.0` yang mendeklarasikan `engines.node: ^22.22.2 || ^24.15.0 || >=26.0.0`:
- `abbrev@5.0.0`
- `node-gyp@13.1.0`
- `node-gyp/node_modules/which@7.0.0`
- `nopt@10.0.1`
- `proc-log@7.0.0`
- `re2@1.27.1`

Pada **`24.15.0`** (nilai `.nvmrc`) serta seluruh versi Node 24.15+, **0 dari 1.181 paket** mengalami ketidakcocokan engine.

---

## 2. Environment Compatibility Report

| Lingkungan | Versi Node.js | Peran Resmi | Status Validasi |
|---|---|---|---|
| **Google AI Studio Container** | `v22.23.2` (`GOOGLE_RUNTIME=nodejs22`) | Penyuntingan kode saja (*authoring environment*) | Lulus verifikasi lokal pada Node 22 (`typecheck`, `lint`, `test`, `build`); validasi runtime Node 24 **NOT VERIFIED** |
| **GitHub Actions CI (`.github/workflows/web-ci.yml`)** | `node-version: "24"` | Gerbang verifikasi resmi (`npm ci`, `lint`, `typecheck`, `test`, `build`) | Konfigurasi siap (`PASS`); eksekusi runner **NOT VERIFIED** karena remote GitHub & `gh` CLI belum tersedia (lihat [NODE24-RUNTIME-VERIFICATION-REPORT.md](../../docs/reports/NODE24-RUNTIME-VERIFICATION-REPORT.md)) |
| **Vercel Deployment Target** | `>=24.12.0 <25.0.0` (via `package.json` `engines.node`) | Hosting Next.js Web + BFF | Konfigurasi `engines.node` siap; deployment ditunda sesuai gerbang fase |
| **Pengembangan Lokal Eksternal** | `24.15.0` (via `.nvmrc`) | Pengembangan lokal pengembang di luar AI Studio | Menggunakan `nvm use` / `fnm use` sesuai `.nvmrc` |

---

## 3. GitHub Actions Runtime Configuration

File konfigurasi: `.github/workflows/web-ci.yml`
- Trigger: `pull_request` dan `push` ke branch `main` serta `development`.
- Setup Node.js: `actions/setup-node@v4` dengan `node-version: "24"` dan `cache: npm`.
- Urutan pemeriksaan:
  1. `npm ci` (menggunakan `package-lock.json` tunggal).
  2. `npm run lint` (ESLint 9 Flat Config).
  3. `npm run typecheck` (`tsc --noEmit` dengan `@types/node@^24`).
  4. `npm test -- --run` (Vitest).
  5. `npm run build` (`next build`).

---

## 4. Vercel Runtime Configuration

1. **Penentuan Versi Node.js:** Vercel secara otomatis membaca properti `"engines": { "node": ">=24.12.0 <25.0.0" }` di `package.json` dan memetakannya ke rilis Node.js `24.x` terbaru yang tersedia di platform Vercel (menggantikan setelan UI default jika berbeda).
2. **`vercel.json`:** Tidak dibuat file `vercel.json` khusus karena deteksi Next.js App Router, build command (`npm run build`), dan pemilihan runtime Node 24 via `package.json` `engines.node` sudah ditangani secara native oleh Vercel tanpa perlu override tambahan.
3. **Konfigurasi Next.js (`next.config.ts`):** `output: 'standalone'` aktif; seluruh Route Handler atau Server Action yang kelak mengimpor `firebase-admin` wajib menggunakan **Node.js runtime** (default Next.js Route Handler atau eksplisit `export const runtime = 'nodejs'`), bukan Edge runtime.
