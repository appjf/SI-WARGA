# ADR-003: Penetapan Perubahan Identitas Wilayah Resmi (RW 06 → RW 01)

- **Tanggal:** 2026-11-15
- **Status:** Accepted
- **Terkait:** [ADR-001](./ADR-001-phase1-stack-and-repo-structure.md), [ADR-002](./ADR-002-phase2-package-manager-and-dependencies.md)

---

## 1. Konteks

Berdasarkan ketetapan pemilik proyek (*Project Identity Change – GGR-ICMS*), identitas wilayah administratif resmi aplikasi **Green Garden Residence – Integrated Community Management System (GGR-ICMS)** disesuaikan dari **RT 06 RW 06** menjadi **RT 06 RW 01**, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.

## 2. Keputusan

1. **Identitas Wilayah Resmi Aktif:**
   Seluruh dokumentasi aktif, metadata proyek, serta teks placeholder/mockup menggunakan:
   **RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut**.
2. **Pembatasan Dampak Teknis:**
   - Tidak ada perubahan struktur database, nama koleksi Firestore, skema PostGIS, maupun ID dokumen/contoh kode unit (`GG-RT06-001`, yang merujuk pada kode RT 06).
   - Tidak ada migrasi data, perubahan logika program, atau penambahan fitur baru.
3. **Pelestarian Artefak Historis:**
   - Arsip lampiran sumber asli pada `public/assets/aistudio/*` (`00-IMPLEMENTATION-README_7075911a.md` dan `01-SAD-System-Architecture-Document_930cbfce.md`) dipertahankan apa adanya sebagai catatan historis baseline awal paket implementasi.
   - Keputusan arsitektur terdahulu (`ADR-001` dan `ADR-002`) tetap dipertahankan tanpa diubah riwayatnya.

## 3. Konsekuensi

- Seluruh pengembangan selanjutnya (Tahap 3 hingga Tahap 10) wajib mengacu pada identitas wilayah resmi **RT 06 RW 01**.
- Perubahan identitas ini bersifat administratif/deskriptif dan tidak memengaruhi kontrak teknis maupun dependensi yang telah dikunci pada Phase 2.
