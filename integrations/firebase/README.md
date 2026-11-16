# Firebase Integration (`integrations/firebase/`)

Spesifikasi integrasi ekosistem Firebase:
- **Firebase Authentication:** Verifikasi ID token di sisi server (Next.js BFF dan FastAPI GIS).
- **Cloud Firestore:** Sumber utama data operasional dengan arsitektur akses *backend-mediated* (`deny-by-default` pada client rules).
- **Firebase Cloud Messaging (FCM):** Pengiriman notifikasi pengumuman, status permohonan, dan tiket pengaduan.
