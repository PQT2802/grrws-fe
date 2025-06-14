import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-uninstall - Create uninstall task
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE UNINSTALL TASK API ROUTE STARTED");

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

    if (!body.AssigneeId) {
      console.log("❌ Validation failed: Missing AssigneeId");
      return NextResponse.json(
        { error: "Assignee ID is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const result = await apiClient.task.createUninstallTask(body);

    console.log("✅ Uninstall task created successfully:", result);
    return NextResponse.json({
      taskId: result,
      success: true,
      message: "Uninstall task created successfully",
    });
  } catch (error) {
    console.error("❌ Failed to create uninstall task:", error);
    return NextResponse.json(
      { error: "Failed to create uninstall task" },
      { status: 500 }
    );
  }
}
