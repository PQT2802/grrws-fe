import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// PUT /api/sparePart/requests/confirm - Confirm spare part request
export async function PUT(request: NextRequest) {
  try {
    console.log("INTERNAL API: Confirming spare part request");
    const requestData = await request.json();
    
    console.log("Request data received:", requestData);
    
    // Transform the data into the format expected by the external API
    const apiRequestData = {
      RequestTakeSparePartUsageId: requestData.requestId,
      Status: 'Confirmed',
      ConfirmedById: requestData.confirmedById,
      Notes: requestData.notes
    };
    
    console.log("Transformed request data for external API:", apiRequestData);
    
    // Call the external API
    const response = await apiClient.sparePart.updateStatus(
      requestData.requestId,
      requestData.confirmedById,
      requestData.notes
    );
    
    console.log("Request confirmed successfully");
    
    return NextResponse.json({
      success: true,
      message: "Request confirmed successfully",
      data: response
    });
  } catch (error) {
    console.error("Failed to confirm spare part request:", error);
    return NextResponse.json(
      { error: "Failed to confirm spare part request" },
      { status: 500 }
    );
  }
}