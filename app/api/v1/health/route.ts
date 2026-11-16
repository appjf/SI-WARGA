import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: "GGR-ICMS BFF API (Next.js App Router)",
      version: "1.0.0",
      operationalArea: "RT 06 RW 01, Perum Green Garden Residence, Garut",
      status: "healthy",
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: crypto.randomUUID()
    }
  });
}
