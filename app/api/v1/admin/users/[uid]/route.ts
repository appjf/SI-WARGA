import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { adminDb } from "@/lib/firebase/admin";
import { createAuditLog } from "@/lib/firebase/admin-firestore";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const roleEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN_RW",
  "KETUA_RT",
  "SEKRETARIS_RT",
  "BENDAHARA_RT",
  "PENGURUS",
  "WARGA",
]);

const updateUserRoleSchema = z.object({
  roles: z.array(roleEnum).min(1, "Minimal 1 peran wajib dipilih").optional(),
  status: z.enum(["active", "inactive", "disabled", "pending"]).optional(),
  residentId: z.string().max(80).nullable().optional(),
  houseId: z.string().max(80).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const requestId = crypto.randomUUID();
  const { uid } = await params;

  const auth = await requirePermission(req, "users:manage_roles");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateUserRoleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid role update",
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    // Prevent self-demotion/disabling of Super Admin accidentally
    if (uid === auth.user.uid && parsed.data.status === "disabled") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SELF_LOCKOUT_PREVENTED",
            message: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
          },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("users").doc(uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: `Pengguna [${uid}] tidak ditemukan.` },
          meta: { requestId },
        },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: auth.user.uid,
    };

    await docRef.update(updates);

    await createAuditLog({
      actorUid: auth.user.uid,
      action: "UPDATE_USER_ROLES",
      entityType: "user",
      entityId: uid,
      result: "SUCCESS",
      metadata: parsed.data,
      requestId,
    });

    const updated = await docRef.get();
    return NextResponse.json({
      success: true,
      data: { uid: updated.id, ...updated.data() },
      meta: { requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      {
        success: false,
        error: { code: "UPDATE_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
