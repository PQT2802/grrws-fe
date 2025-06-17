import http from "@/lib/http";
import { AuthUser } from "@/types/auth.type";
import {
  SUGGEST_OBJECT_REQUEST,
  SUGGEST_OBJECT_RESPONSE,
} from "@/types/comon.type";
import { DEVICE_WEB } from "@/types/device.type";
import { CREATE_ERROR_DETAIL, ErrorGuideline } from "@/types/error.type";
import {
  REQUEST_SUMMARY,
  TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";
import {
  CREATE_INSTALL_TASK,
  CREATE_REPAIR_TASK,
  CREATE_UNINSTALL_TASK,
  CREATE_WARRANTY_TASK,
  SPAREPART_WEB,
  TASK_GROUP_RESPONSE,
} from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import {
  WARRANTY_HISTORY_LIST,
  WARRANTY_LIST,
  WarrantyInfo,
} from "@/types/warranty.type";
import { create } from "domain";

class APIClient {
  // Auth methods - these are public (no token needed)
  auth = {
    signIn: (data: any) => http.postPublic("/api/Auth/sign-in", data), // ✅ Public
    signUp: (data: any) => http.postPublic("/api/Auth/sign-up", data), // ✅ Public
    refreshToken: (data: any) =>
      http.postPublic("/api/Auth/refresh-token", data), // ✅ Public
    logout: () => http.post("/api/Auth/logout", {}), // ✅ Requires auth
  };
  // User methods - these require authentication
  user = {
    getInfo: (): Promise<AuthUser> => {
      return http.get<AuthUser>("/api/User/user-infor"); // ✅ Auto token
    },

    // ✅ Method that accepts explicit token (for server-side)
    getInfoWithToken: (token: string): Promise<AuthUser> => {
      return http.get<AuthUser>("/api/User/user-infor", { jwtToken: token });
    },

    updateProfile: (data: any) => http.put("/api/User/update-profile", data), // ✅ Auto token
    changePassword: (data: any) => http.put("/api/User/change-password", data), // ✅ Auto token

    getMechanic: (): Promise<GET_MECHANIC_USER> => {
      return http.get<GET_MECHANIC_USER>("/api/User/role?role=3"); // ✅ Auto token
    },
    getUsersByRole: (role: number): Promise<GET_MECHANIC_USER> => {
      return http.get<GET_MECHANIC_USER>(`/api/User/role?role=${role}`); // ✅ Auto token
    },
  };
  // Workspace methods (when you add them) - these require authentication
  // workspace = {
  //   getAll: () => http.get('/api/Workspace'), // ✅ Auto token
  //   getById: (id: string) => http.get(`/api/Workspace/${id}`), // ✅ Auto token
  //   create: (data: any) => http.post('/api/Workspace', data), // ✅ Auto token
  //   update: (id: string, data: any) => http.put(`/api/Workspace/${id}`, data), // ✅ Auto token
  //   delete: (id: string) => http.delete(`/api/Workspace/${id}`), // ✅ Auto token
  //   join: (data: any) => http.post('/api/Workspace/join', data), // ✅ Auto token
  // };
  request = {
    getRequestSummary: (): Promise<REQUEST_SUMMARY> => {
      return http.get<REQUEST_SUMMARY>("/api/Request/get-summary"); // ✅ Auto token
    },
    getRequestDetail: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/detail/${requestId}`); // ✅ Auto token
    },
    getErrorOfRequest: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/errors/${requestId}`); // ✅ Auto token
    },
    getTaskOfRequest: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/tasks/${requestId}`); // ✅ Auto token
    },
    getTechnicalIssueOfRequest: (
      requestId: string
    ): Promise<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]> => {
      return http.get<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]>(
        `/api/Request/technical-issues/${requestId}`
      );
    },
  };
  task = {
    getSpareParts: (errorIds: string[]): Promise<SPAREPART_WEB[]> => {
      return http.post<SPAREPART_WEB[]>(
        "/api/Error/spare-parts/list",
        errorIds
      );
    },
    createRepairTask: (data: CREATE_REPAIR_TASK): Promise<any> => {
      return http.post("/api/Task/repair-task", data);
    },
    createWarrantyTask: (data: CREATE_WARRANTY_TASK): Promise<any> => {
      return http.post("/api/Task/warranty-task/submit", data);
    },
    createUninstallTask: (data: CREATE_UNINSTALL_TASK): Promise<any> => {
      return http.post("/api/Task/uninstall", data);
    },
    createInstallTask: (data: CREATE_INSTALL_TASK): Promise<any> => {
      return http.post("/api/Task/install", data);
    },
    getTaskGroups: (
      requestId: string,
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      return http.get(
        `/api/Task/groups/request/${requestId}?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },
    // New methods for single tasks and all task groups
    getSingleTasks: (
      pageNumber: number = 1,
      pageSize: number = 10,
      taskType?: string,
      status?: string,
      priority?: string,
      order?: string
    ): Promise<any> => {
      const params = new URLSearchParams({
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
      });

      // Only append parameters if they have actual values (not undefined and not "all")
      if (taskType && taskType !== "all") {
        params.append("TaskType", taskType);
      }
      if (status && status !== "all") {
        params.append("Status", status);
      }
      if (priority && priority !== "all") {
        params.append("Priority", priority);
      }
      if (order) {
        params.append("Order", order);
      }

      return http.get(`/api/Task/single-tasks?${params.toString()}`);
    },
    getAllTaskGroups: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<TASK_GROUP_RESPONSE> => {
      return http.get<TASK_GROUP_RESPONSE>(
        `/api/Task/groups?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },
  };
  error = {
    getSuggestedErrors: (
      request: SUGGEST_OBJECT_REQUEST
    ): Promise<SUGGEST_OBJECT_RESPONSE> => {
      return http.get(
        `/api/Error/suggestions?query=${request.query}&maxResults=${request.maxResults}`
      ); // ✅ Auto token
    },
    createErrorDetail: (errorDetail: CREATE_ERROR_DETAIL): Promise<any> => {
      return http.post("/api/Error/create-error-detail", errorDetail);
    },
    getErrorGuidelines: (errorId: string): Promise<ErrorGuideline[]> => {
      return http.get(`/api/ErrorGuideline/by-error/${errorId}`);
    },
  };
  warranty = {
    getWarrantyHistory: (
      deviceId: string
    ): Promise<WARRANTY_HISTORY_LIST[]> => {
      return http.get<WARRANTY_HISTORY_LIST[]>(
        `/api/DeviceWarranty/history/${deviceId}`
      );
    },
    getDeviceWarranties: (deviceId: string): Promise<WarrantyInfo[]> => {
      return http.get<WarrantyInfo[]>(
        `/api/DeviceWarranty/Warranties/${deviceId}`
      );
    },
  };

  device = {
    getDevices: (
      pageNumber: number,
      pageSize: number
    ): Promise<DEVICE_WEB[]> => {
      return http.get(
        `/api/Device/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      ); // ✅ Auto token
    },
  };
  
  sparePart = {
    getRequests: (): Promise<any> => {
      console.log("Getting all spare part requests");
      return http.get('/api/SparePartUsage/requests');
    },
    
    getRequestById: (requestId: string): Promise<any> => {
      console.log(`Getting spare part request by ID: ${requestId}`);
      return http.get(`/api/SparePartUsage/requests/${requestId}`);
    },
    
    getInventory: async (pageNumber: number = 1, pageSize: number = 10): Promise<any> => {
      console.log(`Getting spare parts inventory from external API (page ${pageNumber}, size ${pageSize})`);
      try {
        const response = await http.get(`/api/Sparepart?pageNumber=${pageNumber}&pageSize=${pageSize}`);
        console.log("External API response status:", (response as any)?.status || "unknown");
        console.log("Response data sample:", 
          JSON.stringify(response).substring(0, 100) + "...");
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    importSparePart: async (formData: FormData): Promise<any> => {
      console.log("Importing spare part to external API");
      try {
        const response = await http.post('/api/Sparepart', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    updateSparePart: async (id: string, jsonData: any): Promise<any> => {
      console.log(`Updating spare part with ID ${id} to external API`);
      try {
        console.log("Sending update data:", jsonData);
        const response = await http.put(`/api/Sparepart/${id}`, jsonData);
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    getPartById: async (id: string): Promise<any> => {
      console.log(`API Client: Getting spare part by ID: ${id}`);
      return http.get(`/api/Sparepart/${id}`); 
    },

    updateStockQuantity: async (sparePartId: string, stockQuantity: number): Promise<any> => {
      console.log(`Updating stock quantity for spare part with ID: ${sparePartId}`);
      try {
        const response = await http.put('/api/Sparepart/update-stock-quantity', {
          SparepartId: sparePartId,
          StockQuantity: stockQuantity
        });
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    // Update request status
    updateStatus: async (requestId: string, confirmedById: string, notes: string): Promise<any> => {
      console.log(`Updating request status to Confirmed: ${requestId}`);
      return http.put('/api/SparePartUsage/update-status', {
        RequestTakeSparePartUsageId: requestId,
        Status: 'Confirmed',
        ConfirmedById: confirmedById,
        Notes: notes
      });
    },
    
    // Update insufficient status (mark parts as unavailable)
    updateInsufficientStatus: async (
      requestId: string, 
      sparePartIds: string[], 
      expectedAvailabilityDate: string,
      notes: string
    ): Promise<any> => {
      console.log(`Marking spare parts as unavailable for request: ${requestId}`);
      return http.put('/api/SparePartUsage/update-insufficient-status', {
        RequestTakeSparePartUsageId: requestId,
        SparePartIds: sparePartIds,
        ExpectedAvailabilityDate: expectedAvailabilityDate,
        Notes: notes
      });
    },
    
    // Mark spare parts as taken from stock (delivered)
    updateTakenFromStock: async (sparePartUsageIds: string[]): Promise<any> => {
      console.log(`Marking spare parts as delivered: ${sparePartUsageIds.join(', ')}`);
      return http.put('/api/SparePartUsage/update-taken-from-stock', {
        SparePartUsageIds: sparePartUsageIds,
        IsTakenFromStock: true
      });
    },
  }
}

export const apiClient = new APIClient();
