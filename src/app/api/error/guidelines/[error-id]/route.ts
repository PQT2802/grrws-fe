import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// GET /api/error/guidelines/[error-id] - Get error guidelines
export async function GET(
  request: NextRequest,
  { params }: { params: { "error-id": string } }
) {
  try {
    console.log("🔄 GET ERROR GUIDELINES API ROUTE STARTED");

    const errorId = params["error-id"];
    console.log("📨 Error ID:", errorId);

    if (!errorId) {
      return NextResponse.json(
        { error: "Error ID is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const response = await apiClient.error.getErrorGuidelines(errorId);

    console.log("📨 Raw API response:", response);

    // ✅ Handle array response from external API
    let guideline;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        return NextResponse.json(
          { error: "No guidelines found for this error" },
          { status: 404 }
        );
      }
      guideline = response[0]; // Take first guideline
    } else {
      guideline = response;
    }

    console.log("✅ Processed guideline:", guideline);
    return NextResponse.json(guideline);
  } catch (error) {
    console.error("❌ Failed to fetch error guidelines:", error);
    return NextResponse.json(
      { error: "Failed to fetch error guidelines" },
      { status: 500 }
    );
  }
}
