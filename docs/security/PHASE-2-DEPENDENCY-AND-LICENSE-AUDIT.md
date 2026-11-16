# Audit Keamanan & Lisensi Dependency (Phase 2)

- **Tanggal Pemeriksaan:** 2026-11-15
- **Cakupan:** Seluruh **1.181** paket terkunci dalam `package-lock.json`
- **Alat Pemeriksaan:** `npm audit --json` dan inspeksi metadata lisensi `package-lock.json`

---

## 1. Ringkasan Audit Keamanan (`npm audit`)

| Tingkat Keparahan | Jumlah | Keterangan |
|---|---:|---|
| Critical | **0** | Tidak ada kerentanan kritis |
| High | **5** | 4 terkait jalur `@grpc/grpc-js` pada `firebase`, 1 terkait `postcss` internal `next` |
| Moderate | **23** | Mayoritas pada devDependencies CLI (`firebase-tools`, `eslint-config-next`, `@tailwindcss/typography`) & `next`/`postcss` |
| Low / Info | **0** | Tidak ada |
| **Total** | **28** | Tidak dijalankan `npm audit fix --force` untuk menjaga stabilitas versi utama |

### Rincian Temuan & Evaluasi Risiko

| Paket Terdampak | Keparahan | Jalur Asal | Tipe / Eksposur | Analisis & Rencana Mitigasi |
|---|---|---|---|---|
| `@grpc/grpc-js` (`@firebase/firestore`, `@firebase/firestore-compat`, `firebase`) | **High** (4) | Runtime `firebase@13.3.0` | Transitive (`@firebase/firestore@4.20.0`) | Advisory `getAuthContext` berlaku untuk **gRPC server**; klien browser memakai WebChannel/HTTP, sedangkan backend GGR-ICMS memakai `firebase-admin` (architecture backend-mediated). Patch otomatis `npm audit` merekomendasikan downgrade tidak kompatibel ke `firebase@9.14.0` sehingga ditolak; pantau rilis minor/patch `@firebase/firestore` pada Phase 3. |
| `postcss` (`next`) | **High** (1) & **Moderate** | `next@15.5.29` | Internal/Build-time CSS | Terkait `sourceMappingURL` pada CSS komentar untrusted & `</style>` escaping. GGR-ICMS tidak memproses CSS buatan pengguna (*untrusted user CSS*). Upgrade ke `next@16.4.6` bersifat major breaking change sehingga ditunda/dievaluasi terpisah melalui persetujuan arsitektur. |
| `eslint-config-next` (`typescript-eslint`, `minimatch`) | **Moderate** | `eslint-config-next@16.0.8` | Dev-only (Linting) | Hanya berjalan saat proses lint build/CI, tidak ikut ke runtime produksi. |
| `@tailwindcss/typography` (`postcss-selector-parser`) | **Moderate** | `@tailwindcss/typography@0.5.20` | Dev/Build-time CSS | Hanya memproses kelas statis saat build CSS; tidak memproses input user saat runtime. |
| `firebase-tools` (`@google-cloud/pubsub`, `@opentelemetry/core`, `glob`, `minimatch`, `rimraf`, `uuid`, `archiver`, `exegesis`, `gaxios`) | **Moderate** (mayoritas dari 23 temuan) | `firebase-tools@15.36.0` | Dev-only CLI | Merupakan CLI tooling bawaan workspace, tidak masuk bundle aplikasi Next.js. Tetap jaga agar tidak dijalankan terhadap input tidak tepercaya dan tinjau pembaruan versi pada Phase 3. |

> **Kepatuhan Kebijakan Phase 2:** Tidak ada kerentanan yang disembunyikan dengan menurunkan `--audit-level`, dan `npm audit fix --force` tidak dijalankan karena menyarankan downgrade major yang merusak kompatibilitas stack (`firebase@9.14.0`, `firebase-tools@13.11.2`, `eslint-config-next@15.5.29`, `@tailwindcss/typography@0.5.4`).

---

## 2. Audit Lisensi (1.181 Paket Terkunci)

### Distribusi Lisensi

| Lisensi | Jumlah Paket | Klasifikasi Hukum / Kompatibilitas |
|---|---:|---|
| `MIT` | 804 | Permissive (kompatibel) |
| `Apache-2.0` | 174 | Permissive dengan patent grant (kompatibel) |
| `ISC` | 66 | Permissive (kompatibel) |
| `MPL-2.0` | 24 | Weak copyleft tingkat file (kompatibel tanpa modifikasi kode MPL) |
| `BSD-3-Clause` | 23 | Permissive (kompatibel) |
| `BSD-2-Clause` | 11 | Permissive (kompatibel) |
| `BlueOak-1.0.0` | 11 | Permissive modern (kompatibel) |
| `CC0-1.0` / `0BSD` / `CC-BY-4.0` / `Python-2.0` / `public domain` / Dual MIT/BSD | 8 | Permissive / atribusi standar |
| `LGPL-3.0-or-later` | 1 | Weak copyleft (`@img/sharp-libvips-linux-x64@1.3.4` di bawah `sharp` untuk Next.js Image optimization; binary dinamis tidak dimodifikasi) |
| `UNKNOWN` (metadata lama) | 3 | `fuzzy@0.1.3` (via `firebase-tools` dev), `limiter@1.1.5` (via `jwks-rsa`), `valid-url@1.0.9` (via `join-path`) — ketiganya paket legacy berlisensi MIT yang belum mencantumkan field SPDX formal |

### Kesimpulan Audit Lisensi
- Tidak ditemukan paket berlisensi **GPL / AGPL** (*strong copyleft*) pada dependency runtime maupun development.
- Seluruh direct dependency (`dependencies` dan `devDependencies`) menggunakan lisensi permissive (`MIT`, `Apache-2.0`, `ISC`).
