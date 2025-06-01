import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// GET /api/task/[request-id] - Get tasks for a request
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
    const tasks = await apiClient.request.getTaskOfRequest(requestId);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/task/[request-id] - Create task from errors
// export async function POST(
//   request: NextRequest,
//   { params }: { params: { "request-id": string } }
// ) {
//   try {
//     const requestId = params["request-id"];
//     const body = await request.json();

//     if (!requestId) {
//       return NextResponse.json(
//         { error: "Request ID is required" },
//         { status: 400 }
//       );
//     }

//     if (
//       !body.errors ||
//       !Array.isArray(body.errors) ||
//       body.errors.length === 0
//     ) {
//       return NextResponse.json(
//         { error: "At least one error is required" },
//         { status: 400 }
//       );
//     }

//     // Prepare data for external API
//     const taskData = {
//       requestId: requestId,
//       errors: body.errors,
//     };

//     // Call external API through apiClient
//     const result = await apiClient.request.createTaskFromErrors(taskData);

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Failed to create task:", error);
//     return NextResponse.json(
//       { error: "Failed to create task" },
//       { status: 500 }
//     );
//   }
// }
