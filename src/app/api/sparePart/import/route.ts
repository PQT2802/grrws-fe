import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// POST /api/sparePart/import - Import a new spare part
export async function POST(request: NextRequest) {
  try {
    console.log("INTERNAL API: Importing spare part");
    const formData = await request.formData();
    const response = await apiClient.sparePart.importSparePart(formData);
    
    console.log("Spare part imported successfully:", response);
    
    return NextResponse.json({ 
      success: true, 
      message: "Spare part imported successfully",
      data: response 
    });
  } catch (error) {
    console.error("Failed to import spare part:", error);
    return NextResponse.json(
      { error: "Failed to import spare part" },
      { status: 500 }
    );
  }
}