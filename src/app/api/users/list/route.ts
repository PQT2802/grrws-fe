// import { NextRequest, NextResponse } from "next/server";
// import { apiClient } from "@/lib/api-client";

// export async function GET(request: NextRequest) {
//   try {
//     // Get query parameters
//     const searchParams = request.nextUrl.searchParams;
//     const pageNumber = searchParams.get("pageNumber") || "1";
//     const pageSize = searchParams.get("pageSize") || "10";
    
//     console.log(`🔄 Proxying user list request to external API: page=${pageNumber}, size=${pageSize}`);
    
//     // Make the external API call
//     const users = await apiClient.user.getUsersList();
//     return NextResponse.json(users);
//   } catch (error) {
//     console.error("❌ Error fetching users from external API:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch users" },
//       { status: 500 }
//     );
//   }
// }