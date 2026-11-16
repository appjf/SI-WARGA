import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requirePermission(req, "users:read");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const snapshot = await adminDb.collection("users").limit(100).get();
    const users = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        email: d.email || "",
        displayName: d.displayName || "",
        roles: Array.isArray(d.roles) ? d.roles : ["WARGA"],
        status: d.status || "active",
        residentId: d.residentId || null,
        houseId: d.houseId || null,
        updatedAt: d.updatedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: users,
      meta: { count: users.length, requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list users";
    return NextResponse.json(
      {
        success: false,
        error: { code: "FETCH_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
