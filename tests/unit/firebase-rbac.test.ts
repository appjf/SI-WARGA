import { describe, it, expect } from "vitest";
import { hasPermission, hasRole } from "../../lib/rbac/matrix";

describe("GGR-ICMS RBAC Permission & Role Matrix", () => {
  it("Super Admin has all permissions and roles", () => {
    const roles = ["SUPER_ADMIN"] as const;
    expect(hasRole(roles as any, "SUPER_ADMIN")).toBe(true);
    expect(hasRole(roles as any, "ADMIN_RW")).toBe(true);
    expect(hasPermission(roles as any, "users:manage_roles")).toBe(true);
    expect(hasPermission(roles as any, "finance:approve")).toBe(true);
  });

  it("Bendahara RT has finance permissions but cannot manage user roles", () => {
    const roles = ["BENDAHARA_RT"] as const;
    expect(hasRole(roles as any, "BENDAHARA_RT")).toBe(true);
    expect(hasRole(roles as any, "SUPER_ADMIN")).toBe(false);
    expect(hasPermission(roles as any, "finance:read")).toBe(true);
    expect(hasPermission(roles as any, "finance:write")).toBe(true);
    expect(hasPermission(roles as any, "finance:approve")).toBe(true);
    expect(hasPermission(roles as any, "users:manage_roles")).toBe(false);
  });

  it("Warga has limited permissions", () => {
    const roles = ["WARGA"] as const;
    expect(hasRole(roles as any, "WARGA")).toBe(true);
    expect(hasRole(roles as any, "KETUA_RT")).toBe(false);
    expect(hasPermission(roles as any, "complaints:write")).toBe(true);
    expect(hasPermission(roles as any, "finance:write")).toBe(false);
    expect(hasPermission(roles as any, "users:manage_roles")).toBe(false);
  });

  it("Ketua RT has approval and management permissions", () => {
    const roles = ["KETUA_RT"] as const;
    expect(hasRole(roles as any, "KETUA_RT")).toBe(true);
    expect(hasPermission(roles as any, "finance:approve")).toBe(true);
    expect(hasPermission(roles as any, "complaints:manage")).toBe(true);
    expect(hasPermission(roles as any, "households:write")).toBe(true);
  });
});
