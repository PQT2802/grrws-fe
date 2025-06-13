import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// PUT /api/sparePart/{id}/quantity - Update just the quantity of a spare part
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`INTERNAL API: Updating quantity for spare part with ID: ${id}`);
    
    const data = await request.json();
    const { quantity, method } = data;
    
    // For debugging purposes
    console.log("Update quantity data:", data);
    
    // Calculate the new quantity based on method
    let newQuantity = quantity;
    if (method === 'Adjustment') {
      // For adjustment, directly use the provided quantity
      newQuantity = quantity;
    }
    
    // Call the correct API endpoint
    const response = await apiClient.sparePart.updateStockQuantity(id, newQuantity);
    
    console.log("Spare part quantity updated successfully:", response);
    
    return NextResponse.json({ 
      success: true, 
      message: "Quantity updated successfully",
      data: response 
    });
  } catch (error) {
    console.error(`Failed to update quantity for spare part:`, error);
    return NextResponse.json(
      { error: `Failed to update quantity: ${error}` },
      { status: 500 }
    );
  }
}