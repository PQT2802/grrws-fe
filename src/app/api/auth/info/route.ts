import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// Assumed UserInfo type (adjust based on actual API response)
interface UserInfo {
  id: string;
  username: string;
  email?: string;
  role: string;
}

// Ensure dynamic routing for API call
export const dynamic = "force-dynamic";

// GET /api/auth/info - Get user information with token
export async function GET(
  req: NextRequest
): Promise<NextResponse<UserInfo | { error: string; details?: string }>> {
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

    // Extract the token
    const token = authorization.replace("Bearer ", "");
    if (!token) {
      console.log("❌ [SERVER] Invalid token format");
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }
    console.log("🔑 [SERVER] Extracted token for backend call");

    console.log("🔄 [SERVER] About to call backend with token...");
    const userInfo = await apiClient.user.getInfoWithToken(token);
    console.log("✅ [SERVER] Backend user info response:", userInfo);

    return NextResponse.json(userInfo as unknown as UserInfo, { status: 200 });
  } catch (error: any) {
    console.error("❌ [SERVER] Get user info failed:");
    console.error("  Error name:", error.name);
    console.error("  Error message:", error.message);

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
