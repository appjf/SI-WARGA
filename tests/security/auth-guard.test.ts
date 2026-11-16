import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  requireAuth,
  requirePermission,
  requireRole,
  requireAnyRole,
  authenticateRequest,
} from "@/server/auth/guard";
import { adminAuth } from "@/lib/firebase/admin";
import * as adminFirestore from "@/lib/firebase/admin-firestore";

describe("Work Package A — Centralized Authorization & Server Guard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createRequest(authHeader?: string): NextRequest {
    const headers = new Headers();
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }
    return new NextRequest("http://localhost:3000/api/v1/test", { headers });
  }

  describe("Authentication Gate (Missing / Invalid / Revoked / Expired Tokens)", () => {
    it("rejects requests missing Authorization header with HTTP 401 and code UNAUTHORIZED", async () => {
      const req = createRequest();
      const result = await requireAuth(req);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.code).toBe("UNAUTHORIZED");
        expect(result.message).toContain("Missing or malformed Authorization header");
      }
    });

    it("rejects requests with malformed Authorization header (non-Bearer)", async () => {
      const req = createRequest("Basic dXNlcjpwYXNz");
      const result = await requireAuth(req);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects invalid tokens with HTTP 401", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockRejectedValue(new Error("Firebase ID token has invalid signature."));

      const req = createRequest("Bearer invalid-token-string");
      const result = await requireAuth(req);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects expired tokens with HTTP 401 and specific expiration notice", async () => {
      const expiredError: any = new Error("Firebase ID token has expired.");
      expiredError.code = "auth/id-token-expired";
      vi.spyOn(adminAuth, "verifyIdToken").mockRejectedValue(expiredError);

      const req = createRequest("Bearer expired-token");
      const result = await requireAuth(req);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.message).toContain("token has expired");
      }
    });

    it("rejects revoked tokens with HTTP 401 and enforces revocation checking", async () => {
      const verifySpy = vi.spyOn(adminAuth, "verifyIdToken").mockImplementation(async (token, checkRevoked) => {
        expect(checkRevoked).toBe(true); // Verification check must be passed true
        const revokedError: any = new Error("Firebase ID token has been revoked.");
        revokedError.code = "auth/id-token-revoked";
        throw revokedError;
      });

      const req = createRequest("Bearer revoked-token");
      const result = await requireAuth(req);

      expect(verifySpy).toHaveBeenCalledWith("revoked-token", true);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.message).toContain("token has been revoked");
      }
    });

    it("rejects disabled or suspended user accounts with HTTP 401", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "user-disabled-123",
        email: "disabled@ggr.id",
      } as any);

      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({
        uid: "user-disabled-123",
        status: "disabled",
      } as any);

      const req = createRequest("Bearer valid-token-but-disabled-user");
      const result = await requireAuth(req);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.code).toBe("ACCOUNT_DISABLED");
        expect(result.message).toContain("suspended or disabled");
      }
    });
  });

  describe("Role Hierarchy & Authoritative Identity Resolution", () => {
    it("extracts UID strictly from verified token (ignoring body/query)", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "legit-uid-999",
        email: "warga@ggr.id",
      } as any);

      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({
        uid: "legit-uid-999",
        status: "active",
        roles: ["WARGA"],
      } as any);

      const req = createRequest("Bearer valid-token");
      const result = await requireAuth(req);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.uid).toBe("legit-uid-999");
        expect(result.user.roles).toContain("WARGA");
      }
    });

    it("prefers custom claims for roles when present on the decoded token", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "bendahara-uid",
        email: "bendahara@ggr.id",
        roles: ["BENDAHARA_RT"],
      } as any);

      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({
        status: "active",
      } as any);

      const req = createRequest("Bearer token");
      const result = await requireAuth(req);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.roles).toEqual(["BENDAHARA_RT"]);
      }
    });

    it("elevates user to SUPER_ADMIN when admin claim is set", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "superadmin-uid",
        admin: true,
      } as any);

      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue(null);

      const req = createRequest("Bearer token");
      const result = await requireAuth(req);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.roles).toContain("SUPER_ADMIN");
      }
    });
  });

  describe("RBAC Permission & Role Guards", () => {
    it("allows user with required permission", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "sekretaris-uid",
        roles: ["SEKRETARIS_RT"],
      } as any);
      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({ status: "active" } as any);

      const req = createRequest("Bearer token");
      const result = await requirePermission(req, "residents:read");

      expect(result.success).toBe(true);
    });

    it("denies user lacking required permission with HTTP 403 Forbidden", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "warga-uid",
        roles: ["WARGA"],
      } as any);
      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({ status: "active" } as any);

      const req = createRequest("Bearer token");
      // WARGA does not have finance:approve
      const result = await requirePermission(req, "finance:approve");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(403);
        expect(result.code).toBe("FORBIDDEN");
        expect(result.message).toContain("missing required permission");
      }
    });

    it("blocks privilege escalation attempt: WARGA cannot access users:manage_roles", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "warga-uid",
        roles: ["WARGA"],
      } as any);
      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({ status: "active" } as any);

      const req = createRequest("Bearer token");
      const result = await requirePermission(req, "users:manage_roles");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(403);
      }
    });

    it("verifies requireAnyRole allows matching roles and denies non-matching roles", async () => {
      vi.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: "bendahara-uid",
        roles: ["BENDAHARA_RT"],
      } as any);
      vi.spyOn(adminFirestore, "getUserProfile").mockResolvedValue({ status: "active" } as any);

      const req = createRequest("Bearer token");
      const allowedResult = await requireAnyRole(req, ["BENDAHARA_RT", "KETUA_RT"]);
      expect(allowedResult.success).toBe(true);

      const deniedResult = await requireAnyRole(req, ["SUPER_ADMIN", "ADMIN_RW"]);
      expect(deniedResult.success).toBe(false);
      if (!deniedResult.success) {
        expect(deniedResult.status).toBe(403);
      }
    });
  });
});
