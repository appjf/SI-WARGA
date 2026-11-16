# ADR-004: Standarisasi Runtime Resmi Node.js 24 LTS (`>=24.12.0 <25.0.0`)

- **Tanggal:** 2026-11-15
- **Status:** Accepted
- **Terkait:** [ADR-001](./ADR-001-phase1-stack-and-repo-structure.md), [ADR-002](./ADR-002-phase2-package-manager-and-dependencies.md), [ADR-003](./ADR-003-community-identity-rw01.md) *(catatan: nomor ADR-003 telah ditetapkan sebelumnya untuk Perubahan Identitas Wilayah `RW 06 → RW 01`)*

---

## 1. Konteks

Pada saat evaluasi gerbang Phase 3 ditemukan ketidaksesuaian antara runtime container penyuntingan Google AI Studio (`Node.js v22.23.2`) dengan persyaratan engine dependensi Firebase yang terkunci pada Phase 2:

1. Paket `firebase@^13.3.0` (`@firebase/app@0.16.6`, `@firebase/auth@1.13.10`, `@firebase/firestore@4.20.0`, dan sub-paket `@firebase/*` lainnya) mendeklarasikan `engines.node >= 24.12.0`.
2. Container Google AI Studio dikelola pada `GOOGLE_RUNTIME=nodejs22` (`v22.23.2`) yang tidak dapat dinaikkan dari dalam workspace.
3. Audit seluruh 1.181 paket terkunci di `package-lock.json` menunjukkan seluruh dependensi inti (`next@15.5.29`, `react@19.3.1`, `firebase@^13.3.0`, `firebase-admin@^14.5.1`, `vitest@5.1.0`, `eslint@9.39.1`, `typescript@5.9.3`) kompatibel penuh dengan Node.js 24 LTS, sedangkan 6 dependensi transitif di bawah `firebase-tools@15.36.0` (`abbrev@5.0.0`, `node-gyp@13.1.0`, `which@7.0.0`, `nopt@10.0.1`, `proc-log@7.0.0`, `re2@1.27.1`) mensyaratkan `^22.22.2 || ^24.15.0 || >=26.0.0`.

## 2. Opsi yang Dipertimbangkan

- **Opsi A (Dipilih):** Menetapkan **Node.js 24 LTS (`>=24.12.0 <25.0.0`, `.nvmrc`: `24.15.0`)** sebagai standar runtime resmi untuk GitHub Actions CI, Vercel deployment, dan lingkungan development eksternal; mempertahankan `firebase@^13.3.0` dan `firebase-admin@^14.5.1`; menaikkan `@types/node` ke `^24` (`24.19.2`); serta memosisikan Google AI Studio (`v22.23.2`) hanya sebagai lingkungan penyuntingan kode.
- **Opsi B (Ditolak):** Menurunkan versi `firebase` ke seri `v12.x` atau memodifikasi runtime container secara non-standar. Ditolak karena mengorbankan keselarasan seri SDK terbaru dan berisiko merusak kontrak Phase 2 tanpa keputusan arsitektur baru.

## 3. Keputusan

1. **Standar Runtime Resmi:** Menetapkan `engines.node` di `package.json` menjadi `>=24.12.0 <25.0.0`.
2. **Versi Pin `.nvmrc`:** Menetapkan `24.15.0` di `.nvmrc` agar memenuhi batas minimum `>=24.12.0 <25.0.0` sekaligus menghindari `EBADENGINE` pada 6 dependensi transitif `firebase-tools` (`^24.15.0`).
3. **Definisi Tipe & Lockfile:** Memperbarui `@types/node` ke `^24` (`24.19.2`), mempertahankan `npm` + `package-lock.json` sebagai package manager & lockfile tunggal (tanpa `bun.lock`), dan mempertahankan `firebase@^13.3.0` serta `firebase-admin@^14.5.1`.
4. **Target CI & Deployment:**
   - GitHub Actions (`.github/workflows/web-ci.yml`) disetel ke `node-version: "24"` sebagai gerbang verifikasi resmi Node.js 24.
   - Vercel membaca `engines.node` dari `package.json` (`>=24.12.0 <25.0.0`) untuk memilih runtime Node.js 24.x.
5. **Batasan Pemisahan Runtime Firebase:**
   - `firebase` (`13.3.0`) hanya digunakan pada konteks browser/client (dimulai pada Phase 3).
   - `firebase-admin` (`14.5.1`) dilindungi oleh paket `server-only` dan hanya berjalan pada Next.js **Node.js runtime** (tidak pada Edge runtime).
6. **Kejujuran Validasi Lingkungan:** Validasi eksekusi/build/test pada runtime Node.js 24 berstatus **NOT VERIFIED** di dalam container AI Studio (`v22.23.2`). Verifikasi resmi Node.js 24 wajib melalui GitHub Actions CI (`node-version: "24"`) atau lingkungan eksternal Node 24 LTS.

## 4. Konsekuensi

- **Positif:** Menghilangkan kesenjangan versi antara `firebase@13.3.0` dan runtime target resmi tanpa menurunkan versi dependensi yang sudah diaudit di Phase 2.
- **Risiko / Tindak Lanjut:** Selama pengembangan dilakukan di AI Studio (`v22.23.2`), setiap perubahan yang bergantung pada API spesifik Node 24 atau modul `firebase@13.3.0` baru dapat divalidasi sepenuhnya ketika pipeline GitHub Actions (`node-version: "24"`) dijalankan.
