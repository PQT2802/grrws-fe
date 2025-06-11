import http from '@/lib/http';
import { 
  SPAREPART_REQUEST, 
  SPAREPART_REQUESTS_RESPONSE,
  SPAREPART_REQUEST_DETAIL,
  SPAREPART_REQUEST_DETAIL_RESPONSE
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
};