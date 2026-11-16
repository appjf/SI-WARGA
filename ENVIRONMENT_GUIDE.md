# Panduan Environment & Secrets (Environment Guide)

Acuan tata kelola konfigurasi lingkungan dan rahasia (*secrets*) merujuk pada `10-ENVIRONMENT-AND-SECRETS.md`.

## Pemisahan Lingkungan

| Lingkungan | Tujuan | Aturan Data |
|---|---|---|
| `local` | Pengembangan individu | Data sintetis / emulator |
| `development` | Integrasi fitur | Project Firebase, DB, & folder Drive terpisah |
| `staging` | Uji regresi & UAT | Menyerupai produksi tanpa kebocoran ke dev |
| `production` | Operasional resmi | Akses terbatas, monitoring, & backup terenkripsi |

## Kebijakan Pengelolaan Secret

1. Dilarang menyimpan file `.env`, credential service account JSON, private key, atau connection string di repository Git.
2. Variabel berawalan `NEXT_PUBLIC_` hanya untuk konfigurasi klien yang aman diketahui publik.
3. Secret server-side (`FIREBASE_PRIVATE_KEY`, `DATABASE_URL`, kredensial Google Drive) wajib dikelola melalui Secret Manager atau environment platform terenkripsi.
4. Lakukan rotasi credential secara berkala atau segera saat terjadi pergantian pengurus/pengembang maupun indikasi kebocoran.
5. Masking seluruh data sensitif dan token sebelum dicatat ke log aplikasi.

## Panduan Setup Lingkungan Pengembangan Lokal & Target Runtime (Node.js 24 LTS)

### Prasyarat Runtime Resmi

| Komponen | Versi Resmi Target | Keterangan |
|---|---|---|
| Node.js | `>=24.12.0 <25.0.0` (LTS; `.nvmrc`: `24.15.0`) | Standar resmi untuk CI, Vercel, dan development lokal eksternal |
| npm | `10.9.8+` (atau bawaan Node 24 LTS) | Package manager resmi repository (`package-lock.json`) |
| Git | `2.34.1+` | Branch utama `main`, konvensi pada `COMMIT_CONVENTION.md` |

> **Catatan Lingkungan AI Studio:** Container Google AI Studio saat ini menggunakan Node.js `v22.23.2` (`GOOGLE_RUNTIME=nodejs22`) yang tidak dapat diubah dari dalam workspace. AI Studio digunakan untuk **penyuntingan kode**, bukan sebagai acuan validasi runtime resmi Node.js 24. Validasi runtime resmi dilakukan melalui **GitHub Actions (`node-version: "24"`)**, **Vercel (`engines.node`)**, atau mesin development eksternal dengan Node.js `24.15.0` (`.nvmrc`).
>
> **Catatan Versi `.nvmrc` (`24.15.0`):** Meskipun `package.json` menetapkan batas minimum `>=24.12.0 <25.0.0` (sesuai kebutuhan minimum `firebase@13.3.0`), `.nvmrc` disetel ke `24.15.0` agar 6 dependensi transitif di bawah `firebase-tools` (`abbrev`, `node-gyp`, `which`, `nopt`, `proc-log`, `re2`) yang mensyaratkan `^24.15.0` berjalan tanpa peringatan `EBADENGINE`.

### Langkah Persiapan (Lingkungan Eksternal Node 24)

1. Gunakan Node.js sesuai `.nvmrc` (`nvm use` atau `fnm use` untuk `24.15.0`).
2. Pastikan menggunakan `npm` (bukan `bun`, `yarn`, atau `pnpm`) agar `package-lock.json` tetap konsisten.
3. Instal seluruh dependency terkunci secara deterministik:
   ```bash
   npm ci
   ```
4. Salin template konfigurasi tanpa nilai rahasia:
   ```bash
   cp .env.example .env.local
   ```
   *Catatan: Sebelum Phase 3 dimulai, variabel Firebase, PostGIS, dan Google Drive tetap menggunakan placeholder dan belum diaktifkan.*
5. Jalankan pemeriksaan kualitas sebelum melakukan commit:
   ```bash
   npm run typecheck
   npm run lint
   npm test -- --run
   npm run build
   ```
6. Jalankan server pengembangan lokal di port default `3000`:
   ```bash
   npm run dev
   ```
