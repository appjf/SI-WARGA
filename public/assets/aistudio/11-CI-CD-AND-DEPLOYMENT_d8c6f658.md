# 11. CI/CD dan Deployment

## 1. Pipeline minimum

Pull request: install dari lockfile → lint → typecheck → unit test → security/dependency scan → build. Deployment staging dilakukan setelah merge ke `development`; produksi melalui release/tag dan persetujuan.

## 2. Contoh GitHub Actions

```yaml
name: web-ci
on:
  pull_request:
    paths:
      - "apps/web/**"
      - ".github/workflows/**"
  push:
    branches: [development, main]
    paths:
      - "apps/web/**"

jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
```

Pin action ke commit SHA untuk supply-chain hardening pada pipeline produksi. Pastikan script dalam `package.json` tersedia; workflow ini template.

## 3. Deployment

- Web Next.js: Vercel; pisahkan project/environment.
- GIS API: container platform yang mendukung Python/FastAPI dan koneksi privat ke PostGIS.
- Database: managed PostgreSQL dengan PostGIS atau infrastruktur yang dikelola; aktifkan TLS, backup, dan pembatasan jaringan.
- Jalankan migration melalui job terkontrol, bukan saat setiap request aplikasi.
- Gunakan health check, smoke test, dan observability.
- Release harus memiliki versi, changelog, migration ID, dan prosedur rollback/forward-fix.

## 4. Go-live checklist

- [ ] UAT ditandatangani.
- [ ] Tidak ada vulnerability kritis/tinggi yang belum ditangani.
- [ ] RBAC dan object-level authorization diuji.
- [ ] Backup terbaru dan restore drill tervalidasi.
- [ ] DNS, TLS, CORS, callback URL, dan domain benar.
- [ ] Data awal telah disetujui pemilik data.
- [ ] Pelatihan dan panduan pengguna tersedia.
- [ ] Kontak eskalasi dan jadwal dukungan tersedia.
- [ ] Monitoring dan alert aktif.
- [ ] Rollback/cutover plan disetujui.
