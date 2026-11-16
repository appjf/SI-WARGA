import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { generateAnalyticsReport } from "@/server/business-logic/analytics";
import { createAuditLog } from "@/lib/firebase/admin-firestore";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const exportMode = searchParams.get("export");

    const analytics = await generateAnalyticsReport(auth.user.roles);

    if (exportMode === "csv" || exportMode === "json") {
      await createAuditLog({
        actorUid: auth.user.uid,
        action: "EXPORT_ANALYTICS_REPORT",
        entityType: "report",
        entityId: `analytics-${exportMode}`,
        result: "SUCCESS",
        metadata: { format: exportMode, roles: auth.user.roles },
        requestId,
      });
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: { requestId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate analytics report";
    return NextResponse.json(
      {
        success: false,
        error: { code: "ANALYTICS_ERROR", message },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
