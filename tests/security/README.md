# Security Tests (`tests/security/`)

Direktori skenario uji keamanan wajib (`T-001` s.d. `T-012`), mencakup:
- Penolakan akses lintas warga (`IDOR`).
- Penolakan eskalasi role dari payload browser.
- Penolakan token kedaluwarsa dan akun `disabled`.
- Uji pembatasan unduhan dokumen Google Drive.
- Verifikasi tidak adanya PII pada GeoJSON publik dan log aplikasi.
