import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-from-technical-issue - Create task from technical issues
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE TASK FROM TECHNICAL ISSUE API ROUTE STARTED");

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

    if (!body.StartDate) {
      console.log("❌ Validation failed: Missing StartDate");
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      );
    }

    // Call external API through apiClient
    const result = await apiClient.task.createTaskFromTechnicalIssue(body);

    console.log("✅ Task from technical issue created successfully:", result);
    return NextResponse.json({
      taskId: result,
      success: true,
      message: "Warranty task created successfully",
    });
  } catch (error) {
    console.error("❌ Failed to create task from technical issue:", error);
    return NextResponse.json(
      { error: "Failed to create task from technical issue" },
      { status: 500 }
    );
  }
}
