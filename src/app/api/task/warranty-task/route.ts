import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-warranty - Create warranty task
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE WARRANTY TASK API ROUTE STARTED");

    const body = await request.json();
    console.log("📨 Request body:", body);

    // Validate required fields
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

    if (!body.DeviceWarrantyId) {
      console.log("❌ Validation failed: Missing DeviceWarrantyId");
      return NextResponse.json(
        { error: "Device warranty ID is required" },
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
      !body.TechnicalIssueIds ||
      !Array.isArray(body.TechnicalIssueIds) ||
      body.TechnicalIssueIds.length === 0
    ) {
      console.log("❌ Validation failed: Invalid TechnicalIssueIds");
      return NextResponse.json(
        { error: "At least one technical issue ID is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const result = await apiClient.task.createWarrantyTask(body);

    console.log("✅ Warranty task created successfully:", result);
    return NextResponse.json({
      taskId: result, // Assuming the API returns a taskId
      success: true,
      message: "Warranty task created successfully",
    });
  } catch (error) {
    console.error("❌ Failed to create warranty task:", error);
    return NextResponse.json(
      { error: "Failed to create warranty task" },
      { status: 500 }
    );
  }
}
