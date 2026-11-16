# Standar Commit & Branching (GGR-ICMS)

Dokumen ini menetapkan konvensi pesan commit dan alur cabang Git untuk proyek **Green Garden Residence – Integrated Community Management System (GGR-ICMS)** mengacu pada `docs/03-REPOSITORY-AND-ENGINEERING-STANDARDS.md` dan `docs/09-GitHub-Workflow-Vercel-Deployment.md`.

## 1. Strategi Branch

| Branch | Tujuan | Aturan |
|---|---|---|
| `main` | Kode stabil / rilis produksi | Protected; hanya menerima merge teruji dan disetujui |
| `development` | Integrasi fitur antarmodul | Target PR fitur sebelum masuk `main` |
| `feature/<slug>` | Pengembangan fitur baru | Dibuat dari `development` |
| `fix/<slug>` | Perbaikan bug non-darurat | Dibuat dari `development` |
| `hotfix/<slug>` | Perbaikan mendesak produksi | Dibuat dari `main`, di-merge kembali ke `main` & `development` |

## 2. Format Pesan Commit

Gunakan format **Conventional Commits**:

```text
<type>(<scope>): <ringkasan singkat dalam bahasa Inggris atau Indonesia yang konsisten>
```

### Tipe yang Diizinkan (`type`)

- `feat`: penambahan fitur fungsional baru.
- `fix`: perbaikan bug atau cacat fungsional.
- `docs`: perubahan dokumentasi (`README.md`, `docs/`, komentar arsitektur).
- `style`: penyesuaian format kode tanpa mengubah logika.
- `refactor`: restrukturisasi kode tanpa mengubah perilaku eksternal.
- `test`: penambahan atau pembaruan skenario pengujian.
- `chore`: konfigurasi build, CI/CD, tooling, atau maintenance repository.
- `security`: perbaikan atau penguatan kontrol keamanan / rules.

### Scope Utama (`scope`)

- `repo`, `ci`, `config`, `ui`, `auth`, `residents`, `households`, `admin`, `finance`, `complaints`, `announcements`, `assets`, `security`, `gis`, `drive`, `docs`.

### Contoh Commit

```text
chore(repo): initialize GGR-ICMS Phase 1 repository and Next.js scaffolding
feat(residents): add household member registration flow
fix(finance): enforce idempotency key on transaction posting
docs(gis): clarify EPSG:4326 and EPSG:32748 SRID policy
security(rules): restrict household read access to verified members
```

## 3. Ketentuan Keamanan Commit

1. Dilarang melakukan commit file `.env`, credential service account JSON, private key, atau connection string.
2. Dilarang menyertakan data warga asli (PII) pada pesan commit, kode, fixture, maupun screenshot PR.
3. Setiap Pull Request wajib lulus `npm run lint`, `npm run typecheck`, dan `npm run build`.
