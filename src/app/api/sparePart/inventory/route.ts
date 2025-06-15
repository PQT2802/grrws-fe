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
    
    let formattedResponse;
    
    if (response && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        if (response.data.totalCount <= response.data.pageSize || response.data.totalCount === response.data.data.length) {
       
          let estimatedTotalCount = response.data.totalCount;
          
          
          if (pageNumber === 1 && response.data.data.length < pageSize) { estimatedTotalCount = response.data.data.length;} 

          else if (response.data.data.length === pageSize) {
            const headerTotalCount = response.headers?.get('x-total-count');
            if (headerTotalCount) {
              estimatedTotalCount = parseInt(headerTotalCount, 10);
            } else {
              // Otherwise estimate conservatively - at least one more page
              estimatedTotalCount = pageNumber * pageSize + pageSize;
            }
          }
          
          console.log(`API returned suspicious totalCount (${response.data.totalCount}), estimated to ${estimatedTotalCount}`);
          formattedResponse = {
            data: {
              data: response.data.data,
              totalCount: estimatedTotalCount,
              pageNumber: response.data.pageNumber || pageNumber,
              pageSize: response.data.pageSize || pageSize
            }
          };
        } else {
          formattedResponse = response; // Use as is if totalCount seems reasonable
          console.log(`Found ${response.data.data.length} spare parts (page ${response.data.pageNumber} of ${Math.ceil(response.data.totalCount / response.data.pageSize)})`);
        }
      }
      else if (Array.isArray(response.data)) {
        formattedResponse = { 
          data: { 
            data: response.data,
            totalCount: response.data.length,
            pageNumber: pageNumber,
            pageSize: pageSize
          } 
        };
        console.log(`Found ${response.data.length} spare parts (falling back to simple pagination)`);
      }
      // Unexpected structure
      else {
        console.log("Unexpected response structure:", response);
        formattedResponse = { 
          data: { 
            data: [],
            totalCount: 0,
            pageNumber: pageNumber,
            pageSize: pageSize
          } 
        };
      }

      console.log("API Response structure check:", {
        "totalCount": response.data.totalCount,
        "dataLength": response.data.data?.length,
        "pageSize": response.data.pageSize,
        "pageNumber": response.data.pageNumber
      });
    } else {
      formattedResponse = { 
        data: { 
          data: [],
          totalCount: 0,
          pageNumber: pageNumber,
          pageSize: pageSize
        } 
      };
      console.log("Empty or invalid response from API");
    }
    
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Failed to fetch spare part inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch spare part inventory" },
      { status: 500 }
    );
  }
}