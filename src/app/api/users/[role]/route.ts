import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

// GET /api/users/[role] - Get users by role number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    console.log("🔄 GET USERS BY ROLE API ROUTE STARTED");

    // Await params in Next.js 15
    const resolvedParams = await params;
    const roleParam = resolvedParams.role;

    console.log("📨 Role parameter from URL:", roleParam);

    // Parse role as number
    const role = parseInt(roleParam, 10);

    if (isNaN(role)) {
      return NextResponse.json(
        { error: "Role must be a valid number" },
        { status: 400 }
      );
    }

    console.log("🎯 About to call external API with role:", role);

    // Call external API through apiClient
    const users = await apiClient.user.getUsersByRole(role);

    console.log("✅ Users fetched successfully:", users);
    return NextResponse.json(users);
  } catch (error) {
    console.error("❌ Failed to fetch users by role:", error);
    return NextResponse.json(
      { error: "Failed to fetch users by role" },
      { status: 500 }
    );
  }
}
