import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserProfile, createAuditLog } from "@/lib/firebase/admin-firestore";
import { extractBearerToken } from "@/server/auth/guard";
import { Role } from "@/lib/rbac/matrix";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    let token = extractBearerToken(req);

    if (!token) {
      try {
        const body = await req.json();
        token = body.idToken;
      } catch {
        // Body was empty or not json
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing ID token in Authorization header or request body" },
          meta: { requestId },
        },
        { status: 401 }
      );
    }

    // Verify token with revocation check enabled
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid or expired Firebase ID token" },
          meta: { requestId },
        },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;
    const userProfile = await getUserProfile(uid);

    // Verify account active status
    const accountStatus = userProfile?.status || "active";
    if (accountStatus === "disabled" || accountStatus === "suspended") {
      await createAuditLog({
        actorUid: uid,
        action: "AUTH_VERIFY_TOKEN_REJECTED",
        entityType: "user",
        entityId: uid,
        result: "UNAUTHORIZED",
        metadata: { reason: "Account disabled" },
        requestId,
      });

      return NextResponse.json(
        {
          success: false,
          error: { code: "ACCOUNT_DISABLED", message: "User account is suspended or disabled" },
          meta: { requestId },
        },
        { status: 401 }
      );
    }

    // Resolve authoritative roles
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

    if (decodedToken.admin === true && !roles.includes("SUPER_ADMIN")) {
      roles.push("SUPER_ADMIN");
    }

    await createAuditLog({
      actorUid: uid,
      action: "AUTH_VERIFY_TOKEN",
      entityType: "user",
      entityId: uid,
      result: "SUCCESS",
      metadata: { email: decodedToken.email, roles },
      requestId,
    });

    return NextResponse.json({
      success: true,
      data: {
        uid,
        email: decodedToken.email,
        roles,
        status: accountStatus,
        residentId: userProfile?.residentId || null,
        houseId: userProfile?.houseId || null,
      },
      meta: { requestId },
    });
  } catch (error: any) {
    const errorCode = error?.code || "UNAUTHORIZED";
    let message = "Invalid or expired Firebase ID token";

    if (errorCode === "auth/id-token-revoked") {
      message = "Token has been revoked";
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message },
        meta: { requestId },
      },
      { status: 401 }
    );
  }
}
