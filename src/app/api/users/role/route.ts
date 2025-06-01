import { apiClient } from "@/lib/api-client";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/role?role=3 - Get users by role
export async function GET(request: NextRequest) {
  try {
    console.log("🔄 GET USERS BY ROLE API ROUTE STARTED");

    // Get role from query parameters
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");

    console.log("📨 Role parameter:", roleParam);

    // Validate role parameter
    if (!roleParam) {
      return NextResponse.json(
        { error: "Role parameter is required" },
        { status: 400 }
      );
    }

    const role = parseInt(roleParam, 10);

    if (isNaN(role)) {
      return NextResponse.json(
        { error: "Role must be a valid number" },
        { status: 400 }
      );
    }

    // Optional: Validate role values (if you have specific roles)
    const validRoles = [1, 2, 3]; // Admin, Manager, Mechanic, etc.
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Valid roles are: ${validRoles.join(", ")}` },
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
      {
        error: "Failed to fetch users by role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
