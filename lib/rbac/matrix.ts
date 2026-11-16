export type Role =
  | "SUPER_ADMIN"
  | "ADMIN_RW"
  | "KETUA_RT"
  | "SEKRETARIS_RT"
  | "BENDAHARA_RT"
  | "PENGURUS"
  | "WARGA";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:manage_roles"
  | "residents:read"
  | "residents:write"
  | "households:read"
  | "households:write"
  | "finance:read"
  | "finance:write"
  | "finance:approve"
  | "complaints:read"
  | "complaints:write"
  | "complaints:manage"
  | "gis:read"
  | "gis:write"
  | "audit:read"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "users:read",
    "users:write",
    "users:manage_roles",
    "residents:read",
    "residents:write",
    "households:read",
    "households:write",
    "finance:read",
    "finance:write",
    "finance:approve",
    "complaints:read",
    "complaints:write",
    "complaints:manage",
    "gis:read",
    "gis:write",
    "audit:read",
    "settings:manage",
  ],
  ADMIN_RW: [
    "users:read",
    "residents:read",
    "residents:write",
    "households:read",
    "households:write",
    "finance:read",
    "complaints:read",
    "complaints:manage",
    "gis:read",
    "gis:write",
    "audit:read",
  ],
  KETUA_RT: [
    "users:read",
    "residents:read",
    "residents:write",
    "households:read",
    "households:write",
    "finance:read",
    "finance:approve",
    "complaints:read",
    "complaints:manage",
    "gis:read",
    "audit:read",
  ],
  SEKRETARIS_RT: [
    "residents:read",
    "residents:write",
    "households:read",
    "households:write",
    "complaints:read",
    "complaints:write",
    "gis:read",
  ],
  BENDAHARA_RT: [
    "finance:read",
    "finance:write",
    "finance:approve",
    "residents:read",
  ],
  PENGURUS: [
    "residents:read",
    "complaints:read",
    "complaints:write",
    "gis:read",
  ],
  WARGA: [
    "residents:read", // own profile
    "complaints:read",
    "complaints:write", // own complaints
    "gis:read",
  ],
};

export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  if (userRoles.includes("SUPER_ADMIN")) return true;
  return userRoles.some((role) => {
    const perms = ROLE_PERMISSIONS[role];
    return perms && perms.includes(permission);
  });
}

export function hasRole(userRoles: Role[], requiredRole: Role): boolean {
  if (userRoles.includes("SUPER_ADMIN")) return true;
  return userRoles.includes(requiredRole);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN_RW: "Administrator RW 01",
  KETUA_RT: "Ketua RT 06",
  SEKRETARIS_RT: "Sekretaris RT 06",
  BENDAHARA_RT: "Bendahara RT 06",
  PENGURUS: "Pengurus RT 06",
  WARGA: "Warga RT 06",
};

export const ALL_ROLES: readonly Role[] = [
  "SUPER_ADMIN",
  "ADMIN_RW",
  "KETUA_RT",
  "SEKRETARIS_RT",
  "BENDAHARA_RT",
  "PENGURUS",
  "WARGA",
];

export function getEffectivePermissions(userRoles: Role[]): Permission[] {
  const permSet = new Set<Permission>();
  for (const role of userRoles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) {
      for (const p of perms) {
        permSet.add(p);
      }
    }
  }
  return Array.from(permSet);
}

