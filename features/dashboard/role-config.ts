import type { Role, Permission } from "@/lib/rbac/matrix";
import { hasPermission } from "@/lib/rbac/matrix";

export interface RoleDashboardConfig {
  primaryRole: Role;
  headline: string;
  subtitle: string;
  focusModules: string[];
  quickActions: Array<{
    label: string;
    href: string;
    requiredPermission?: Permission;
  }>;
}

const ROLE_CONFIG_MAP: Record<Role, Omit<RoleDashboardConfig, "primaryRole">> = {
  SUPER_ADMIN: {
    headline: "Pusat Kendali Sistem & Tata Kelola",
    subtitle:
      "Pengawasan penuh kependudukan, keuangan, pengaduan, aset spasial, dan otorisasi peran RT 06 RW 01.",
    focusModules: ["Kependudukan", "Keuangan", "Pengaduan", "GIS & Aset", "Manajemen Peran"],
    quickActions: [
      { label: "Kelola Pengguna & Peran", href: "/admin/users", requiredPermission: "users:read" },
      { label: "Laporan & Analitik", href: "/reports" },
      { label: "Peta & Aset Spasial", href: "/gis", requiredPermission: "gis:read" },
    ],
  },
  ADMIN_RW: {
    headline: "Konsol Koordinasi Tingkat RW 01",
    subtitle:
      "Pemantauan lintas wilayah, rekap kependudukan, pengaduan warga, dan inventarisasi infrastruktur RW 01.",
    focusModules: ["Kependudukan", "Pengaduan", "GIS & Aset", "Analitik"],
    quickActions: [
      { label: "Direktori Warga & Rumah", href: "/residents", requiredPermission: "residents:read" },
      { label: "Peta & Aset Spasial", href: "/gis", requiredPermission: "gis:read" },
      { label: "Lihat Laporan Analitik", href: "/reports" },
    ],
  },
  KETUA_RT: {
    headline: "Ringkasan Kepemimpinan RT 06",
    subtitle:
      "Persetujuan transaksi kas lingkungan, eskalasi pengaduan warga, verifikasi kependudukan, dan kondisi prasarana.",
    focusModules: ["Persetujuan Kas", "Tindak Lanjut Aduan", "Verifikasi Warga", "GIS"],
    quickActions: [
      { label: "Review Persetujuan Kas", href: "/finance", requiredPermission: "finance:approve" },
      { label: "Kelola Pengaduan Aktif", href: "/complaints", requiredPermission: "complaints:manage" },
      { label: "Terbitkan Pengumuman", href: "/notifications" },
    ],
  },
  SEKRETARIS_RT: {
    headline: "Meja Administrasi & Kependudukan RT 06",
    subtitle:
      "Pengelolaan daftar warga, registrasi rumah tangga baru, pengumuman resmi, dan koordinasi arsip lingkungan.",
    focusModules: ["Registrasi Warga", "Unit Rumah Tangga", "Pengumuman", "Pengaduan"],
    quickActions: [
      { label: "Tambah Data Warga / Rumah", href: "/residents", requiredPermission: "residents:write" },
      { label: "Terbitkan Pengumuman", href: "/notifications" },
      { label: "Pantau Peta Persil", href: "/gis", requiredPermission: "gis:read" },
    ],
  },
  BENDAHARA_RT: {
    headline: "Konsol Kas & Akuntabilitas Keuangan RT 06",
    subtitle:
      "Pencatatan pemasukan dan pengeluaran integer Rupiah, pemantauan persetujuan berjenjang, dan pelaporan kas.",
    focusModules: ["Catat Transaksi", "Antrean Persetujuan", "Reversal Ledger", "Laporan Kas"],
    quickActions: [
      { label: "Catat Pemasukan / Pengeluaran", href: "/finance", requiredPermission: "finance:write" },
      { label: "Ekspor Laporan Keuangan", href: "/reports" },
      { label: "Lihat Direktori Warga", href: "/residents", requiredPermission: "residents:read" },
    ],
  },
  PENGURUS: {
    headline: "Operasional Lapangan & Pemeliharaan Prasarana",
    subtitle:
      "Penanganan tiket pengaduan lapangan, inspeksi jalan, drainase, fasilitas umum, dan aset lingkungan.",
    focusModules: ["Tindak Lanjut Aduan", "Inspeksi Aset Spasial", "Info Lingkungan"],
    quickActions: [
      { label: "Tangani Pengaduan Warga", href: "/complaints", requiredPermission: "complaints:read" },
      { label: "Peta & Inspeksi Aset", href: "/gis", requiredPermission: "gis:read" },
      { label: "Pusat Informasi", href: "/notifications" },
    ],
  },
  WARGA: {
    headline: "Beranda Layanan Warga RT 06 RW 01",
    subtitle:
      "Pantau informasi resmi lingkungan, ajukan pengaduan fasilitas, periksa profil keluarga, dan jelajahi peta perumahan.",
    focusModules: ["Pengumuman RT", "Pengaduan Saya", "Profil & Rumah", "Peta Lingkungan"],
    quickActions: [
      { label: "Ajukan Pengaduan Baru", href: "/complaints", requiredPermission: "complaints:write" },
      { label: "Jelajahi Peta Lingkungan", href: "/gis", requiredPermission: "gis:read" },
      { label: "Lihat Profil & Keluarga", href: "/residents", requiredPermission: "residents:read" },
    ],
  },
};

const ROLE_PRIORITY: Role[] = [
  "SUPER_ADMIN",
  "ADMIN_RW",
  "KETUA_RT",
  "BENDAHARA_RT",
  "SEKRETARIS_RT",
  "PENGURUS",
  "WARGA",
];

export function resolveDashboardConfig(roles: Role[]): RoleDashboardConfig {
  const primaryRole =
    ROLE_PRIORITY.find((r) => roles.includes(r)) || "WARGA";
  const base = ROLE_CONFIG_MAP[primaryRole];

  return {
    primaryRole,
    headline: base.headline,
    subtitle: base.subtitle,
    focusModules: base.focusModules,
    quickActions: base.quickActions.filter(
      (a) => !a.requiredPermission || hasPermission(roles, a.requiredPermission)
    ),
  };
}
