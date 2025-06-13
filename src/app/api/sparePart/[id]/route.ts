import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/sparePart/{id} - Get a specific spare part
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    
    console.log(`INTERNAL API: Getting spare part with ID: ${id}`);
    
    // Call the external API to get the part details
    const response = await apiClient.sparePart.getPartById(id);
    
    // Handle the nested response structure - extensions.data contains the actual data
    if (response && response.extensions && response.extensions.data) {
      return NextResponse.json({ 
        success: true,
        data: response.extensions.data
      });
    } else if (response && response.data) {
      // Fallback for older API structure
      return NextResponse.json({
        success: true,
        data: response.data
      });
    }
    
    return NextResponse.json(
      { error: `Spare part not found with ID: ${id}` },
      { status: 404 }
    );
  } catch (error) {
    console.error(`Failed to get spare part:`, error);
    return NextResponse.json(
      { error: `Failed to get spare part: ${error}` },
      { status: 500 }
    );
  }
}

// PUT /api/sparePart/{id} - Update an existing spare part
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`INTERNAL API: Updating spare part with ID: ${id}`);
    
    const jsonData = await request.json();
    console.log("JSON data:", jsonData);
    
    const response = await apiClient.sparePart.updateSparePart(id, jsonData);
    
    console.log("Spare part updated successfully:", response);
    
    return NextResponse.json({ 
      success: true, 
      message: "Spare part updated successfully",
      data: response 
    });
  } catch (error) {
    console.error(`Failed to update spare part:`, error);
    return NextResponse.json(
      { error: `Failed to update spare part: ${error}` },
      { status: 500 }
    );
  }
}