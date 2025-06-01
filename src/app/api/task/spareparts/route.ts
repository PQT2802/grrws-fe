import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/spareparts - Get spare parts for specific errors
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 GET SPARE PARTS API ROUTE STARTED");

    const body = await request.json();
    console.log("📨 Request body:", body);

    // Validate errorIds
    if (
      !body.errorIds ||
      !Array.isArray(body.errorIds) ||
      body.errorIds.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one error ID is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const spareParts = await apiClient.task.getSpareParts(body.errorIds);

    console.log("✅ Spare parts fetched successfully:", spareParts);
    return NextResponse.json(spareParts);
  } catch (error) {
    console.error("❌ Failed to fetch spare parts:", error);
    return NextResponse.json(
      { error: "Failed to fetch spare parts" },
      { status: 500 }
    );
  }
}
