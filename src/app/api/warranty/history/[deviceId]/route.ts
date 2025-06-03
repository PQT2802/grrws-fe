import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    console.log("🔄 GET WARRANTY HISTORY API ROUTE STARTED");

    const { deviceId } = params;
    console.log("📨 Device ID:", deviceId);

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    const result = await apiClient.warranty.getWarrantyHistory(deviceId);

    console.log("✅ Warranty history fetched successfully:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Failed to fetch warranty history:", error);
    return NextResponse.json(
      { error: "Failed to fetch warranty history" },
      { status: 500 }
    );
  }
}
