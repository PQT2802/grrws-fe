// import { NextRequest, NextResponse } from "next/server";
// import { apiClient } from "@/lib/api-client";

// // GET /api/technical-issue/[request-id] - Get technical issues for a request
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { "request-id": string } }
// ) {
//   try {
//     console.log("🔄 GET TECHNICAL ISSUES API ROUTE STARTED");

//     const requestId = params["request-id"];
//     console.log("📨 Request ID:", requestId);

//     if (!requestId) {
//       return NextResponse.json(
//         { error: "Request ID is required" },
//         { status: 400 }
//       );
//     }

//     // Call external API through apiClient
//     const technicalIssues = await apiClient.request.getTechnicalIssueOfRequest(
//       requestId
//     );

//     console.log("✅ Technical issues fetched successfully:", technicalIssues);
//     return NextResponse.json(technicalIssues);
//   } catch (error) {
//     console.error("❌ Failed to fetch technical issues:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch technical issues" },
//       { status: 500 }
//     );
//   }
// }
