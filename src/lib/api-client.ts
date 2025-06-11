import http from "@/lib/http";
import { AuthUser } from "@/types/auth.type";
import {
  SUGGEST_OBJECT_REQUEST,
  SUGGEST_OBJECT_RESPONSE,
} from "@/types/comon.type";
import { CREATE_ERROR_DETAIL } from "@/types/error.type";
import {
  REQUEST_SUMMARY,
  TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";
import {
  CREATE_SIMPLE_TASK_WEB,
  CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB,
  CREATE_TASK_WEB,
  SPAREPART_WEB,
} from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { WARRANTY_HISTORY_LIST, WARRANTY_LIST } from "@/types/warranty.type";
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
      console.log(
        "🔧 API Client getTechnicalIssueOfRequest called with requestId:",
        requestId
      );
      console.log("🔗 Target URL: /api/Request/technical-issues/{requestId}");
      return http.get<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]>(
        `/api/Request/technical-issues/${requestId}`
      );
    },
  };
  task = {
    // Get spare parts for a specific request
    getSpareParts: (errorIds: string[]): Promise<SPAREPART_WEB[]> => {
      // ✅ Send error IDs as direct array, not wrapped in object
      return http.post<SPAREPART_WEB[]>(
        "/api/Error/spare-parts/list",
        errorIds // ✅ Direct array: ["id1", "id2"] instead of { errorIds: ["id1", "id2"] }
      );
    },
    // Create a new task from errors
    createTaskFromErrors: (data: CREATE_TASK_WEB): Promise<any> => {
      return http.post("/api/Task/create-task", data); // ✅ Auto token
    },
    createTaskFromTechnicalIssue: (
      data: CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB
    ): Promise<any> => {
      console.log(
        "🔧 API Client createTaskFromTechnicalIssue called with:",
        data
      );
      console.log("🔗 Target URL: /api/Task/create-from-technical-issue");
      return http.post("/api/Task/create-from-technical-issue", data);
    },
    // ✅ Create simple task (Replace tasks) - /api/Task/create-simple
    createSimpleTask: (data: CREATE_SIMPLE_TASK_WEB): Promise<any> => {
      console.log("🔧 API Client createSimpleTask called with:", data);
      console.log("🔗 Target URL: /api/Task/create-simple");
      return http.post("/api/Task/create-simple", data);
    },
    // ✅ DEPRECATED - keeping for backward compatibility
    createTaskFromErrorsLegacy: (
      data: CREATE_SIMPLE_TASK_WEB
    ): Promise<any> => {
      console.log(
        "🔧 API Client createTaskFromErrorsLegacy called with:",
        data
      );
      console.log("🔗 Target URL: /api/Task/create-task");
      return http.post("/api/Task/create-task", data);
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
      return http.post("/api/Error/create-error-detail", errorDetail); // ✅ Auto token
    },
  };
  warranty = {
    // Get warranty history for a specific device
    getWarrantyHistory: (
      deviceId: string
    ): Promise<WARRANTY_HISTORY_LIST[]> => {
      console.log(
        "🔧 API Client getWarrantyHistory called with deviceId:",
        deviceId
      );
      console.log("🔗 Target URL: /api/DeviceWarranty/history/{deviceId}");
      return http.get<WARRANTY_HISTORY_LIST[]>(
        `/api/DeviceWarranty/history/${deviceId}`
      );
    },

    // Get warranties for a specific device
    getDeviceWarranties: (deviceId: string): Promise<WARRANTY_LIST[]> => {
      console.log(
        "🔧 API Client getDeviceWarranties called with deviceId:",
        deviceId
      );
      console.log("🔗 Target URL: /api/DeviceWarranty/Warranties/{deviceId}");
      return http.get<WARRANTY_LIST[]>(
        `/api/DeviceWarranty/Warranties/${deviceId}`
      );
    },
  };
  sparePart = {
    // Get all spare part requests
    getRequests: (): Promise<any> => {
      console.log("Getting all spare part requests");
      return http.get('/api/SparePartUsage/requests');
    },
    
    // Get a specific request by ID (UUID)
    getRequestById: (requestId: string): Promise<any> => {
      console.log(`Getting spare part request by ID: ${requestId}`);
      return http.get(`/api/SparePartUsage/requests/${requestId}`);
    }
  };
}

export const apiClient = new APIClient();
