# Standar Engineering (Engineering Standards)

Acuan standar rekayasa perangkat lunak untuk GGR-ICMS sesuai Implementation Package v1.0.

## Standar Penamaan

| Elemen | Konvensi | Contoh |
|---|---|---|
| Direktori / Folder | `lowercase kebab-case` | `gis-service`, `admin-requests` |
| Dokumen Proyek | `UPPERCASE` atau konvensi indeks | `README.md`, `ROADMAP.md` |
| Komponen React (nantinya) | `PascalCase` | `ResidentProfileCard` |
| Fungsi & Variabel (nantinya) | `camelCase` | `verifyResidentAccess` |
| Tabel & Kolom Database | `snake_case` | `house_code`, `surveyed_at` |
| Endpoint API | RESTful `kebab-case` | `/api/v1/admin-requests` |
| Dokumentasi | Markdown (`.md`) | `docs/security/README.md` |

## Standar Teknis & Integritas Data

- **Type Safety:** TypeScript strict mode tanpa penggunaan `any` yang tidak terdokumentasi.
- **Nilai Uang:** Disimpan sebagai bilangan bulat Rupiah (`integer IDR`), dilarang menggunakan floating-point.
- **Zona Waktu:** Disimpan dalam UTC (ISO 8601), ditampilkan dalam zona waktu `Asia/Jakarta`.
- **Koordinat Spasial:** Wajib menyertakan SRID/CRS secara eksplisit (`EPSG:4326` untuk pertukaran GeoJSON, `EPSG:32748` untuk perhitungan metrik wilayah Garut setelah verifikasi).
- **Immutability Keuangan:** Transaksi berstatus `posted` tidak boleh diubah atau dihapus; koreksi dilakukan melalui mekanisme `reversal`.
- **Idempotency:** Operasi tulis kritis (permohonan, pengaduan, transaksi keuangan) wajib menerapkan `Idempotency-Key`.
- **Keamanan Respons:** Pesan kesalahan dilarang membocorkan stack trace, token, secret, atau data pribadi.
