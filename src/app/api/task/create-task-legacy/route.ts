import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-task-legacy - Create task from errors (legacy format)
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE TASK LEGACY API ROUTE STARTED");

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

    if (
      !body.ErrorIds ||
      !Array.isArray(body.ErrorIds) ||
      body.ErrorIds.length === 0
    ) {
      console.log("❌ Validation failed: Invalid ErrorIds");
      return NextResponse.json(
        { error: "At least one error ID is required" },
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

    // Call external API through apiClient (legacy endpoint)
    const result = await apiClient.task.createTaskFromErrorsLegacy(body);

    console.log("✅ Legacy task created successfully:", result);
    return NextResponse.json({
      taskId: result,
      success: true,
      message: "Task created successfully (legacy)",
    });
  } catch (error) {
    console.error("❌ Failed to create legacy task:", error);
    return NextResponse.json(
      { error: "Failed to create legacy task" },
      { status: 500 }
    );
  }
}
