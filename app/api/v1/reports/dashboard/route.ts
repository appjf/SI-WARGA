import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { generateDashboardReport } from "@/server/business-logic/dashboard";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // Guard: require authentication
  const auth = await requireAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const reportData = await generateDashboardReport(auth.user.roles);

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: { requestId },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "REPORT_ERROR", message: error.message || "Failed to generate dashboard report" },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
