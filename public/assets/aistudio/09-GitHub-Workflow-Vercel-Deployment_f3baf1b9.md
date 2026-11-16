# 09. GITHUB WORKFLOW DAN VERCEL DEPLOYMENT
## Green Garden Residence – Integrated Community Management System

## 1. Tujuan

Dokumen ini menetapkan pengelolaan kode, strategi branch, pull request, pemeriksaan otomatis, deployment Vercel, pengelolaan secret, dan rollback.

## 2. Struktur Repositori

```text
green-garden-icms/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── residents/
│   │   ├── administration/
│   │   ├── finance/
│   │   ├── complaints/
│   │   └── gis/
│   ├── lib/
│   │   ├── firebase/
│   │   ├── google-drive/
│   │   ├── auth/
│   │   └── api/
│   ├── services/
│   └── types/
├── gis-service/
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── docs/
├── tests/
├── .github/workflows/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 3. Branching Strategy

| Branch | Fungsi |
|---|---|
| `main` | Produksi |
| `development` | Integrasi |
| `feature/<nama>` | Fitur baru |
| `fix/<nama>` | Perbaikan |
| `hotfix/<nama>` | Perbaikan darurat |

Lindungi `main`, wajibkan pull request, review, dan pemeriksaan CI. Hindari commit langsung ke branch produksi.

## 4. Standar Commit dan Pull Request

Commit disarankan menjelaskan perubahan, misalnya:
- `feat: add resident registration`
- `fix: prevent duplicate finance posting`
- `docs: update GIS data dictionary`
- `test: add role access tests`

Pull request harus memuat:
- tujuan;
- ringkasan perubahan;
- issue terkait;
- screenshot bila mengubah UI;
- risiko/migrasi data;
- test yang dijalankan;
- dampak keamanan;
- catatan rollback.

Jangan sertakan data warga atau screenshot berisi PII.

## 5. CI Pipeline

Tahapan:
1. Install dependency dari lockfile.
2. Lint.
3. Type check.
4. Unit test.
5. Integration test yang sesuai.
6. Build.
7. Dependency/security scan bila tersedia.
8. Review manusia.
9. Merge.
10. Deployment dan smoke test.

Contoh workflow konseptual:

```yaml
name: web-ci
on:
  pull_request:
    branches: [main, development]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
```

Versi runtime dan action harus disesuaikan dengan versi proyek yang benar-benar dipakai dan kebijakan keamanan GitHub saat implementasi.

## 6. Vercel Configuration

- Hubungkan repository GitHub ke proyek Vercel.
- Tetapkan `main` sebagai production branch.
- Aktifkan preview deployment untuk pull request.
- Pisahkan env development, preview, production.
- Konfigurasikan domain dan HTTPS.
- Lindungi preview jika mengakses data sensitif.
- Jalankan smoke test setelah deployment.
- Catat versi rilis dan prosedur rollback.

## 7. Pemisahan Layanan GIS

Next.js dapat di-host di Vercel. FastAPI GIS sebaiknya ditempatkan pada hosting/container yang mendukung Python, PostGIS client, dependensi geospasial, kebutuhan memori, dan proses yang lebih berat. Hubungkan melalui HTTPS dan verifikasi token Firebase.

Sebelum memilih hosting GIS, uji:
- waktu startup;
- ukuran image;
- kebutuhan GDAL/PROJ;
- memory/CPU;
- timeout;
- konektivitas PostGIS;
- backup dan logging.

## 8. Environment Variables

Contoh nama, tanpa nilai:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=

GIS_API_BASE_URL=
GIS_DATABASE_URL=
```

Hanya variabel `NEXT_PUBLIC_*` yang memang aman untuk browser. Jangan pernah menaruh private key, token, password, atau connection string rahasia pada variabel publik atau repository. Gunakan secret management platform.

## 9. Kebijakan Keamanan Repository

- Repository private selama tahap pengembangan.
- Aktifkan branch protection.
- Aktifkan secret scanning/dependency alerts jika tersedia.
- Jangan commit `.env`, service account key, dump database, atau dokumen pribadi.
- Gunakan lockfile.
- Review dependency dan lisensi.
- Gunakan data sintetis pada test.
- Batasi hak akses anggota repository.
- Cabut akses ketika anggota tim tidak lagi terlibat.

## 10. Release Management

Setiap rilis mempunyai:
- nomor versi/tag;
- ringkasan perubahan;
- migrasi data;
- risiko;
- hasil test;
- persetujuan;
- deployment ID;
- rencana rollback.

Rilis perubahan skema harus memiliki migration plan, backup sebelum migrasi, dan strategi kompatibilitas.

## 11. Rollback

1. Identifikasi versi stabil terakhir.
2. Hentikan perubahan lanjutan jika diperlukan.
3. Rollback deployment aplikasi.
4. Jika ada migrasi database, jalankan prosedur rollback yang telah diuji; jangan mengasumsikan rollback kode otomatis mengembalikan data.
5. Verifikasi alur login dan operasi kritis.
6. Komunikasikan status.
7. Lakukan root cause analysis.

## 12. Kriteria Penerimaan Deployment

- PR menjalankan CI.
- Preview dapat diuji.
- Production hanya berasal dari branch/rilis yang disetujui.
- Secret dipisahkan per environment.
- Domain HTTPS aktif.
- Smoke test lulus.
- Monitoring dan rollback tersedia.
- Layanan GIS terhubung dengan aman.
