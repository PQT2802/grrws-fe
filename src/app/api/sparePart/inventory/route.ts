import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/sparePart/inventory - Get all spare parts inventory with pagination
export async function GET(request: NextRequest) {
  try {
    // Extract pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = Number(searchParams.get('pageNumber') || 1);
    const pageSize = Number(searchParams.get('pageSize') || 10);

    console.log(`INTERNAL API: Fetching spare part inventory (page ${pageNumber}, size ${pageSize})`);
    const response = await apiClient.sparePart.getInventory(pageNumber, pageSize);
    
    console.log(`Retrieved spare parts inventory successfully`);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Failed to fetch spare part inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch spare part inventory" },
      { status: 500 }
    );
  }
}