import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    console.log("🔄 GET DEVICE WARRANTIES API ROUTE STARTED");

    const { deviceId } = params;
    console.log("📨 Device ID:", deviceId);

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    const result = await apiClient.warranty.getDeviceWarranties(deviceId);

    console.log("✅ Device warranties fetched successfully:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Failed to fetch device warranties:", error);
    return NextResponse.json(
      { error: "Failed to fetch device warranties" },
      { status: 500 }
    );
  }
}
