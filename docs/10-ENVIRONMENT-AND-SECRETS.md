# 10. Environment Variables dan Secrets

## 1. Template `.env.example`

```dotenv
# Web — public Firebase configuration (not service-account credentials)
NEXT_PUBLIC_APP_NAME="GGR-ICMS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000/api/v1"
NEXT_PUBLIC_FIREBASE_API_KEY="CHANGE_ME"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="CHANGE_ME"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="CHANGE_ME"
NEXT_PUBLIC_FIREBASE_APP_ID="CHANGE_ME"

# Backend only
FIREBASE_PROJECT_ID="CHANGE_ME"
GOOGLE_APPLICATION_CREDENTIALS="/secure/path/service-account.json"
DATABASE_URL="postgresql+psycopg://CHANGE_ME"
GOOGLE_DRIVE_ROOT_FOLDER_ID="CHANGE_ME"
APP_ENV="development"
LOG_LEVEL="INFO"
```

## 2. Aturan secret

- `.env`, service account JSON, private key, token, dan credential tidak boleh masuk Git.
- Gunakan secret manager platform untuk staging/production.
- Pisahkan project Firebase dan database development, staging, production.
- Rotasi credential ketika personel berubah, ada indikasi kebocoran, atau sesuai jadwal.
- Batasi akses secret berdasarkan tugas.
- Jangan pernah mengirim secret ke client melalui variabel `NEXT_PUBLIC_`.
- Gunakan akun layanan khusus dan scope minimum.
- Masking data sensitif pada log.

## 3. Checklist konfigurasi lingkungan

- [ ] Domain dan HTTPS ditetapkan.
- [ ] Authorized domains Firebase dikonfigurasi.
- [ ] OAuth consent/scope Drive ditinjau.
- [ ] Service account memiliki akses minimum.
- [ ] Database private networking/firewall dikonfigurasi.
- [ ] Backup dan retensi ditetapkan.
- [ ] CORS allowlist ditetapkan.
- [ ] Rate limit dan monitoring aktif.
- [ ] Alert biaya cloud dan kuota tersedia.
- [ ] Tidak ada secret di build log atau repository.
