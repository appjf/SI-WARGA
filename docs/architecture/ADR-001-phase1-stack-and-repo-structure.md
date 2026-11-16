# ADR-001: Baseline Stack Versi & Struktur Direktori Root Next.js (Phase 1)

- **Tanggal Pemeriksaan:** 2026-11-15
- **Status:** Accepted (Phase 1 Foundation Baseline)
- **Konteks:** Dokumen blueprint awal (`03-REPOSITORY-AND-ENGINEERING-STANDARDS.md` & `07-APPLICATION-STARTER.md`) mencantumkan contoh tata letak monorepo `apps/web/src/...`, sedangkan struktur fondasi yang disetujui pada Tahap 0 dan lingkungan eksekusi workspace menempatkan Next.js App Router langsung di root repository (`app/`, `components/`, `features/`, `hooks/`, `services/`, `types/`, `lib/`, `styles/`, `layouts/`, `server/`).

## Keputusan

1. **Tata Letak Direktori Web di Root:**
   - Mempertahankan struktur root yang telah disetujui pada Tahap 0 tanpa memindahkan ke `apps/web/` atau `src/`, untuk menghindari duplikasi direktori (`utils/` terwakili oleh `lib/`, dan `assets/` terwakili oleh `public/assets/`).
   - Pemisahan boundary tetap dijaga tegas:
     - Presentasi & rute: `app/`, `components/`, `layouts/`, `styles/`
     - Domain fitur & komunikasi klien: `features/`, `hooks/`, `services/`, `types/`, `lib/`
     - Layanan server-side: `server/`
     - Layanan GIS Python terpisah: `gis-service/`

2. **Versi Teknologi Baseline (Diperiksa 2026-11-15):**

| Komponen | Versi Terpasang / Target | Catatan |
|---|---|---|
| Node.js | `v22.23.2` | LTS runtime lokal & target CI |
| npm | `10.9.8` | Package manager workspace |
| Git | `2.34.1` | VCS lokal, branch utama `main` |
| Next.js | `^15.4.9` | App Router (`reactStrictMode: true`, `output: standalone`) |
| React & React DOM | `^19.2.1` | React Server & Client Components |
| TypeScript | `5.9.3` | `strict: true`, `noEmit: true` |
| Tailwind CSS | `4.1.11` | PostCSS `@tailwindcss/postcss` |
| ESLint | `9.39.1` (`eslint-config-next` `16.0.8`) | Flat config via `eslint.config.mjs` |
| Lucide React | `^0.553.0` | Pustaka ikon standar |
| Motion | `^12.23.24` | Pustaka animasi UI (untuk tahap UI) |

## Konsekuensi

- Konfigurasi path alias `@/*` mengarah langsung ke `./*` sesuai `tsconfig.json`.
- Workflow CI GitHub Actions dijalankan langsung pada root repository tanpa `working-directory: apps/web`.
- Dependency tidak diinstal ulang atau diubah pada Phase 1; penguncian dan audit lisensi dilakukan pada Phase 2.
