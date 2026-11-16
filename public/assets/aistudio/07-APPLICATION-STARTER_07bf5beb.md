# 07. Application Starter — Next.js

## 1. Struktur awal

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── (public)/page.tsx
│   │   ├── (auth)/login/page.tsx
│   │   ├── (resident)/dashboard/page.tsx
│   │   └── api/health/route.ts
│   ├── components/
│   ├── features/
│   │   ├── residents/
│   │   ├── administration/
│   │   ├── finance/
│   │   ├── complaints/
│   │   └── gis/
│   ├── lib/
│   │   ├── firebase/client.ts
│   │   ├── api/client.ts
│   │   └── validation/
│   └── types/
├── package.json
└── tsconfig.json
```

## 2. Client Firebase

```typescript
// src/lib/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(config);
export const auth = getAuth(app);
```

Firebase web config bukan pengganti kontrol akses. Jangan menaruh service account private key di browser. Variabel `NEXT_PUBLIC_` dianggap dapat diketahui publik.

## 3. API client dengan bearer token

```typescript
// src/lib/api/client.ts
import { auth } from "../firebase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sesi pengguna tidak tersedia.");

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // Parse a safe API error envelope; never expose server stack traces.
    throw new Error(`Permintaan gagal (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
```

## 4. Ketentuan implementasi

- Jangan mengandalkan conditional rendering sebagai authorization.
- Semua route privat harus memeriksa sesi; API tetap memeriksa otorisasi.
- Validasi form di client untuk UX dan di server untuk keamanan.
- Gunakan loading, empty, error, dan success state.
- Jangan menyimpan token atau data sensitif di localStorage secara manual.
- Hindari log payload berisi PII.
- Terapkan aksesibilitas keyboard, label form, kontras, dan pesan error yang jelas.

## 5. Halaman MVP

1. Login dan status akun.
2. Dashboard warga.
3. Profil dan rumah tangga.
4. Daftar permohonan dan detail status.
5. Pengaduan dan tindak lanjut.
6. Dashboard pengurus sesuai role.
7. Administrasi master data.
8. Keuangan dengan akses khusus.
9. Peta layer publik/internal sesuai izin.
