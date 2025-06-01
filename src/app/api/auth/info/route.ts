import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export async function GET(req: Request) {
  try {
    console.log("🚀 [SERVER] API Route Called: /api/auth/info");

    const authorization = req.headers.get("authorization");
    console.log("🔑 [SERVER] Authorization header:", authorization);

    if (!authorization) {
      console.log("❌ [SERVER] No authorization header provided");
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    // ✅ Extract the token from the Authorization header
    const token = authorization.replace("Bearer ", "");
    console.log("🔑 [SERVER] Extracted token for backend call");

    console.log("🔄 [SERVER] About to call backend with token...");

    // ✅ Pass the token explicitly to the API client
    const userInfo = await apiClient.user.getInfoWithToken(token);
    console.log("✅ [SERVER] Backend user info response:", userInfo);

    return NextResponse.json(userInfo, { status: 200 });
  } catch (error: any) {
    console.error("❌ [SERVER] Get user info failed:");
    console.error("  Error name:", error.name);
    console.error("  Error message:", error.message);

    // ✅ Better error handling for common scenarios
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to get user information",
        details: error.message,
      },
      { status: 502 }
    );
  }
}
