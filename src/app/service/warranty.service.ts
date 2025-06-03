// Create or update warranty.service.ts
import http from "@/lib/http";
import { WARRANTY_LIST, WARRANTY_HISTORY_LIST } from "@/types/warranty.type";

class WarrantyService {
  // Get warranty history for a device
  getWarrantyHistory = async (
    deviceId: string
  ): Promise<WARRANTY_HISTORY_LIST[]> => {
    console.log(
      "🔧 WarrantyService getWarrantyHistory called with deviceId:",
      deviceId
    );

    const history = await http.get<WARRANTY_HISTORY_LIST[]>(
      `/api/warranty/history/${deviceId}`,
      {
        useInternalRoute: true,
      }
    );

    console.log("✅ Warranty history fetched:", history);
    return history;
  };

  // Get warranties for a device
  getDeviceWarranties = async (deviceId: string): Promise<WARRANTY_LIST[]> => {
    console.log(
      "🔧 WarrantyService getDeviceWarranties called with deviceId:",
      deviceId
    );

    const warranties = await http.get<WARRANTY_LIST[]>(
      `/api/warranty/warranties/${deviceId}`,
      {
        useInternalRoute: true,
      }
    );

    console.log("✅ Device warranties fetched:", warranties);
    return warranties;
  };
}

const warrantyService = new WarrantyService();
export default warrantyService;
