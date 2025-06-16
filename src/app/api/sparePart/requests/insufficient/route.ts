import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// PUT /api/sparePart/requests/insufficient - Mark parts as unavailable
export async function PUT(request: NextRequest) {
  try {
    console.log("INTERNAL API: Marking parts as unavailable");
    const requestData = await request.json();
    
    console.log("Request data received:", requestData);
    
    // Transform the data into the format expected by the external API
    const apiRequestData = {
      RequestTakeSparePartUsageId: requestData.requestId,
      SparePartIds: requestData.sparePartIds,
      ExpectedAvailabilityDate: requestData.expectedAvailabilityDate,
      Notes: requestData.notes
    };
    
    console.log("Transformed request data for external API:", apiRequestData);
    
    // Call the external API
    const response = await apiClient.sparePart.updateInsufficientStatus(
      requestData.requestId,
      requestData.sparePartIds,
      requestData.expectedAvailabilityDate,
      requestData.notes
    );
    
    console.log("Parts marked as unavailable successfully");
    
    return NextResponse.json({
      success: true,
      message: "Parts marked as unavailable successfully",
      data: response
    });
  } catch (error) {
    console.error("Failed to mark parts as unavailable:", error);
    return NextResponse.json(
      { error: "Failed to mark parts as unavailable" },
      { status: 500 }
    );
  }
}