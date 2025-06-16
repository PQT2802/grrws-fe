import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// PUT /api/sparePart/requests/delivered - Mark parts as delivered
export async function PUT(request: NextRequest) {
  try {
    console.log("INTERNAL API: Marking parts as delivered");
    const requestData = await request.json();
    
    console.log("Request data received:", requestData);
    
    // Transform the data into the format expected by the external API
    const apiRequestData = {
      SparePartUsageIds: requestData.sparePartUsageIds,
      IsTakenFromStock: true
    };
    
    console.log("Transformed request data for external API:", apiRequestData);
    
    // Call the external API
    const response = await apiClient.sparePart.updateTakenFromStock(
      requestData.sparePartUsageIds
    );
    
    console.log("Parts marked as delivered successfully");
    
    return NextResponse.json({
      success: true,
      message: "Parts marked as delivered successfully",
      data: response
    });
  } catch (error) {
    console.error("Failed to mark parts as delivered:", error);
    return NextResponse.json(
      { error: "Failed to mark parts as delivered" },
      { status: 500 }
    );
  }
}