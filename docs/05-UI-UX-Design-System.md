# 05. UI/UX DESIGN SYSTEM
## Green Garden Residence – Integrated Community Management System

**Lingkup Wilayah:** RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut

## 1. Tujuan

Dokumen ini menetapkan prinsip, struktur navigasi, komponen, token visual, pola interaksi, aksesibilitas, dan kriteria evaluasi antarmuka GGR-ICMS. Desain diarahkan untuk warga dan pengurus dengan tingkat literasi digital beragam, terutama melalui ponsel.

## 2. Prinsip Pengalaman Pengguna

1. Mobile-first dan responsif.
2. Bahasa Indonesia yang sederhana dan konsisten.
3. Tugas utama dapat diselesaikan dengan langkah minimum.
4. Status proses selalu terlihat.
5. Formulir hanya meminta data yang diperlukan.
6. Tindakan kritis memerlukan konfirmasi.
7. Kesalahan memberikan cara perbaikan.
8. Informasi penting tidak bergantung pada warna saja.
9. Peta menyediakan alternatif daftar/teks.
10. Hak akses ditampilkan sesuai peran, tetapi tetap ditegakkan backend.

## 3. Arsitektur Informasi

### 3.1 Navigasi Warga
- Beranda
- Profil dan Rumah Tangga
- Layanan Administrasi
- Iuran dan Riwayat
- Pengaduan/Aspirasi
- Peta Lingkungan
- Pengumuman dan Kegiatan
- Bantuan

### 3.2 Navigasi Pengurus
- Dashboard
- Data Warga dan Rumah
- Administrasi dan Surat
- Keuangan
- Pengaduan dan Tindak Lanjut
- Keamanan dan Kejadian
- Aset dan Pemeliharaan
- GIS dan Peta
- Pengumuman dan Kegiatan
- Laporan
- Audit dan Pengaturan

## 4. Design Tokens Awal

| Token | Nilai | Kegunaan |
|---|---|---|
| Primary | `#1F5E4A` | Aksi utama |
| Secondary | `#D9A441` | Aksen |
| Background | `#F7F8F6` | Latar |
| Surface | `#FFFFFF` | Kartu/panel |
| Text | `#1F2933` | Teks utama |
| Muted | `#667085` | Teks sekunder |
| Success | `#217A45` | Status berhasil |
| Warning | `#A15C00` | Perhatian |
| Danger | `#B42318` | Kegagalan/kritis |
| Radius card | `12px` | Kartu |
| Spacing base | `4px` | Skala jarak |
| Font | System UI/sans-serif | Teks |

Token merupakan usulan. Validasi dengan pengurus dan uji keterbacaan sebelum dibakukan.

## 5. Tipografi dan Tata Letak

- Gunakan maksimal dua keluarga font.
- Utamakan ukuran teks isi yang nyaman pada ponsel.
- Judul membentuk hierarki konsisten.
- Lebar paragraf dibatasi agar mudah dibaca.
- Gunakan ruang kosong untuk mengelompokkan informasi.
- Tabel panjang memiliki filter, pencarian, pagination, dan tampilan ponsel.
- Jangan mengandalkan hover karena perangkat sentuh tidak memilikinya.

## 6. Komponen Antarmuka

| Komponen | Perilaku |
|---|---|
| Header | Identitas sistem, notifikasi, akun |
| Sidebar/bottom nav | Menu sesuai peran |
| Dashboard card | Angka ringkasan dengan label dan periode |
| Data table | Search, filter, sort, pagination |
| Form field | Label, helper text, validasi |
| Status indicator | Teks status dan warna pendukung |
| Timeline | Riwayat perubahan status |
| Confirmation dialog | Konfirmasi tindakan tidak dapat dibatalkan |
| File uploader | Tipe/ukuran yang diizinkan dan status unggah |
| Map panel | Layer, legenda, pencarian, detail fitur |
| Empty state | Menjelaskan mengapa belum ada data dan tindakan berikutnya |
| Error state | Pesan aman dan opsi mencoba kembali |

## 7. Pola Halaman

### 7.1 Dashboard Warga
- Pengumuman terbaru.
- Status permohonan.
- Pengaduan aktif.
- Ringkasan iuran sesuai kebijakan publikasi.
- Tombol tindakan utama.

### 7.2 Dashboard Pengurus
- Permohonan tertunda.
- Pengaduan aktif dan jatuh tempo.
- Ringkasan kas sesuai periode.
- Status verifikasi data.
- Kondisi aset dan jadwal inspeksi.
- Notifikasi sistem.

### 7.3 Keuangan
- Filter periode/kategori.
- Saldo awal, penerimaan, pengeluaran, saldo akhir.
- Daftar transaksi.
- Tautan bukti yang terotorisasi.
- Ekspor laporan dengan audit.

### 7.4 GIS
- Peta utama.
- Daftar layer dan legenda.
- Filter kategori/kondisi.
- Pencarian kode objek.
- Panel atribut.
- Alternatif daftar fitur untuk aksesibilitas.

## 8. Formulir dan Validasi

- Label tidak hanya menggunakan placeholder.
- Tandai field wajib.
- Validasi format dan rentang di frontend untuk umpan balik cepat.
- Ulangi validasi di backend.
- Simpan draft jika proses panjang dan kebijakan mengizinkan.
- Jangan menghapus input pengguna ketika terjadi kesalahan.
- Jelaskan format berkas dan batas ukuran sebelum unggah.

## 9. Aksesibilitas

Targetkan praktik WCAG 2.2 AA sejauh relevan:
- Kontras teks memadai.
- Navigasi keyboard.
- Fokus terlihat.
- Label dan instruksi kontrol.
- Struktur heading semantik.
- Teks alternatif untuk gambar bermakna.
- Status dibacakan teknologi bantu bila memungkinkan.
- Peta tidak menjadi satu-satunya sarana memperoleh informasi.
- Target sentuh cukup besar dan tidak terlalu rapat.

## 10. Responsif

Breakpoint ditentukan melalui sistem desain dan diuji pada:
- ponsel kecil;
- ponsel umum;
- tablet;
- laptop;
- desktop.

Pada layar kecil, sidebar dapat menjadi drawer atau bottom navigation. Tabel dapat berubah menjadi daftar kartu, tanpa menghilangkan field penting.

## 11. Microcopy

Gunakan istilah konsisten:
- “Ajukan permohonan”
- “Menunggu verifikasi”
- “Perlu perbaikan”
- “Disetujui”
- “Ditolak” disertai alasan
- “Sedang ditindaklanjuti”
- “Selesai”

Hindari istilah teknis seperti “payload”, “exception”, atau “token expired” pada pesan warga.

## 12. Keadaan Antarmuka

Setiap halaman utama harus memiliki:
- loading state;
- empty state;
- error state;
- success feedback;
- permission denied state;
- offline/connection warning bila relevan.

## 13. Riset dan Pengujian UX

Lakukan:
1. Wawancara singkat warga dan pengurus.
2. Identifikasi tugas paling sering.
3. Wireframe alur kritis.
4. Prototype dan uji tugas.
5. Catat completion rate, waktu, kesalahan, dan kebingungan.
6. Revisi sebelum implementasi penuh.
7. Uji kembali setelah rilis.

## 14. Kriteria Penerimaan UI/UX

- Warga dapat menemukan layanan utama tanpa bantuan intensif.
- Pengurus memahami status dan tindakan berikutnya.
- Tidak ada tindakan sensitif yang hanya dibedakan warna.
- Formulir dapat digunakan pada ponsel.
- Keyboard dan pembaca layar memperoleh label yang bermakna.
- Menu mengikuti peran dan backend tetap memeriksa akses.
- Error state tidak membocorkan informasi teknis.
