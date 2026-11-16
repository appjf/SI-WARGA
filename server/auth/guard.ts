import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserProfile, createAuditLog } from "@/lib/firebase/admin-firestore";
import { Role, Permission, hasPermission, hasRole } from "@/lib/rbac/matrix";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  roles: Role[];
  status: "active" | "inactive" | "disabled" | "pending";
  residentId?: string;
  houseId?: string;
  decodedToken: DecodedIdToken;
}

export type AuthSuccess = {
  success: true;
  user: AuthenticatedUser;
};

export type AuthFailure = {
  success: false;
  status: 401 | 403;
  code: string;
  message: string;
  response: NextResponse;
};

export type AuthResult = AuthSuccess | AuthFailure;

export function createErrorResponse(
  status: 401 | 403,
  code: string,
  message: string,
  requestId: string = crypto.randomUUID()
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
      meta: {
        requestId,
      },
    },
    { status }
  );
}

export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Authenticates the incoming request using Firebase Admin SDK with token revocation checking.
 * UID and user identity are extracted exclusively from the verified token.
 * Account status is verified against trusted Firestore server record.
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  const requestId = crypto.randomUUID();
  const token = extractBearerToken(req);

  if (!token) {
    return {
      success: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Missing or malformed Authorization header with Bearer token",
      response: createErrorResponse(401, "UNAUTHORIZED", "Missing or malformed Authorization header", requestId),
    };
  }

  try {
    // checkRevoked: true enforces token revocation verification on every request
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (!decodedToken || !decodedToken.uid) {
      return {
        success: false,
        status: 401,
        code: "INVALID_TOKEN",
        message: "Failed to verify identity token",
        response: createErrorResponse(401, "INVALID_TOKEN", "Invalid or malformed token", requestId),
      };
    }

    const uid = decodedToken.uid;

    // Retrieve trusted user profile from Firestore to enforce active account status and authoritative roles
    let userProfile: Record<string, any> | null = null;
    try {
      const profile = await getUserProfile(uid);
      userProfile = profile || null;
    } catch (dbErr) {
      console.warn("Could not retrieve Firestore user profile, defaulting to claims or standard role:", dbErr);
    }

    // Verify account active status (deny disabled / suspended accounts)
    const accountStatus = userProfile?.status || "active";
    if (accountStatus === "disabled" || accountStatus === "suspended") {
      await createAuditLog({
        actorUid: uid,
        action: "AUTH_DENIED_DISABLED_ACCOUNT",
        entityType: "user",
        entityId: uid,
        result: "UNAUTHORIZED",
        requestId,
      });

      return {
        success: false,
        status: 401,
        code: "ACCOUNT_DISABLED",
        message: "User account is suspended or disabled by administrator",
        response: createErrorResponse(401, "ACCOUNT_DISABLED", "User account is suspended or disabled", requestId),
      };
    }

    // Role resolution: Custom claims take precedence if verified; then Firestore document; fallback to WARGA
    let roles: Role[] = [];
    if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
      roles = decodedToken.roles as Role[];
    } else if (typeof decodedToken.role === "string" && decodedToken.role) {
      roles = [decodedToken.role as Role];
    } else if (userProfile && Array.isArray(userProfile.roles) && userProfile.roles.length > 0) {
      roles = userProfile.roles as Role[];
    } else if (userProfile && typeof userProfile.role === "string" && userProfile.role) {
      roles = [userProfile.role as Role];
    } else {
      roles = ["WARGA"];
    }

    // Check for super admin override via verified custom claim
    if (decodedToken.admin === true && !roles.includes("SUPER_ADMIN")) {
      roles.push("SUPER_ADMIN");
    }

    const authenticatedUser: AuthenticatedUser = {
      uid,
      email: decodedToken.email,
      roles,
      status: accountStatus,
      residentId: userProfile?.residentId,
      houseId: userProfile?.houseId,
      decodedToken,
    };

    return {
      success: true,
      user: authenticatedUser,
    };
  } catch (error: any) {
    const errorCode = error?.code || "UNAUTHORIZED";
    let message = "Authentication failed: invalid token";

    if (errorCode === "auth/id-token-revoked") {
      message = "Authentication failed: token has been revoked";
    } else if (errorCode === "auth/id-token-expired") {
      message = "Authentication failed: token has expired";
    }

    return {
      success: false,
      status: 401,
      code: "UNAUTHORIZED",
      message,
      response: createErrorResponse(401, "UNAUTHORIZED", message, requestId),
    };
  }
}

/**
 * Reusable guard to mandate authentication. Returns AuthResult.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  return authenticateRequest(req);
}

/**
 * Reusable guard enforcing a specific RBAC permission.
 * Returns 401 on auth failure, 403 on permission deficiency.
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<AuthResult> {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return auth;
  }

  const allowed = hasPermission(auth.user.roles, permission);
  if (!allowed) {
    const requestId = crypto.randomUUID();
    await createAuditLog({
      actorUid: auth.user.uid,
      action: "PERMISSION_DENIED",
      entityType: "permission",
      entityId: permission,
      result: "UNAUTHORIZED",
      metadata: { roles: auth.user.roles, requiredPermission: permission },
      requestId,
    });

    return {
      success: false,
      status: 403,
      code: "FORBIDDEN",
      message: `Access denied: missing required permission [${permission}]`,
      response: createErrorResponse(403, "FORBIDDEN", "Forbidden: insufficient permissions", requestId),
    };
  }

  return auth;
}

/**
 * Reusable guard enforcing a specific role or higher hierarchy.
 */
export async function requireRole(
  req: NextRequest,
  requiredRole: Role
): Promise<AuthResult> {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return auth;
  }

  const allowed = hasRole(auth.user.roles, requiredRole);
  if (!allowed) {
    const requestId = crypto.randomUUID();
    await createAuditLog({
      actorUid: auth.user.uid,
      action: "ROLE_DENIED",
      entityType: "role",
      entityId: requiredRole,
      result: "UNAUTHORIZED",
      metadata: { roles: auth.user.roles, requiredRole },
      requestId,
    });

    return {
      success: false,
      status: 403,
      code: "FORBIDDEN",
      message: `Access denied: required role [${requiredRole}]`,
      response: createErrorResponse(403, "FORBIDDEN", "Forbidden: insufficient role privileges", requestId),
    };
  }

  return auth;
}

/**
 * Reusable guard enforcing that the user has at least one of the specified roles.
 */
export async function requireAnyRole(
  req: NextRequest,
  allowedRoles: Role[]
): Promise<AuthResult> {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return auth;
  }

  const isSuperAdmin = auth.user.roles.includes("SUPER_ADMIN");
  const hasMatchingRole = isSuperAdmin || allowedRoles.some((r) => auth.user.roles.includes(r));

  if (!hasMatchingRole) {
    const requestId = crypto.randomUUID();
    return {
      success: false,
      status: 403,
      code: "FORBIDDEN",
      message: `Access denied: must have one of [${allowedRoles.join(", ")}]`,
      response: createErrorResponse(403, "FORBIDDEN", "Forbidden: insufficient role privileges", requestId),
    };
  }

  return auth;
}
