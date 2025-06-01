import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// GET /api/error/[request-id] - Get errors for a request
export async function GET(
  request: NextRequest,
  { params }: { params: { "request-id": string } }
) {
  try {
    const requestId = params["request-id"];

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const errors = await apiClient.request.getErrorOfRequest(requestId);

    return NextResponse.json(errors);
  } catch (error) {
    console.error("Failed to fetch errors:", error);
    return NextResponse.json(
      { error: "Failed to fetch errors" },
      { status: 500 }
    );
  }
}
