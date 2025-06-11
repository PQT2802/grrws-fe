import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/sparePart/requests/[request-id] - Get spare part request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { 'request-id': string } | Promise<{ 'request-id': string }> }
) {
  try {
    // Properly await params if it's a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestParam = resolvedParams['request-id'];
    
    if (!requestParam) {
      return NextResponse.json(
        { error: "Request identifier is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching details for request: ${requestParam}`);
    
    // Get the specific request by ID
    const sparePartRequest = await apiClient.sparePart.getRequestById(requestParam);
    return NextResponse.json(sparePartRequest);
    
  } catch (error) {
    console.error("Failed to fetch spare part request:", error);
    return NextResponse.json(
      { error: "Failed to fetch spare part request" },
      { status: 500 }
    );
  }
}