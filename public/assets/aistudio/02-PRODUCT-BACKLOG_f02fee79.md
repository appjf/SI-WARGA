# 02. Product Backlog dan Acceptance Criteria

Prioritas: **P0** wajib untuk operasi aman; **P1** penting untuk MVP; **P2** pengembangan lanjutan.

## EPIC E01 — Identity, account, dan authorization

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-001 | Sebagai warga, saya dapat login dan logout | P0 | Token valid diterima; token invalid/expired ditolak; logout mengakhiri sesi aplikasi |
| US-002 | Sebagai admin, saya dapat mengaktifkan akun yang telah diverifikasi | P0 | Akun pending tidak mengakses data privat; aktivasi tercatat audit |
| US-003 | Sebagai pengurus, saya mendapat akses sesuai role | P0 | Hak dicek server-side; manipulasi role dari browser tidak memberi hak |
| US-004 | Sebagai warga, saya hanya melihat data yang menjadi hak saya | P0 | Uji akses lintas warga ditolak untuk read dan write |

## EPIC E02 — Master data warga dan rumah

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-010 | Sekretaris mengelola data rumah | P0 | Kode unit unik; perubahan tercatat; data tidak dihapus tanpa kebijakan |
| US-011 | Sekretaris mengelola rumah tangga dan anggota | P0 | Relasi memiliki validasi; akses warga dibatasi |
| US-012 | Warga mengajukan koreksi profil | P1 | Perubahan sensitif memerlukan verifikasi; riwayat tersimpan |

## EPIC E03 — Administrasi

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-020 | Warga mengajukan layanan/surat | P1 | Nomor permohonan server-generated; status awal submitted; lampiran tervalidasi |
| US-021 | Sekretaris memeriksa permohonan | P1 | Hanya role berwenang; keputusan dan alasan dicatat |
| US-022 | Ketua menyetujui permohonan tertentu | P1 | Approval sesuai matriks kewenangan; audit actor/time |
| US-023 | Warga memantau status | P1 | Warga hanya melihat permohonannya; status dan timestamp jelas |

## EPIC E04 — Keuangan

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-030 | Bendahara mencatat penerimaan/pengeluaran | P0 | Nominal integer IDR positif; idempotency mencegah duplikasi |
| US-031 | Bendahara melampirkan bukti | P1 | Dokumen privat; metadata terkait transaksi; audit download |
| US-032 | Bendahara melakukan rekonsiliasi | P0 | Saldo ledger dapat ditelusuri ke transaksi posted |
| US-033 | Koreksi transaksi dilakukan dengan reversal | P0 | Posted transaction tidak dihapus/ditimpa; reversal berelasi |
| US-034 | Warga melihat kewajiban/riwayat yang diizinkan | P1 | Tidak ada akses ke transaksi warga lain |

## EPIC E05 — Pengaduan, komunikasi, dan agenda

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-040 | Warga membuat pengaduan | P1 | Nomor tiket; status; lampiran privat; lokasi opsional |
| US-041 | PIC menindaklanjuti pengaduan | P1 | Perubahan status dan komentar tercatat |
| US-042 | Pengurus menerbitkan pengumuman | P1 | Draft/review/published; target audiens diterapkan |
| US-043 | Warga melihat agenda | P2 | Waktu memakai zona Asia/Jakarta pada tampilan |

## EPIC E06 — Aset, keamanan, dan GIS

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-050 | Petugas mencatat kejadian | P1 | Akses dibatasi; data sensitif tidak tampil publik |
| US-051 | Koordinator mengelola aset dan inspeksi | P1 | ID aset unik; inspeksi memiliki waktu, pelaksana, kondisi |
| US-052 | Koordinator mengelola layer GIS | P1 | CRS/SRID tervalidasi; geometri invalid ditolak |
| US-053 | Warga melihat peta layer publik | P2 | Hanya atribut yang disetujui; tidak memuat PII |

## EPIC E07 — Audit, dokumen, dan operasi

| ID | User story | Prioritas | Acceptance criteria |
|---|---|---|---|
| US-060 | Auditor meninjau aktivitas | P0 | Read-only; filter; akses audit juga dicatat |
| US-061 | Pengguna berwenang mengunggah dokumen | P1 | MIME, ukuran, klasifikasi, ownership divalidasi |
| US-062 | Admin mengekspor data sesuai kewenangan | P1 | Ekspor dibatasi, dicatat, dan tidak memuat field terlarang |
| US-063 | Operator memulihkan backup | P0 | Restore diuji berkala; hasil diverifikasi |

## Definition of Ready

Story memiliki aktor, tujuan, aturan bisnis, klasifikasi data, acceptance criteria, dependensi, dan contoh kasus negatif.

## Definition of Done

Implementasi direview, test otomatis lulus, kontrol akses diuji, dokumentasi diperbarui, tidak ada secret/PII di log, dan acceptance criteria disetujui pemilik proses.
