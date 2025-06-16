import http from '@/lib/http';
import { 
  SPAREPART_REQUEST, 
  SPAREPART_REQUESTS_RESPONSE,
  SPAREPART_REQUEST_DETAIL,
  SPAREPART_REQUEST_DETAIL_RESPONSE,
  SPAREPART_INVENTORY_RESPONSE
} from '@/types/sparePart.type';

// Spare part service for stock keeper operations
export const sparePartService = {
  // Get all spare part requests
  getSparePartRequests: async (): Promise<SPAREPART_REQUESTS_RESPONSE> => {
    return http.get<SPAREPART_REQUESTS_RESPONSE>('/api/sparePart/requests', {
      useInternalRoute: true,
    });
  },

  // Get a specific spare part request by ID
  getSparePartRequestById: async (requestId: string): Promise<SPAREPART_REQUEST> => {
    return http.get<SPAREPART_REQUEST>(`/api/sparePart/requests/${requestId}`, {
      useInternalRoute: true,
    });
  },

  // Get a specific request by ID with full details
  getSparePartRequestDetail: async (requestId: string): Promise<SPAREPART_REQUEST_DETAIL_RESPONSE> => {
    return http.get<SPAREPART_REQUEST_DETAIL_RESPONSE>(`/api/sparePart/requests/${requestId}`, {
      useInternalRoute: true,
    });
  },

  // Get spare part inventory with pagination
  getSparePartInventory: async (
    pageNumber: number = 1, 
    pageSize: number = 10
  ): Promise<SPAREPART_INVENTORY_RESPONSE> => {
    return http.get<SPAREPART_INVENTORY_RESPONSE>(
      `/api/sparePart/inventory?pageNumber=${pageNumber}&pageSize=${pageSize}`, 
      {
        useInternalRoute: true,
      }
    );
  },

  // Import a new spare part
  importSparePart: async (formData: FormData): Promise<any> => {
    return http.post('/api/sparePart/import', formData, {
      useInternalRoute: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update a spare part
  updateSparePart: async (id: string, formData: FormData | any): Promise<any> => {
    // Convert FormData to JSON if needed
    let jsonData: any;
    
    if (formData instanceof FormData) {
      jsonData = {};
      formData.forEach((value, key) => {
        // Skip image file for now
        if (key !== 'ImageFile') {
          // Convert number strings to numbers
          if (!isNaN(Number(value)) && typeof value === 'string' && value !== '') {
            jsonData[key] = Number(value);
          } else {
            jsonData[key] = value;
          }
        }
      });
    } else {
      // Already JSON format
      jsonData = formData;
    }
    
    const response = await http.put(`/api/sparePart/${id}`, jsonData, {
      useInternalRoute: true,
    });
    
    // Add this log to verify the data returned
    console.log('Updated spare part data:', response);
    
    return response;
  },

  // Update just the quantity of a spare part
  updateSparePartQuantity: async (
    sparePartId: string,
    quantity: number,
    method: 'Import' | 'Export' | 'Adjustment' = 'Adjustment',
    date: string = new Date().toISOString()
  ): Promise<any> => {
    // Calculate final quantity based on method
    let finalQuantity = quantity;
    
    if (method === 'Export' || method === 'Import') {
      // For Export/Import, we need to first get the current quantity
      try {
        const currentPart = await sparePartService.getSparePartById(sparePartId);
        if (currentPart?.data) {
          const currentQuantity = currentPart.data.stockQuantity;
          
          // Calculate new quantity based on method
          if (method === 'Export') {
            finalQuantity = Math.max(0, currentQuantity - quantity);
          } else if (method === 'Import') {
            finalQuantity = currentQuantity + quantity;
          }
        }
      } catch (error) {
        console.error("Error getting current quantity:", error);
        throw error;
      }
    }
    const data = {
      quantity: finalQuantity,
      method
    };
    
    return http.put(`/api/sparePart/${sparePartId}/quantity`, data, {
      useInternalRoute: true
    });
  },

  // Get a specific spare part by ID
  getSparePartById: async (partId: string): Promise<any> => {
    try {
      console.log(`Service: Fetching spare part by ID: ${partId}`);
      const response = await http.get<any>(`/api/sparePart/${partId}`, {
        useInternalRoute: true,
      });
      return response;
    } catch (error) {
      console.error(`Service: Error fetching spare part ${partId}:`, error);
      throw error; 
    }
  },

  // Update request status to Confirmed
  confirmSparePartRequest: async (
    requestId: string,
    confirmedById: string,
    notes: string
  ): Promise<any> => {
    console.log(`Service: Confirming request ${requestId}`);
    return http.put('/api/sparePart/requests/confirm', {
      requestId: requestId,
      confirmedById: confirmedById,
      notes: notes
    }, {
      useInternalRoute: true,
    });
  },

  // Mark parts as insufficient/unavailable
  markPartsAsUnavailable: async (
    requestId: string,
    sparePartIds: string[],
    expectedAvailabilityDate: string,
    notes: string
  ): Promise<any> => {
    console.log(`Service: Marking parts as unavailable for request ${requestId}`);
    return http.put('/api/sparePart/requests/insufficient', {
      requestId: requestId,
      sparePartIds: sparePartIds,
      expectedAvailabilityDate: expectedAvailabilityDate,
      notes: notes
    }, {
      useInternalRoute: true,
    });
  },

  // Mark parts as delivered (taken from stock)
  markPartsAsDelivered: async (
    sparePartUsageIds: string[]
  ): Promise<any> => {
    console.log(`Service: Marking parts as delivered: ${sparePartUsageIds.join(', ')}`);
    return http.put('/api/sparePart/requests/delivered', {
      sparePartUsageIds: sparePartUsageIds
    }, {
      useInternalRoute: true,
    });
  },
};