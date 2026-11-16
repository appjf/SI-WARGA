# Server Logging & Audit Trail (`server/logging/`)

Penanganan structured logging aplikasi dan pencatatan jejak audit (`auditLogs` / `auditEvents`) yang bersifat *append-only*.

## Ketentuan

- Menyertakan `requestId` untuk korelasi antar-layanan.
- Dilarang mencatat token, password, secret, atau data pribadi (PII) secara mentah ke dalam log aplikasi.
- Operasi kritis (perubahan role, transaksi keuangan, penerbitan surat, unduh/ekspor dokumen, perubahan GIS) wajib menghasilkan record audit.
