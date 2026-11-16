# Database Migrations (`database/migrations/`)

Direktori khusus file migrasi skema bernomor urut (misal `001_init_postgis_schema.sql` pada Tahap 4).

## Kebijakan Migrasi

- Migration yang telah diterapkan ke staging/produksi dilarang diedit ulang; perubahan lanjutan wajib dibuat sebagai migration baru.
- Perubahan berisiko wajib disertai snapshot backup dan prosedur *forward-fix* / *rollback* yang teruji.
