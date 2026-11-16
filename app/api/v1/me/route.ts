import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import {
  getUserProfile,
  upsertUserProfile,
  createAuditLog,
} from "@/lib/firebase/admin-firestore";
import { getEffectivePermissions } from "@/lib/rbac/matrix";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(2, "Nama tampilan minimal 2 karakter").max(80).optional(),
});

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    let profile = await getUserProfile(auth.user.uid).catch(() => null);

    // Initialize baseline user profile record on first authenticated access (strictly WARGA role, never elevated from client)
    if (!profile) {
      await upsertUserProfile(auth.user.uid, {
        email: auth.user.email || "",
        displayName:
          auth.user.decodedToken.name ||
          (auth.user.email ? auth.user.email.split("@")[0] : "Warga RT 06"),
        roles: auth.user.roles,
        status: auth.user.status,
      }).catch(() => null);
      profile = await getUserProfile(auth.user.uid).catch(() => null);
    }

    const permissions = getEffectivePermissions(auth.user.roles);

    return NextResponse.json({
      success: true,
      data: {
        uid: auth.user.uid,
        email: auth.user.email || profile?.email || null,
        displayName:
          profile?.displayName ||
          auth.user.decodedToken.name ||
          (auth.user.email ? auth.user.email.split("@")[0] : "Warga GGR"),
        roles: auth.user.roles,
        permissions,
        status: auth.user.status,
        residentId: auth.user.residentId || profile?.residentId || null,
        houseId: auth.user.houseId || profile?.houseId || null,
      },
      meta: { requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json(
      {
        success: false,
        error: { code: "PROFILE_FETCH_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid profile update",
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    // Never allow updating roles or status via /api/v1/me
    const updates: Record<string, unknown> = {};
    if (parsed.data.displayName !== undefined) {
      updates.displayName = parsed.data.displayName.trim();
    }

    if (Object.keys(updates).length > 0) {
      await upsertUserProfile(auth.user.uid, updates);
      await createAuditLog({
        actorUid: auth.user.uid,
        action: "UPDATE_OWN_PROFILE",
        entityType: "user",
        entityId: auth.user.uid,
        result: "SUCCESS",
        metadata: { fields: Object.keys(updates) },
        requestId,
      });
    }

    const profile = await getUserProfile(auth.user.uid).catch(() => null);
    return NextResponse.json({
      success: true,
      data: {
        uid: auth.user.uid,
        email: auth.user.email || profile?.email || null,
        displayName: profile?.displayName || parsed.data.displayName || "Warga GGR",
        roles: auth.user.roles,
        permissions: getEffectivePermissions(auth.user.roles),
        status: auth.user.status,
        residentId: auth.user.residentId || null,
        houseId: auth.user.houseId || null,
      },
      meta: { requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json(
      {
        success: false,
        error: { code: "PROFILE_UPDATE_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
