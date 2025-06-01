import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import http from "@/lib/http";
import { REQUEST_SUMMARY } from "@/types/request.type";

export async function GET(req: Request) {
  try {
    // ✅ Call the API client method to get request summary
    const requestSummary = await apiClient.request.getRequestSummary();
    return NextResponse.json(requestSummary, { status: 200 });
  } catch (error: any) {
    console.error("Failed to get request summary:", error.message);
    return NextResponse.json(
      { error: "Failed to get request summary" },
      { status: 500 }
    );
  }
}
