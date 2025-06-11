import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/sparePart/requests - Get all spare part requests
export async function GET(request: NextRequest) {
  try {
    console.log("INTERNAL API: Fetching spare part requests");
    const sparePartRequests = await apiClient.sparePart.getRequests();
    
    console.log("Spare part requests fetched successfully:", 
      sparePartRequests?.data?.data?.length || 0);
    
    return NextResponse.json(sparePartRequests);
  } catch (error) {
    console.error("Failed to fetch spare part requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch spare part requests" },
      { status: 500 }
    );
  }
}