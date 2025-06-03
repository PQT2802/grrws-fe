import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-simple - Create simple task (device replacement)
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE SIMPLE TASK API ROUTE STARTED");

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

    if (!body.TaskType) {
      console.log("❌ Validation failed: Missing TaskType");
      return NextResponse.json(
        { error: "Task type is required" },
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

    if (!body.DeviceToRemoveId) {
      console.log("❌ Validation failed: Missing DeviceToRemoveId");
      return NextResponse.json(
        { error: "Device to remove ID is required" },
        { status: 400 }
      );
    }

    if (!body.InstallationLocation) {
      console.log("❌ Validation failed: Missing InstallationLocation");
      return NextResponse.json(
        { error: "Installation location is required" },
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

    // Call external API through apiClient
    const result = await apiClient.task.createSimpleTask(body);

    console.log("✅ Simple task created successfully:", result);
    return NextResponse.json({
      taskId: result,
      success: true,
      message: "Replacement task created successfully",
    });
  } catch (error) {
    console.error("❌ Failed to create simple task:", error);
    return NextResponse.json(
      { error: "Failed to create simple task" },
      { status: 500 }
    );
  }
}
