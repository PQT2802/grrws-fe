import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/error/spareparts - Get spare parts for specific error IDs
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 GET SPARE PARTS BY ERROR IDS API ROUTE STARTED");

    const body = await request.json();
    const { errorIds } = body;

    console.log("📨 Request body received:", body);
    console.log("📨 Error IDs received:", errorIds);
    console.log("📨 Error IDs type:", typeof errorIds);
    console.log("📨 Error IDs length:", errorIds?.length);

    // Validate errorIds
    if (!Array.isArray(errorIds) || errorIds.length === 0) {
      console.log("❌ Validation failed: errorIds is not a valid array");
      return NextResponse.json(
        { error: "errorIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Log each error ID for debugging
    errorIds.forEach((id, index) => {
      console.log(`📨 Error ID ${index}:`, id, typeof id);
    });

    console.log("🎯 About to call external API with error IDs:", errorIds);

    try {
      // ✅ Now this will send the array directly to match the curl format
      const spareParts = await apiClient.task.getSpareParts(errorIds);

      console.log("✅ Spare parts fetched successfully:");
      console.log("📊 Number of spare parts:", spareParts?.length || 0);
      console.log("📋 Sample data:", spareParts?.slice(0, 2)); // Log first 2 items

      return NextResponse.json(spareParts);
    } catch (apiError) {
      const errorMessage =
        apiError instanceof Error ? apiError.message : "Unknown error";
      const errorStack = apiError instanceof Error ? apiError.stack : undefined;

      console.error("🔥 API Client Error Details:", {
        message: errorMessage,
        stack: errorStack,
        errorIds: errorIds,
      });

      // Try to get more details about the error
      if (apiError && typeof apiError === "object" && "response" in apiError) {
        console.error("🔥 API Response Error:", {
          status: (apiError as any).response?.status,
          statusText: (apiError as any).response?.statusText,
          data: await (apiError as any).response
            ?.text?.()
            .catch(() => "Could not read response text"),
        });
      }

      // Return more specific error
      return NextResponse.json(
        {
          error: "External API error",
          details: errorMessage,
          statusCode:
            apiError && typeof apiError === "object" && "response" in apiError
              ? (apiError as any).response?.status || 500
              : 500,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Route error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
