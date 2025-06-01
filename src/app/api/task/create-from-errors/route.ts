import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// POST /api/task/create-from-errors - Create task from errors
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 CREATE TASK FROM ERRORS API ROUTE STARTED");

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

    if (!body.AssigneeId) {
      console.log("❌ Validation failed: Missing AssigneeId");
      return NextResponse.json(
        { error: "Assignee ID is required" },
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

    console.log("✅ All validations passed");
    console.log("📋 Validated data:", {
      RequestId: body.RequestId,
      TaskType: body.TaskType,
      errorCount: body.ErrorIds.length,
      AssigneeId: body.AssigneeId,
      sparepartCount: body.SparepartIds?.length || 0,
    });

    try {
      // Call external API through apiClient with detailed logging
      console.log("🎯 About to call apiClient.task.createTaskFromErrors");
      console.log("🔗 Target URL: /api/Task/create-task");
      console.log("📤 Sending data:", JSON.stringify(body, null, 2));

      const result = await apiClient.task.createTaskFromErrors(body);

      console.log("✅ Task created successfully:");
      console.log("📊 Result:", result);
      return NextResponse.json(result);
    } catch (apiError) {
      const errorMessage =
        apiError instanceof Error ? apiError.message : "Unknown error";

      console.error("🔥 API Client Error Details:", {
        message: errorMessage,
        stack: apiError instanceof Error ? apiError.stack : undefined,
        requestData: body,
      });

      // Enhanced error handling to get response details
      try {
        // Try to get the actual response from the error
        if (
          apiError &&
          typeof apiError === "object" &&
          "response" in apiError
        ) {
          const response = (apiError as any).response;
          console.error("🔥 API Response Error Details:", {
            status: response?.status,
            statusText: response?.statusText,
            url: response?.url,
            headers: response?.headers,
          });

          // Try to read the response body
          if (response && typeof response.text === "function") {
            try {
              const responseText = await response.text();
              console.error("🔥 API Response Body:", responseText);

              // Try to parse as JSON for better error details
              try {
                const responseJson = JSON.parse(responseText);
                console.error("🔥 API Response JSON:", responseJson);

                return NextResponse.json(
                  {
                    error: "External API error",
                    details:
                      responseJson.message ||
                      responseJson.title ||
                      errorMessage,
                    apiResponse: responseJson,
                    statusCode: response.status,
                  },
                  { status: response.status || 500 }
                );
              } catch (parseError) {
                // Response is not JSON
                return NextResponse.json(
                  {
                    error: "External API error",
                    details: errorMessage,
                    responseText: responseText,
                    statusCode: response.status,
                  },
                  { status: response.status || 500 }
                );
              }
            } catch (readError) {
              console.error("❌ Could not read response text:", readError);
            }
          }
        }

        // Fallback error response
        return NextResponse.json(
          {
            error: "External API error",
            details: errorMessage,
            statusCode: 500,
          },
          { status: 500 }
        );
      } catch (errorHandlingError) {
        console.error("❌ Error while handling API error:", errorHandlingError);

        return NextResponse.json(
          {
            error: "External API error",
            details: errorMessage,
            statusCode: 500,
          },
          { status: 500 }
        );
      }
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
