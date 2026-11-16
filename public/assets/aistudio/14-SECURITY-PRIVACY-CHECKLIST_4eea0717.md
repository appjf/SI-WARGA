# 14. Security dan Privacy Checklist

## 1. Tata kelola data

- [ ] Inventaris data dan tujuan pemrosesan ditetapkan.
- [ ] Klasifikasi: public, internal, restricted, highly restricted.
- [ ] Dasar pemrosesan, pemberitahuan, dan hak subjek data ditinjau sesuai peraturan yang berlaku.
- [ ] Data minimum dikumpulkan; field sensitif tidak dikumpulkan tanpa kebutuhan.
- [ ] Retensi, koreksi, ekspor, dan penghapusan memiliki prosedur.
- [ ] Penggunaan data untuk tujuan sekunder memerlukan evaluasi dan persetujuan yang sesuai.

## 2. Identity dan access

- [ ] MFA untuk akun pengurus/admin jika tersedia.
- [ ] Role dan status akun ditetapkan server-side.
- [ ] Least privilege dan deny-by-default.
- [ ] Object-level authorization untuk setiap resource.
- [ ] Akun nonaktif segera kehilangan akses.
- [ ] Review role dan akun berkala.

## 3. Application security

- [ ] HTTPS/TLS.
- [ ] Input validation dan output encoding.
- [ ] CSRF/CORS/session policy ditinjau sesuai arsitektur.
- [ ] Rate limiting dan abuse protection.
- [ ] Idempotency untuk write kritis.
- [ ] File upload allowlist, size limit, MIME detection, malware scanning sesuai risiko.
- [ ] Error/log tidak membocorkan PII atau secret.
- [ ] Dependency scanning dan patch management.

## 4. Data dan infrastruktur

- [ ] Database tidak terbuka ke internet tanpa kontrol.
- [ ] Enkripsi in-transit dan at-rest sesuai kemampuan layanan.
- [ ] Backup terenkripsi dan akses terbatas.
- [ ] Audit event terlindungi dari modifikasi tidak sah.
- [ ] Secret manager dan rotasi credential.
- [ ] Environment terpisah.
- [ ] Alert biaya, kuota, dan anomali.

## 5. GIS dan dokumen

- [ ] Layer publik ditinjau pemilik data.
- [ ] Tidak ada PII atau detail keamanan pada layer publik.
- [ ] Metadata akurasi, CRS, sumber, dan tanggal tersedia.
- [ ] Dokumen privat tidak memakai link publik permanen.
- [ ] Download dan ekspor dicatat.

## 6. Ketentuan Indonesia

Lakukan penelaahan hukum dan tata kelola terhadap peraturan perlindungan data pribadi, transaksi/arsip, serta ketentuan relevan lainnya. Penetapan pengendali/prosesor data, pemberitahuan privasi, retensi, dan respons insiden harus disahkan pihak yang berwenang; dokumen ini bukan pendapat hukum.
