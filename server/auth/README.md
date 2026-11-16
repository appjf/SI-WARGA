# Server Authentication (`server/auth/`)

Menangani verifikasi identitas di sisi server melalui Firebase Admin SDK.

## Tanggung Jawab

- Memvalidasi header `Authorization: Bearer <FIREBASE_ID_TOKEN>`.
- Memastikan status akun pada sumber tepercaya server-side adalah `active` (menolak akun `disabled` atau `pending` meskipun token belum kedaluwarsa).
- Mengekstrak identitas terpercaya (`uid`) untuk diteruskan ke lapisan `authorization/`.
