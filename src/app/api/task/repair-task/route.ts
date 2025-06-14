import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-repair - Create repair task
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE REPAIR TASK API ROUTE STARTED");
    const body = await request.json();
    console.log("📨 Request body:", body);

    // Validation (keep your existing validation code)
    if (!body.RequestId) {
      console.log("❌ Validation failed: Missing RequestId");
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (!body.StartDate) {
      console.log("❌ Validation failed: Missing StartDate");
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      );
    }

    if (!body.AssigneeId) {
      console.log("❌ Validation failed: Missing AssigneeId");
      return NextResponse.json(
        { error: "Assignee ID is required" },
        { status: 400 }
      );
    }

    if (
      !body.ErrorGuidelineIds ||
      !Array.isArray(body.ErrorGuidelineIds) ||
      body.ErrorGuidelineIds.length === 0
    ) {
      console.log("❌ Validation failed: Invalid ErrorGuidelineIds");
      return NextResponse.json(
        { error: "At least one error guideline ID is required" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed. Calling external API...");

    // ✅ Call external API with detailed error handling
    try {
      console.log("🔄 Calling apiClient.task.createRepairTask...");
      const result = await apiClient.task.createRepairTask(body);

      console.log("✅ External API success:", result);
      return NextResponse.json({
        taskId: result,
        success: true,
        message: "Repair task created successfully",
      });
    } catch (apiError: any) {
      console.error("❌ External API error:", apiError);

      // ✅ Log detailed error information
      console.error("❌ Error details:", {
        message: apiError?.message,
        status: apiError?.status,
        response: apiError?.response,
        stack: apiError?.stack,
      });

      // ✅ Check if it's an HTTP error
      if (apiError?.response) {
        const errorData = await apiError.response.text();
        console.error("❌ API Error Response:", errorData);

        return NextResponse.json(
          {
            error: "External API error",
            details: errorData,
            status: apiError.response.status,
          },
          { status: 502 }
        );
      }

      // ✅ Check if it's a network error
      if (apiError?.message?.includes("fetch")) {
        return NextResponse.json(
          { error: "Network error connecting to external API" },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error: "External API error",
          details: apiError?.message || "Unknown error",
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("❌ Route handler error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
