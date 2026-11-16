import type { Permission, Role } from "./matrix";
import { hasPermission } from "./matrix";

export interface NavItemConfig {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  requiredPermission?: Permission;
  requiredRoles?: Role[];
  section: "utama" | "operasional" | "tata_kelola";
}

export const APP_NAVIGATION: readonly NavItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Beranda",
    href: "/dashboard",
    section: "utama",
  },
  {
    id: "residents",
    label: "Warga & Rumah Tangga",
    shortLabel: "Warga",
    href: "/residents",
    requiredPermission: "residents:read",
    section: "operasional",
  },
  {
    id: "finance",
    label: "Keuangan & Kas RT",
    shortLabel: "Keuangan",
    href: "/finance",
    requiredPermission: "finance:read",
    section: "operasional",
  },
  {
    id: "complaints",
    label: "Pengaduan Warga",
    shortLabel: "Aduan",
    href: "/complaints",
    requiredPermission: "complaints:read",
    section: "operasional",
  },
  {
    id: "gis",
    label: "Peta & Aset Spasial",
    shortLabel: "Peta GIS",
    href: "/gis",
    requiredPermission: "gis:read",
    section: "operasional",
  },
  {
    id: "notifications",
    label: "Notifikasi & Pengumuman",
    shortLabel: "Info",
    href: "/notifications",
    section: "utama",
  },
  {
    id: "reports",
    label: "Laporan & Analitik",
    shortLabel: "Laporan",
    href: "/reports",
    section: "tata_kelola",
  },
  {
    id: "admin-users",
    label: "Kelola Pengguna & Peran",
    shortLabel: "Pengguna",
    href: "/admin/users",
    requiredPermission: "users:read",
    section: "tata_kelola",
  },
  {
    id: "profile",
    label: "Profil & Hak Akses",
    shortLabel: "Profil",
    href: "/profile",
    section: "tata_kelola",
  },
];

export function getVisibleNavigation(roles: Role[]): NavItemConfig[] {
  return APP_NAVIGATION.filter((item) => {
    if (item.requiredPermission && !hasPermission(roles, item.requiredPermission)) {
      return false;
    }
    if (
      item.requiredRoles &&
      !roles.includes("SUPER_ADMIN") &&
      !item.requiredRoles.some((r) => roles.includes(r))
    ) {
      return false;
    }
    return true;
  });
}
