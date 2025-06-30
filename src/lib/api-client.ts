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
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";
import {
  CREATE_INSTALL_TASK,
  CREATE_REPAIR_TASK,
  CREATE_UNINSTALL_TASK,
  CREATE_WARRANTY_TASK,
  CreateWarrantyReturn,
  INSTALL_TASK_DETAIL,
  SPAREPART_WEB,
  TASK_GROUP_RESPONSE,
  UNINSTALL_TASK_DETAIL,
  WARRANTY_TASK_DETAIL,
} from "@/types/task.type";
import { CREATE_USER_REQUEST, GET_MECHANIC_USER } from "@/types/user.type";
import {
  WARRANTY_HISTORY_LIST,
  WARRANTY_LIST,
  WarrantyInfo,
} from "@/types/warranty.type";
import {
  DASHBOARD_RESPONSE,
  TASK_STATISTICS,
  DEVICE_STATISTICS,
  TASK_REQUEST_REPORT_TOTAL,
  USER_COUNT_BY_ROLE,
  TASK_COMPLETION_COUNT,
  REQUEST_WITH_REPORT,
  TOP_ERROR_DEVICE,
  TOP_MECHANIC,
  MONTHLY_REQUEST_COUNT,
} from "@/types/dashboard.type";
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

    getMechanic: (): Promise<GET_MECHANIC_USER[]> => {
      return http.get<GET_MECHANIC_USER[]>("/api/User/role?role=3"); // ✅ Auto token
    },
    getUsersByRole: (role: number): Promise<GET_MECHANIC_USER> => {
      return http.get<GET_MECHANIC_USER>(`/api/User/role?role=${role}`);
    },

    getUsersList: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      return http.get(
        `/api/User/users/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    createUser: (data: CREATE_USER_REQUEST): Promise<any> => {
      // Ensure proper data format and structure
      const payload = {
        ...data,
        Role: Number(data.Role),
      };

      console.log("Creating user with final payload:", JSON.stringify(payload));
      return http.post("/api/User", payload);
    },

    getUserById: (userId: string): Promise<any> => {
      return http.get(`/api/User?requestId=${userId}`);
    },

    updateUser: (data: any): Promise<any> => {
      console.log("Updating user with payload:", JSON.stringify(data));
      return http.put("/api/User", data);
    },

    deleteUser: (userId: string): Promise<any> => {
      console.log("Disabling user with ID:", userId);
      return http.delete(`/api/User?requestId=${userId}`);
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

    createWarrantyReturnTask: (data: CreateWarrantyReturn): Promise<any> => {
      return http.post("/api/Task/warranty-task/return", data);
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
    applySuggestedGroupTasks: (taskGroupId: string): Promise<any> => {
      return http.post(
        `/api/Task/apply-suggested-group-assignments/${taskGroupId}`,
        {}
      );
    },

    getUninstallTaskDetail: (
      taskId: string
    ): Promise<UNINSTALL_TASK_DETAIL> => {
      return http.get<UNINSTALL_TASK_DETAIL>(
        `/api/Task/uninstall-task/${taskId}`
      );
    },

    getInstallTaskDetail: (taskId: string): Promise<INSTALL_TASK_DETAIL> => {
      return http.get<INSTALL_TASK_DETAIL>(`/api/Task/install-task/${taskId}`);
    },

    getWarrantyTaskDetail: (taskId: string): Promise<WARRANTY_TASK_DETAIL> => {
      return http.get<WARRANTY_TASK_DETAIL>(
        `/api/Task/warranty-task-submit/${taskId}`
      );
    },
    getWarrantyReturnTaskDetail: (
      taskId: string
    ): Promise<WARRANTY_TASK_DETAIL> => {
      return http.get<WARRANTY_TASK_DETAIL>(
        `/api/Task/warranty-task-return/${taskId}`
      );
    },

    getSuggestedMechanics: (
      pageSize: number = 5,
      pageIndex: number = 0
    ): Promise<{
      statusCode: number;
      title: string;
      type: string;
      extensions: {
        message: string;
        data: {
          mechanicId: string;
          fullName: string;
          averageCompletionTime: string;
          expectedTime: string;
          message: string;
        }[];
      };
    }> => {
      return http.get(
        `/api/Task/mechanicshift/suggest?pageSize=${pageSize}&pageIndex=${pageIndex}`
      );
    },

    updateWarrantyClaim: (formData: FormData): Promise<any> => {
      return http.put("/api/Task/warranty-claim/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },

    returnWarrantyTask: (data: {
      WarrantyClaimId: string;
      AssigneeId: string;
      ActualReturnDate: string;
      WarrantyNotes?: string;
    }): Promise<any> => {
      return http.post("/api/Task/warranty-task/return", data);
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

    getDeviceById: (deviceId: string): Promise<DEVICE_WEB> => {
      return http.get<DEVICE_WEB>(`/api/Device/${deviceId}`);
    },
  };

  sparePart = {
    getRequests: (): Promise<any> => {
      console.log("Getting all spare part requests");
      return http.get("/api/SparePartUsage/requests");
    },

    getRequestById: (requestId: string): Promise<any> => {
      console.log(`Getting spare part request by ID: ${requestId}`);
      return http.get(`/api/SparePartUsage/requests/${requestId}`);
    },

    // getInventory: async (pageNumber: number = 1, pageSize: number = 10): Promise<any> => {
    //   console.log(`Getting spare parts inventory from external API (page ${pageNumber}, size ${pageSize})`);
    //   try {
    //     const response = await http.get(`/api/Sparepart?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    //     console.log("External API response status:", (response as any)?.status || "unknown");
    //     console.log("Response data sample:",
    //       JSON.stringify(response).substring(0, 100) + "...");
    //     return response;
    //   } catch (error) {
    //     console.error("Error in external API call:", error);
    //     throw error;
    //   }
    // },

    getInventory: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<SPAREPART_INVENTORY_ITEM[]> => {
      return http.get<SPAREPART_INVENTORY_ITEM[]>(
        `/api/Sparepart?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    importSparePart: async (formData: FormData): Promise<any> => {
      console.log("Importing spare part to external API");
      try {
        const response = await http.post("/api/Sparepart", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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

    updateStockQuantity: async (
      sparePartId: string,
      stockQuantity: number
    ): Promise<any> => {
      console.log(
        `Updating stock quantity for spare part with ID: ${sparePartId}`
      );
      try {
        const response = await http.put(
          "/api/Sparepart/update-stock-quantity",
          {
            SparepartId: sparePartId,
            StockQuantity: stockQuantity,
          }
        );
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    // Update request status
    updateStatus: async (
      requestId: string,
      confirmedById: string,
      notes: string
    ): Promise<any> => {
      console.log(`Updating request status to Confirmed: ${requestId}`);
      return http.put("/api/SparePartUsage/update-status", {
        RequestTakeSparePartUsageId: requestId,
        Status: "Confirmed",
        ConfirmedById: confirmedById,
        Notes: notes,
      });
    },

    // Update insufficient status (mark parts as unavailable)
    updateInsufficientStatus: async (
      requestId: string,
      sparePartIds: string[],
      expectedAvailabilityDate: string,
      notes: string
    ): Promise<any> => {
      console.log(
        `Marking spare parts as unavailable for request: ${requestId}`
      );
      return http.put("/api/SparePartUsage/update-insufficient-status", {
        RequestTakeSparePartUsageId: requestId,
        SparePartIds: sparePartIds,
        ExpectedAvailabilityDate: expectedAvailabilityDate,
        Notes: notes,
      });
    },

    // Mark spare parts as taken from stock (delivered)
    updateTakenFromStock: async (sparePartUsageIds: string[]): Promise<any> => {
      console.log(
        `Marking spare parts as delivered: ${sparePartUsageIds.join(", ")}`
      );
      return http.put("/api/SparePartUsage/update-taken-from-stock", {
        SparePartUsageIds: sparePartUsageIds,
        IsTakenFromStock: true,
      });
    },
  };
  dashboard = {
    getTechnicalHeadStats: (): Promise<any> => {
      return http.get("/api/Dashboard/technical-head-stats");
    },

    getTaskStatistics: (): Promise<DASHBOARD_RESPONSE<TASK_STATISTICS>> => {
      console.log("Fetching task statistics from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TASK_STATISTICS>>(
        "/api/Dashboard/get-task-statistics"
      );
    },

    getDeviceStatistics: (): Promise<DASHBOARD_RESPONSE<DEVICE_STATISTICS>> => {
      console.log("Fetching device statistics from dashboard API");
      return http.get<DASHBOARD_RESPONSE<DEVICE_STATISTICS>>(
        "/api/Dashboard/get-device-statistics"
      );
    },

    getTaskRequestReportTotal: (): Promise<
      DASHBOARD_RESPONSE<TASK_REQUEST_REPORT_TOTAL>
    > => {
      console.log("Fetching task/request/report totals from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TASK_REQUEST_REPORT_TOTAL>>(
        "/api/Dashboard/get-total-task-request-report"
      );
    },

    getUserCountByRole: (): Promise<DASHBOARD_RESPONSE<USER_COUNT_BY_ROLE>> => {
      console.log("Fetching user counts by role from dashboard API");
      return http.get<DASHBOARD_RESPONSE<USER_COUNT_BY_ROLE>>(
        "/api/Dashboard/get-total-user-by-role"
      );
    },

    getTaskCompletionCount: (): Promise<
      DASHBOARD_RESPONSE<TASK_COMPLETION_COUNT>
    > => {
      console.log("Fetching task completion counts from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TASK_COMPLETION_COUNT>>(
        "/api/Dashboard/get-task-completion-count-by-week-and-month"
      );
    },

    // New API methods for the 3 charts
    getTopErrorDevices: (): Promise<DASHBOARD_RESPONSE<TOP_ERROR_DEVICE[]>> => {
      console.log("Fetching top 5 most error-prone devices from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TOP_ERROR_DEVICE[]>>(
        "/api/Dashboard/get-top-5-most-error-devices"
      );
    },

    getTopMechanics: (): Promise<DASHBOARD_RESPONSE<TOP_MECHANIC[]>> => {
      console.log("Fetching top 3 best mechanics from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TOP_MECHANIC[]>>(
        "/api/Dashboard/get-top-3-mechanics"
      );
    },

    getMonthlyRequestCount: (): Promise<
      DASHBOARD_RESPONSE<MONTHLY_REQUEST_COUNT[]>
    > => {
      console.log(
        "Fetching monthly request count for last 6 months from dashboard API"
      );
      return http.get<DASHBOARD_RESPONSE<MONTHLY_REQUEST_COUNT[]>>(
        "/api/Dashboard/get-monthly-request-count-for-last-6-months"
      );
    },

    getRequestsWithReport: (): Promise<
      DASHBOARD_RESPONSE<REQUEST_WITH_REPORT[]>
    > => {
      console.log("Fetching requests with reports from dashboard API");
      return http.get<DASHBOARD_RESPONSE<REQUEST_WITH_REPORT[]>>(
        "/api/Dashboard/get-requests-contain-report"
      );
    },
  };
}

export const apiClient = new APIClient();
