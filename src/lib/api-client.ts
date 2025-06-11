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
}

export const apiClient = new APIClient();
