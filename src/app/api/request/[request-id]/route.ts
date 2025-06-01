import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// GET /api/request/[request-id] - Get request detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "request-id": string }> }
) {
  console.log("🔄 INTERNAL API ROUTE STARTED");

  // Await params in Next.js 15
  const resolvedParams = await params;
  console.log("📨 Params received:", resolvedParams);
  console.log("📨 Request ID from params:", resolvedParams["request-id"]);
  console.log("📨 Request URL:", request.url);

  try {
    const requestId = resolvedParams["request-id"];
    console.log(
      "🎯 About to call apiClient.request.getRequestDetail with:",
      requestId
    );

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const requestDetail = await apiClient.request.getRequestDetail(requestId);
    console.log("✅ External API response:", requestDetail);
    return NextResponse.json(requestDetail);
  } catch (error) {
    console.error("❌ INTERNAL API ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
