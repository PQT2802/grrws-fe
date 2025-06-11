import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/sparePart/requests/[request-id] - Get spare part request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { 'request-id': string } }
) {
  try {
    const requestId = params['request-id'];
    
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }
    // Call external API through apiClient
    const sparePartRequest = await apiClient.sparePart.getRequestById(requestId);
    return NextResponse.json(sparePartRequest);
  } catch (error) {
    console.error("Failed to fetch spare part request:", error);
    return NextResponse.json(
      { error: "Failed to fetch spare part request" },
      { status: 500 }
    );
  }
}